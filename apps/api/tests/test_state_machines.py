import pytest
import uuid
from app.models.enums import (
    AssignmentStatus,
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
    TeamStatus,
    TeamType,
)
from app.models.incident import Incident
from app.models.assignment import Assignment
from app.models.team import ResponseTeam
from app.services.state_machine import IncidentStateMachine, AssignmentStateMachine
from fastapi import HTTPException


def test_incident_state_machine_valid_transitions():
    inc = Incident(
        id=str(uuid.uuid4()),
        tracking_id="INC-TEST-01",
        title="Test Incident",
        category=IncidentCategory.FLOOD,
        severity=IncidentSeverity.HIGH,
        status=IncidentStatus.REPORTED,
    )

    # REPORTED -> VERIFIED
    IncidentStateMachine.transition(inc, IncidentStatus.VERIFIED, comment="Operator confirmed")
    assert inc.status == IncidentStatus.VERIFIED

    # VERIFIED -> ASSIGNED
    IncidentStateMachine.transition(inc, IncidentStatus.ASSIGNED, comment="Team dispatched")
    assert inc.status == IncidentStatus.ASSIGNED

    # ASSIGNED -> IN_PROGRESS
    IncidentStateMachine.transition(inc, IncidentStatus.IN_PROGRESS, comment="Operations active")
    assert inc.status == IncidentStatus.IN_PROGRESS

    # IN_PROGRESS -> RESOLVED
    IncidentStateMachine.transition(inc, IncidentStatus.RESOLVED, comment="Rescued successfully")
    assert inc.status == IncidentStatus.RESOLVED

    # RESOLVED -> CLOSED
    IncidentStateMachine.transition(inc, IncidentStatus.CLOSED, comment="After-action report filed")
    assert inc.status == IncidentStatus.CLOSED


def test_incident_state_machine_invalid_transitions():
    inc = Incident(
        id=str(uuid.uuid4()),
        tracking_id="INC-TEST-02",
        title="Test Incident 2",
        category=IncidentCategory.FIRE,
        severity=IncidentSeverity.MEDIUM,
        status=IncidentStatus.REPORTED,
    )

    # REPORTED -> IN_PROGRESS is forbidden (must be verified & assigned first)
    with pytest.raises(HTTPException) as exc_info:
        IncidentStateMachine.transition(inc, IncidentStatus.IN_PROGRESS)
    assert exc_info.value.status_code == 409
    assert "Illegal incident transition" in exc_info.value.detail

    # Move to CLOSED
    inc.status = IncidentStatus.CLOSED
    # CLOSED -> REPORTED is terminal and forbidden
    with pytest.raises(HTTPException) as exc_info:
        IncidentStateMachine.transition(inc, IncidentStatus.REPORTED)
    assert exc_info.value.status_code == 409


def test_assignment_state_machine_valid_transitions():
    # Verify can_transition checks
    assert AssignmentStateMachine.can_transition(AssignmentStatus.OFFERED, AssignmentStatus.ACCEPTED)
    assert AssignmentStateMachine.can_transition(AssignmentStatus.OFFERED, AssignmentStatus.DECLINED)
    assert AssignmentStateMachine.can_transition(AssignmentStatus.OFFERED, AssignmentStatus.EXPIRED)
    assert AssignmentStateMachine.can_transition(AssignmentStatus.ACCEPTED, AssignmentStatus.EN_ROUTE)
    assert AssignmentStateMachine.can_transition(AssignmentStatus.EN_ROUTE, AssignmentStatus.ON_SCENE)
    assert AssignmentStateMachine.can_transition(AssignmentStatus.ON_SCENE, AssignmentStatus.COMPLETED)


def test_assignment_state_machine_forbidden_transitions():
    # Cannot jump from OFFERED directly to COMPLETED
    assert not AssignmentStateMachine.can_transition(AssignmentStatus.OFFERED, AssignmentStatus.COMPLETED)
    # Terminal states cannot transition to anything
    assert not AssignmentStateMachine.can_transition(AssignmentStatus.COMPLETED, AssignmentStatus.ACCEPTED)
    assert not AssignmentStateMachine.can_transition(AssignmentStatus.DECLINED, AssignmentStatus.ON_SCENE)
    assert not AssignmentStateMachine.can_transition(AssignmentStatus.EXPIRED, AssignmentStatus.EN_ROUTE)
