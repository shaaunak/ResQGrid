import asyncio
import random
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.algorithms.matching_engine import rank_teams_for_incident
from app.algorithms.priority_engine import calculate_priority_score
from app.api.deps import get_current_user, get_optional_current_user, require_roles
from app.core.database import get_db
from app.models.assignment import Assignment
from app.models.enums import (
    AssignmentStatus,
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
    MovementType,
    ReservationStatus,
    TeamStatus,
    UserRole,
)
from app.models.incident import Incident, IncidentEvent, IncidentEvidence
from app.models.inventory import InventoryStock, StockMovement, StockReservation
from app.models.team import ResponseTeam, TeamMember
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.schemas.incident import (
    EscalationRequest,
    IncidentCreate,
    IncidentResponse,
    IncidentVerifyRequest,
)
from app.schemas.team import TeamRecommendation, TeamResponse
from app.services.audit_service import audit_service
from app.services.event_publisher import event_publisher
from app.services.notification_service import notification_service
from app.services.state_machine import IncidentStateMachine

router = APIRouter(prefix="/incidents", tags=["Incidents"])


def generate_tracking_id() -> str:
    """Generate a clean, professional incident tracking ID e.g. INC-48192."""
    digits = random.randint(10000, 99999)
    return f"INC-{digits}"


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    incident_in: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Submit a simulated emergency incident report (Citizen / Public).

    Calculates initial explainable priority score and stages an outbox event.
    """
    tracking_id = generate_tracking_id()

    # Calculate initial priority breakdown
    priority_data = calculate_priority_score(
        severity=incident_in.severity,
        affected_people=incident_in.affected_people,
        category=incident_in.category,
        created_at=datetime.now(timezone.utc),
    )

    incident = Incident(
        tracking_id=tracking_id,
        title=incident_in.title,
        description=incident_in.description,
        category=incident_in.category,
        severity=incident_in.severity,
        status=IncidentStatus.REPORTED,
        affected_people=incident_in.affected_people,
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        address=incident_in.address,
        reporter_id=current_user.id if current_user else None,
        reporter_phone=incident_in.reporter_phone,
        is_simulated=incident_in.is_simulated,
        priority_score=priority_data["total_score"],
        priority_breakdown=priority_data,
    )
    db.add(incident)
    await db.flush()

    # Record initial lifecycle event
    event = IncidentEvent(
        incident_id=incident.id,
        previous_status=None,
        new_status=IncidentStatus.REPORTED,
        actor_id=current_user.id if current_user else None,
        comment="Incident reported and registered in ResQGrid.",
    )
    db.add(event)

    # Stage transactional outbox event
    await event_publisher.stage_outbox_event(
        db=db,
        event_type="INCIDENT_REPORTED",
        payload={
            "incident_id": incident.id,
            "tracking_id": incident.tracking_id,
            "category": incident.category.value,
            "severity": incident.severity.value,
            "priority_score": incident.priority_score,
            "affected_people": incident.affected_people,
        },
        idempotency_key=f"report_{incident.id}",
    )

    await db.commit()

    # Re-fetch with relationships loaded
    result = await db.execute(
        select(Incident)
        .options(selectinload(Incident.events), selectinload(Incident.evidence))
        .where(Incident.id == incident.id)
    )
    return result.scalar_one()


@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    status_filter: Optional[IncidentStatus] = Query(None, alias="status"),
    category: Optional[IncidentCategory] = None,
    severity: Optional[IncidentSeverity] = None,
    search: Optional[str] = None,
    only_mine: bool = False,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """List incidents with multi-faceted filtering.

    Citizens see their own submissions when authenticated or only_mine=true;
    Operators and Coordinators see all system incidents.
    """
    stmt = (
        select(Incident)
        .options(selectinload(Incident.events), selectinload(Incident.evidence))
        .order_by(Incident.priority_score.desc(), Incident.created_at.desc())
    )

    if only_mine and current_user:
        stmt = stmt.where(Incident.reporter_id == current_user.id)
    elif current_user and current_user.role == UserRole.CITIZEN:
        stmt = stmt.where(Incident.reporter_id == current_user.id)

    if status_filter:
        stmt = stmt.where(Incident.status == status_filter)
    if category:
        stmt = stmt.where(Incident.category == category)
    if severity:
        stmt = stmt.where(Incident.severity == severity)
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Incident.title.ilike(search_pattern),
                Incident.description.ilike(search_pattern),
                Incident.address.ilike(search_pattern),
                Incident.tracking_id.ilike(search_pattern),
            )
        )

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/tracking/{tracking_id}", response_model=IncidentResponse)
async def get_incident_by_tracking(tracking_id: str, db: AsyncSession = Depends(get_db)):
    """Public tracking lookup for citizens using unique tracking ID (e.g. INC-48192)."""
    stmt = (
        select(Incident)
        .options(selectinload(Incident.events), selectinload(Incident.evidence))
        .where(Incident.tracking_id == tracking_id.upper())
    )
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with tracking code '{tracking_id}' not found.",
        )
    return incident


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve full incident details including events timeline and evidence metadata."""
    stmt = (
        select(Incident)
        .options(selectinload(Incident.events), selectinload(Incident.evidence))
        .where(Incident.id == incident_id)
    )
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found.",
        )
    return incident


@router.post("/{incident_id}/verify", response_model=IncidentResponse)
async def verify_incident(
    incident_id: str,
    verify_in: IncidentVerifyRequest,
    db: AsyncSession = Depends(get_db),
    operator: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN])),
):
    """Operator verification and triage endpoint.

    Approves incident (moves to VERIFIED, recalculates score) or rejects with mandatory reason.
    """
    stmt = (
        select(Incident)
        .options(selectinload(Incident.events), selectinload(Incident.evidence))
        .where(Incident.id == incident_id)
    )
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    if incident.status != IncidentStatus.REPORTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot verify incident in state '{incident.status.value}'. Must be REPORTED.",
        )

    previous_status = incident.status
    if verify_in.approved:
        incident.status = IncidentStatus.VERIFIED
        incident.verified_by = operator.id
        incident.verified_at = datetime.now(timezone.utc)
        if verify_in.severity_override:
            incident.severity = verify_in.severity_override

        # Recalculate priority with verified attributes
        priority_data = calculate_priority_score(
            severity=incident.severity,
            affected_people=incident.affected_people,
            category=incident.category,
            created_at=incident.created_at,
        )
        incident.priority_score = priority_data["total_score"]
        incident.priority_breakdown = priority_data

        event_comment = f"Verified by Operator {operator.full_name}."
        if verify_in.severity_override:
            event_comment += f" Severity adjusted to {verify_in.severity_override.value}."

        await event_publisher.stage_outbox_event(
            db=db,
            event_type="INCIDENT_VERIFIED",
            payload={
                "incident_id": incident.id,
                "tracking_id": incident.tracking_id,
                "priority_score": incident.priority_score,
                "verified_by": operator.id,
            },
            idempotency_key=f"verify_{incident.id}_{incident.version}_{uuid.uuid4().hex[:6]}",
        )
    else:
        if not verify_in.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection reason is mandatory when declining an emergency incident.",
            )
        incident.status = IncidentStatus.REJECTED
        incident.rejection_reason = verify_in.rejection_reason
        event_comment = f"Rejected by Operator {operator.full_name}. Reason: {verify_in.rejection_reason}"

        await event_publisher.stage_outbox_event(
            db=db,
            event_type="INCIDENT_REJECTED",
            payload={
                "incident_id": incident.id,
                "rejection_reason": verify_in.rejection_reason,
            },
            idempotency_key=f"reject_{incident.id}_{incident.version}_{uuid.uuid4().hex[:6]}",
        )

    # Record event
    event = IncidentEvent(
        incident_id=incident.id,
        previous_status=previous_status,
        new_status=incident.status,
        actor_id=operator.id,
        comment=event_comment,
    )
    db.add(event)

    # Audit log
    await audit_service.log_action(
        db=db,
        action="INCIDENT_TRIAGE",
        resource_type="incident",
        resource_id=incident.id,
        actor_id=operator.id,
        details={"approved": verify_in.approved, "new_status": incident.status.value},
    )

    await db.commit()
    await db.refresh(incident)
    return incident


@router.get("/{incident_id}/recommendations", response_model=List[TeamRecommendation])
async def get_team_recommendations(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN])),
):
    """Compute and rank available response teams for an approved incident

    using the explainable two-stage matching engine.
    """
    stmt = select(Incident).where(Incident.id == incident_id)
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Fetch all active teams
    teams_result = await db.execute(select(ResponseTeam).where(ResponseTeam.status != TeamStatus.OFFLINE))
    teams = teams_result.scalars().all()

    ranked = rank_teams_for_incident(incident=incident, teams=teams)

    # Convert to TeamRecommendation schemas
    recommendations = []
    for item in ranked:
        recommendations.append(
            TeamRecommendation(
                team=TeamResponse.model_validate(item["team"]),
                suitability_score=item["suitability_score"],
                distance_km=item["distance_km"],
                reasons=item["reasons"],
                is_eligible=item["is_eligible"],
            )
        )
    return recommendations


_dispatch_lock = asyncio.Lock()


@router.post("/{incident_id}/assign", response_model=AssignmentResponse)
async def assign_incident(
    incident_id: str,
    assign_in: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    operator: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN])),
):
    async with _dispatch_lock:
        return await _assign_incident_impl(incident_id, assign_in, db, operator)


async def _assign_incident_impl(
    incident_id: str,
    assign_in: AssignmentCreate,
    db: AsyncSession,
    operator: User,
):
    """Concurrency-Safe Dispatch Workflow:

    1. Row-lock incident with SELECT FOR UPDATE
    2. Check optimistic concurrency version
    3. Validate incident state (must be in VERIFIED state)
    4. Guard against duplicate active assignments
    5. Row-lock response team with SELECT FOR UPDATE
    6. Enforce strict team concurrency capacity limit
    7. Detect operator override against suitability recommendations
    8. Atomically reserve requested depot inventory
    9. Create Assignment and update Incident state
    10. Write incident event, outbox event, and audit trail in the same transaction
    """
    # 1. Fetch incident with row lock
    incident_res = await db.execute(
        select(Incident).where(Incident.id == incident_id).with_for_update()
    )
    incident = incident_res.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Optimistic concurrency check
    if assign_in.expected_version is not None and incident.version != assign_in.expected_version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Stale incident record: current version is {incident.version}, client expected {assign_in.expected_version}.",
        )

    # Validate state transition
    if not IncidentStateMachine.can_transition(incident.status, IncidentStatus.ASSIGNED):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Incident in status '{incident.status.value}' cannot be assigned. Must be in VERIFIED state.",
        )

    # Check for existing active assignment
    active_res = await db.execute(
        select(Assignment).where(
            Assignment.incident_id == incident.id,
            Assignment.status.in_([
                AssignmentStatus.OFFERED,
                AssignmentStatus.PENDING,
                AssignmentStatus.ACCEPTED,
                AssignmentStatus.EN_ROUTE,
                AssignmentStatus.ON_SCENE,
            ]),
        )
    )
    if active_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Incident {incident.tracking_id} already has an active mission assignment.",
        )

    # 2. Fetch team with row lock
    team_res = await db.execute(
        select(ResponseTeam).where(ResponseTeam.id == assign_in.team_id).with_for_update()
    )
    team = team_res.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Response team not found.")

    if team.status == TeamStatus.OFFLINE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Team is currently offline and cannot be dispatched.",
        )

    # Concurrency capacity enforcement
    max_concurrent = getattr(team, "max_concurrent_assignments", 1)
    if team.active_assignments_count >= max_concurrent:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Team {team.name} has reached maximum concurrent capacity ({team.active_assignments_count}/{max_concurrent} active missions).",
        )

    # 3. Operator override detection
    all_teams_res = await db.execute(select(ResponseTeam))
    all_teams = all_teams_res.scalars().all()
    ranked = rank_teams_for_incident(incident, all_teams)
    top_team = ranked[0]["team"] if ranked and ranked[0]["is_eligible"] else None
    is_override = bool(top_team and top_team.id != team.id)

    if is_override and not assign_in.override_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team '{team.name}' is an override ({top_team.name} is top recommendation). An explicit override reason is mandatory.",
        )

    recommendation_snapshot = [
        {"team_id": r["team"].id, "team_name": r["team"].name, "suitability_score": r["suitability_score"]}
        for r in ranked[:3]
    ]

    # 4. Create Assignment record
    assignment = Assignment(
        incident_id=incident.id,
        team_id=team.id,
        assigned_by=operator.id,
        status=AssignmentStatus.OFFERED,
        operator_notes=assign_in.operator_notes,
        is_operator_override=is_override,
        recommended_team_id=top_team.id if top_team else None,
        override_reason=assign_in.override_reason,
        recommendation_snapshot=recommendation_snapshot,
    )
    db.add(assignment)
    await db.flush()

    # 5. Atomically reserve supplies if specified
    if assign_in.requested_supplies:
        for req in assign_in.requested_supplies:
            stock_res = await db.execute(
                select(InventoryStock)
                .where(
                    InventoryStock.depot_id == req.depot_id,
                    InventoryStock.item_id == req.item_id,
                )
                .with_for_update()
            )
            stock = stock_res.scalar_one_or_none()
            if not stock or stock.quantity_available < req.quantity:
                available = stock.quantity_available if stock else 0
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Insufficient inventory for requested item at depot. Available: {available}, Requested: {req.quantity}.",
                )

            # Atomic decrement & reservation
            stock.quantity_available -= req.quantity
            stock.quantity_reserved += req.quantity

            # Create reservation entry
            reservation = StockReservation(
                assignment_id=assignment.id,
                depot_id=req.depot_id,
                item_id=req.item_id,
                quantity_reserved=req.quantity,
                quantity_consumed=0,
                status=ReservationStatus.RESERVED,
            )
            db.add(reservation)

            # Record stock movement
            movement = StockMovement(
                item_id=req.item_id,
                from_depot_id=req.depot_id,
                assignment_id=assignment.id,
                quantity=req.quantity,
                movement_type=MovementType.RESERVATION,
                actor_id=operator.id,
                notes=f"Reserved for assignment to incident {incident.tracking_id}",
            )
            db.add(movement)

            # Trigger shortage alert if stock drops below minimum threshold
            if stock.quantity_available <= stock.minimum_threshold:
                notification_service.publish_sns_resource_shortage(
                    depot_name="Depot",
                    item_name="Supplies",
                    remaining=stock.quantity_available,
                )

    # 6. Update Incident & Team status via State Machine
    previous_status = incident.status
    IncidentStateMachine.transition(
        incident,
        IncidentStatus.ASSIGNED,
        actor_id=operator.id,
        comment=f"Assigned to {team.name} by Operator {operator.full_name}."
        + (f" Override: {assign_in.override_reason}" if assign_in.override_reason else ""),
    )
    team.status = TeamStatus.DISPATCHED
    team.active_assignments_count += 1
    team.version += 1

    # 7. Notify team members
    member_res = await db.execute(select(TeamMember).where(TeamMember.team_id == team.id))
    members = member_res.scalars().all()
    for member in members:
        await notification_service.send_in_app(
            db=db,
            user_id=member.user_id,
            title=f"New Mission Assignment: {incident.title}",
            message=f"Team {team.name} assigned to incident {incident.tracking_id} ({incident.address}).",
            notification_type="DISPATCH",
            metadata={"incident_id": incident.id, "assignment_id": assignment.id},
        )

    # 8. Stage transactional outbox event
    await event_publisher.stage_outbox_event(
        db=db,
        event_type="ASSIGNMENT_DISPATCHED",
        payload={
            "assignment_id": assignment.id,
            "incident_id": incident.id,
            "team_id": team.id,
            "team_name": team.name,
            "tracking_id": incident.tracking_id,
            "assigned_by": operator.id,
            "is_override": is_override,
            "override_reason": assign_in.override_reason,
        },
        idempotency_key=f"assign_{assignment.id}",
    )

    # 9. Audit log
    await audit_service.log_action(
        db=db,
        action="DISPATCH_TEAM",
        resource_type="assignment",
        resource_id=assignment.id,
        actor_id=operator.id,
        details={
            "incident_id": incident.id,
            "team_id": team.id,
            "is_override": is_override,
            "override_reason": assign_in.override_reason,
        },
    )

    await db.commit()

    # Re-fetch assignment with relationships
    final_res = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.team), selectinload(Assignment.stock_reservations))
        .where(Assignment.id == assignment.id)
    )
    return final_res.scalar_one()


@router.post("/{incident_id}/escalate", response_model=IncidentResponse)
async def escalate_incident(
    incident_id: str,
    esc_in: EscalationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN, UserRole.RESPONDER])),
):
    """Escalate an incident independently of its lifecycle state.

    Can be escalated while VERIFIED, ASSIGNED, or IN_PROGRESS.
    Stores escalation metadata and broadcasts an SNS critical escalation event.
    """
    stmt = (
        select(Incident)
        .options(selectinload(Incident.events), selectinload(Incident.evidence))
        .where(Incident.id == incident_id)
        .with_for_update()
    )
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    if incident.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED, IncidentStatus.CANCELLED, IncidentStatus.REJECTED]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot escalate an incident in terminal state '{incident.status.value}'.",
        )

    if incident.is_escalated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incident {incident.tracking_id} is already marked as escalated.",
        )

    now = datetime.now(timezone.utc)
    incident.is_escalated = True
    incident.escalation_reason = esc_in.reason
    incident.escalated_by = user.id
    incident.escalated_at = now
    incident.escalation_resolved_at = None
    incident.version += 1

    event = IncidentEvent(
        incident_id=incident.id,
        previous_status=incident.status,
        new_status=incident.status,
        actor_id=user.id,
        comment=f"CRITICAL ESCALATION by {user.full_name}: {esc_in.reason}",
    )
    db.add(event)

    # Publish outbox escalation event
    await event_publisher.stage_outbox_event(
        db=db,
        event_type="INCIDENT_ESCALATED",
        payload={
            "incident_id": incident.id,
            "tracking_id": incident.tracking_id,
            "title": incident.title,
            "escalation_reason": esc_in.reason,
            "escalated_by": user.id,
        },
        idempotency_key=f"escalate_{incident.id}_{int(now.timestamp())}_{uuid.uuid4().hex[:6]}",
    )

    await db.commit()
    await db.refresh(incident)
    return incident


@router.post("/{incident_id}/de-escalate", response_model=IncidentResponse)
async def deescalate_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN])),
):
    """De-escalate an incident once risk has been mitigated."""
    stmt = (
        select(Incident)
        .options(selectinload(Incident.events), selectinload(Incident.evidence))
        .where(Incident.id == incident_id)
        .with_for_update()
    )
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    if not incident.is_escalated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incident {incident.tracking_id} is not currently escalated.",
        )

    now = datetime.now(timezone.utc)
    incident.is_escalated = False
    incident.escalation_resolved_at = now
    incident.version += 1

    event = IncidentEvent(
        incident_id=incident.id,
        previous_status=incident.status,
        new_status=incident.status,
        actor_id=user.id,
        comment=f"Escalation resolved by Operator {user.full_name}.",
    )
    db.add(event)

    await db.commit()
    await db.refresh(incident)
    return incident

