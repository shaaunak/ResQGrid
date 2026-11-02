from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.assignment import Assignment
from app.models.enums import (
    AssignmentStatus,
    IncidentStatus,
    MovementType,
    ReservationStatus,
    TeamStatus,
    UserRole,
)
from app.models.incident import Incident, IncidentEvent
from app.models.inventory import InventoryStock, StockMovement, StockReservation
from app.models.team import ResponseTeam, TeamMember
from app.models.user import User
from app.schemas.assignment import AssignmentResponse, AssignmentStatusUpdate
from app.services.audit_service import audit_service
from app.services.event_publisher import event_publisher
from app.services.state_machine import AssignmentStateMachine, IncidentStateMachine

router = APIRouter(prefix="/assignments", tags=["Assignments & Responder Missions"])


@router.get("", response_model=List[AssignmentResponse])
async def list_assignments(
    status_filter: Optional[AssignmentStatus] = Query(None, alias="status"),
    team_id: Optional[str] = None,
    only_my_team: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List assignments. Responders see tasks for teams they are a member of;

    Operators and Coordinators see all assignments.
    """
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.team),
            selectinload(Assignment.stock_reservations),
            selectinload(Assignment.incident),
        )
        .order_by(Assignment.created_at.desc())
    )

    if current_user.role == UserRole.RESPONDER or only_my_team:
        # Find responder's team memberships
        member_res = await db.execute(
            select(TeamMember.team_id).where(TeamMember.user_id == current_user.id)
        )
        my_team_ids = member_res.scalars().all()
        if not my_team_ids:
            return []
        stmt = stmt.where(Assignment.team_id.in_(my_team_ids))
    elif team_id:
        stmt = stmt.where(Assignment.team_id == team_id)

    if status_filter:
        stmt = stmt.where(Assignment.status == status_filter)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Retrieve full details of an assignment mission."""
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.team),
            selectinload(Assignment.stock_reservations),
            selectinload(Assignment.incident),
        )
        .where(Assignment.id == assignment_id)
    )
    result = await db.execute(stmt)
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    return assignment


@router.patch("/{assignment_id}/status", response_model=AssignmentResponse)
async def update_mission_status(
    assignment_id: str,
    status_in: AssignmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.RESPONDER, UserRole.OPERATOR, UserRole.ADMIN])),
):
    """Responder mission lifecycle update:

    PENDING -> ACCEPTED -> EN_ROUTE -> ON_SCENE -> COMPLETED (or DECLINED).
    Strict authorization check: responder must belong to the assigned team!
    """
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.team),
            selectinload(Assignment.stock_reservations),
            selectinload(Assignment.incident),
        )
        .where(Assignment.id == assignment_id)
        .with_for_update()
    )
    result = await db.execute(stmt)
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Responder authorization check
    if current_user.role == UserRole.RESPONDER:
        member_res = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == assignment.team_id,
                TeamMember.user_id == current_user.id,
            )
        )
        if not member_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only update missions belonging to your authorized team.",
            )

    new_status = status_in.status
    if status_in.responder_notes:
        assignment.responder_notes = status_in.responder_notes

    # Convert consumed supplies schema to dict list if present
    consumed_list = None
    if status_in.consumed_supplies:
        consumed_list = [{"depot_id": c.depot_id, "item_id": c.item_id, "quantity": c.quantity} for c in status_in.consumed_supplies]

    # Execute atomic coupled state transition
    await AssignmentStateMachine.transition(
        db=db,
        assignment=assignment,
        to_status=new_status,
        actor_id=current_user.id,
        reason=status_in.declination_reason,
        consumed_supplies=consumed_list,
    )

    # Audit log
    await audit_service.log_action(
        db=db,
        action="UPDATE_MISSION_STATUS",
        resource_type="assignment",
        resource_id=assignment.id,
        actor_id=current_user.id,
        details={"new_status": new_status.value, "notes": status_in.responder_notes},
    )

    await db.commit()
    await db.refresh(assignment)
    return assignment

