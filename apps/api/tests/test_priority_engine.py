from datetime import datetime, timedelta, timezone
from app.algorithms.priority_engine import (
    WEIGHT_IMPACT,
    WEIGHT_SEVERITY,
    WEIGHT_VULNERABILITY,
    WEIGHT_WAIT_TIME,
    calculate_priority_score,
)
from app.models.enums import IncidentCategory, IncidentSeverity


def test_priority_weights_sum_to_one():
    total_weights = WEIGHT_SEVERITY + WEIGHT_IMPACT + WEIGHT_WAIT_TIME + WEIGHT_VULNERABILITY
    assert round(total_weights, 4) == 1.0


def test_critical_flood_urgency_higher_than_minor_incident():
    now = datetime.now(timezone.utc)
    critical_flood = calculate_priority_score(
        severity=IncidentSeverity.CRITICAL,
        affected_people=25,
        category=IncidentCategory.FLOOD,
        created_at=now - timedelta(minutes=30),
        as_of_time=now,
    )

    minor_supplies = calculate_priority_score(
        severity=IncidentSeverity.LOW,
        affected_people=1,
        category=IncidentCategory.OTHER,
        created_at=now - timedelta(minutes=2),
        as_of_time=now,
    )

    assert critical_flood["total_score"] > minor_supplies["total_score"]
    assert critical_flood["total_score"] >= 80.0
    assert minor_supplies["total_score"] < 45.0
    assert "Severity 'CRITICAL'" in critical_flood["explanation"]


def test_waiting_time_increases_priority():
    now = datetime.now(timezone.utc)
    immediate_incident = calculate_priority_score(
        severity=IncidentSeverity.MEDIUM,
        affected_people=5,
        category=IncidentCategory.SUPPLIES,
        created_at=now,
        as_of_time=now,
    )

    waiting_incident = calculate_priority_score(
        severity=IncidentSeverity.MEDIUM,
        affected_people=5,
        category=IncidentCategory.SUPPLIES,
        created_at=now - timedelta(minutes=40),
        as_of_time=now,
    )

    assert waiting_incident["total_score"] > immediate_incident["total_score"]
    assert waiting_incident["wait_time_factor"] > immediate_incident["wait_time_factor"]

