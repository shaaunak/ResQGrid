import uuid
from datetime import datetime, timezone
from typing import Optional, Set, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assignment import Assignment
from app.models.enums import (
    AssignmentStatus,
    IncidentStatus,
    MovementType,
    OutboxStatus,
    ReservationStatus,
    TeamStatus,
)
from app.models.incident import Incident, IncidentEvent
from app.models.inventory import InventoryStock, StockMovement, StockReservation
from app.models.outbox import OutboxEvent
from app.models.team import ResponseTeam


class IncidentStateMachine:
    """Explicit lifecycle state machine for Incidents.

    Valid transitions:
      REPORTED    -> VERIFIED, REJECTED, CANCELLED
      VERIFIED    -> ASSIGNED, CANCELLED
      ASSIGNED    -> IN_PROGRESS, VERIFIED (all assignments declined/expired), CANCELLED
      IN_PROGRESS -> RESOLVED, VERIFIED (reassignment), CANCELLED
      RESOLVED    -> CLOSED, IN_PROGRESS (reopened)
      CLOSED      -> terminal
      REJECTED    -> terminal
      CANCELLED   -> terminal
    """

    ALLOWED_TRANSITIONS = {
        IncidentStatus.REPORTED: {
            IncidentStatus.VERIFIED,
            IncidentStatus.REJECTED,
            IncidentStatus.CANCELLED,
        },
        IncidentStatus.VERIFIED: {
            IncidentStatus.ASSIGNED,
            IncidentStatus.CANCELLED,
            IncidentStatus.REJECTED,
        },
        IncidentStatus.ASSIGNED: {
            IncidentStatus.IN_PROGRESS,
            IncidentStatus.VERIFIED,  # Fallback when all assignments declined/expired
            IncidentStatus.CANCELLED,
        },
        IncidentStatus.IN_PROGRESS: {
            IncidentStatus.RESOLVED,
            IncidentStatus.VERIFIED,
            IncidentStatus.CANCELLED,
        },
        IncidentStatus.RESOLVED: {
            IncidentStatus.CLOSED,
            IncidentStatus.IN_PROGRESS,
        },
        IncidentStatus.CLOSED: set(),
        IncidentStatus.REJECTED: set(),
        IncidentStatus.CANCELLED: set(),
    }

    @classmethod
    def can_transition(cls, from_status: IncidentStatus, to_status: IncidentStatus) -> bool:
        if from_status == to_status:
            return True
        allowed = cls.ALLOWED_TRANSITIONS.get(from_status, set())
        return to_status in allowed

    @classmethod
    def transition(
        cls,
        incident: Incident,
        to_status: IncidentStatus,
        actor_id: Optional[str] = None,
        comment: str = "",
    ) -> IncidentEvent:
        if not cls.can_transition(incident.status, to_status):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Illegal incident transition from '{incident.status.value}' to '{to_status.value}'.",
            )
        previous_status = incident.status
        incident.status = to_status
        incident.version = (incident.version or 1) + 1
        incident.updated_at = datetime.now(timezone.utc)

        event = IncidentEvent(
            incident_id=incident.id,
            previous_status=previous_status,
            new_status=to_status,
            actor_id=actor_id,
            comment=comment or f"Incident transitioned from {previous_status.value} to {to_status.value}.",
        )
        return event


class AssignmentStateMachine:
    """Explicit lifecycle state machine for Responder Assignments.

    Lifecycle:
      OFFERED (or PENDING) -> ACCEPTED, DECLINED, EXPIRED, CANCELLED
      ACCEPTED             -> EN_ROUTE, CANCELLED, REASSIGNED, DECLINED
      EN_ROUTE             -> ON_SCENE, CANCELLED
      ON_SCENE             -> COMPLETED, CANCELLED
      DECLINED / EXPIRED / CANCELLED / REASSIGNED / COMPLETED -> terminal
    """

    ALLOWED_TRANSITIONS = {
        AssignmentStatus.OFFERED: {
            AssignmentStatus.ACCEPTED,
            AssignmentStatus.DECLINED,
            AssignmentStatus.EXPIRED,
            AssignmentStatus.CANCELLED,
        },
        AssignmentStatus.PENDING: {  # Backward compatibility alias
            AssignmentStatus.ACCEPTED,
            AssignmentStatus.DECLINED,
            AssignmentStatus.EXPIRED,
            AssignmentStatus.CANCELLED,
        },
        AssignmentStatus.ACCEPTED: {
            AssignmentStatus.EN_ROUTE,
            AssignmentStatus.DECLINED,
            AssignmentStatus.CANCELLED,
            AssignmentStatus.REASSIGNED,
        },
        AssignmentStatus.EN_ROUTE: {
            AssignmentStatus.ON_SCENE,
            AssignmentStatus.CANCELLED,
        },
        AssignmentStatus.ON_SCENE: {
            AssignmentStatus.COMPLETED,
            AssignmentStatus.CANCELLED,
        },
        AssignmentStatus.DECLINED: set(),
        AssignmentStatus.EXPIRED: set(),
        AssignmentStatus.CANCELLED: set(),
        AssignmentStatus.REASSIGNED: set(),
        AssignmentStatus.COMPLETED: set(),
    }

    @classmethod
    def can_transition(cls, from_status: AssignmentStatus, to_status: AssignmentStatus) -> bool:
        if from_status == to_status:
            return True
        allowed = cls.ALLOWED_TRANSITIONS.get(from_status, set())
        return to_status in allowed

    @classmethod
    async def transition(
        cls,
        db: AsyncSession,
        assignment: Assignment,
        to_status: AssignmentStatus,
        actor_id: Optional[str] = None,
        reason: Optional[str] = None,
        consumed_supplies: Optional[list] = None,
    ) -> Assignment:
        """Execute state transition with coupled inventory, capacity, and incident synchronization

        in a single atomic database transaction.
        """
        if not cls.can_transition(assignment.status, to_status):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Illegal assignment transition from '{assignment.status.value}' to '{to_status.value}'.",
            )

        now = datetime.now(timezone.utc)
        previous_status = assignment.status
        assignment.status = to_status
        assignment.version = (assignment.version or 1) + 1
        assignment.updated_at = now

        # Ensure relationships are loaded
        incident = assignment.incident
        team = assignment.team

        # State-specific timestamps
        if to_status == AssignmentStatus.ACCEPTED:
            assignment.accepted_at = now
            if incident.status == IncidentStatus.ASSIGNED:
                IncidentStateMachine.transition(
                    incident,
                    IncidentStatus.IN_PROGRESS,
                    actor_id=actor_id,
                    comment=f"Team {team.name} accepted mission. Operation in progress.",
                )

        elif to_status == AssignmentStatus.EN_ROUTE:
            assignment.en_route_at = now
            if incident.status == IncidentStatus.ASSIGNED:
                inc_ev = IncidentStateMachine.transition(
                    incident,
                    IncidentStatus.IN_PROGRESS,
                    actor_id=actor_id,
                    comment=f"Team {team.name} en route to scene.",
                )
                db.add(inc_ev)

        elif to_status == AssignmentStatus.ON_SCENE:
            assignment.on_scene_at = now

        elif to_status == AssignmentStatus.COMPLETED:
            assignment.completed_at = now
            # Process consumed supplies
            if consumed_supplies and assignment.stock_reservations:
                consumed_map = {(cs["depot_id"], cs["item_id"]): cs["quantity"] for cs in consumed_supplies}
                for res in assignment.stock_reservations:
                    if res.status == ReservationStatus.RESERVED:
                        qty_used = consumed_map.get((res.depot_id, res.item_id), res.quantity_reserved)
                        qty_used = min(qty_used, res.quantity_reserved)
                        qty_returned = res.quantity_reserved - qty_used

                        # Lock and update stock
                        stock_res = await db.execute(
                            select(InventoryStock)
                            .where(
                                InventoryStock.depot_id == res.depot_id,
                                InventoryStock.item_id == res.item_id,
                            )
                            .with_for_update()
                        )
                        stock = stock_res.scalar_one_or_none()
                        if stock:
                            stock.quantity_reserved = max(0, stock.quantity_reserved - res.quantity_reserved)
                            if qty_returned > 0:
                                stock.quantity_available += qty_returned

                        res.quantity_consumed = qty_used
                        res.status = ReservationStatus.CONSUMED
            else:
                # Default all reserved to consumed
                for res in assignment.stock_reservations:
                    if res.status == ReservationStatus.RESERVED:
                        stock_res = await db.execute(
                            select(InventoryStock)
                            .where(
                                InventoryStock.depot_id == res.depot_id,
                                InventoryStock.item_id == res.item_id,
                            )
                            .with_for_update()
                        )
                        stock = stock_res.scalar_one_or_none()
                        if stock:
                            stock.quantity_reserved = max(0, stock.quantity_reserved - res.quantity_reserved)
                        res.quantity_consumed = res.quantity_reserved
                        res.status = ReservationStatus.CONSUMED

            # Release team capacity
            team.active_assignments_count = max(0, team.active_assignments_count - 1)
            if team.active_assignments_count == 0:
                team.status = TeamStatus.AVAILABLE

            # Check if all active assignments for this incident are completed
            active_check = await db.execute(
                select(Assignment.id).where(
                    Assignment.incident_id == incident.id,
                    Assignment.id != assignment.id,
                    Assignment.status.in_([
                        AssignmentStatus.OFFERED,
                        AssignmentStatus.PENDING,
                        AssignmentStatus.ACCEPTED,
                        AssignmentStatus.EN_ROUTE,
                        AssignmentStatus.ON_SCENE,
                    ]),
                )
            )
            has_other_active = active_check.scalars().first() is not None

            if not has_other_active and incident.status in [IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS]:
                inc_ev = IncidentStateMachine.transition(
                    incident,
                    IncidentStatus.RESOLVED,
                    actor_id=actor_id,
                    comment=f"All teams completed missions. Incident {incident.tracking_id} marked resolved.",
                )
                db.add(inc_ev)

        elif to_status in {
            AssignmentStatus.DECLINED,
            AssignmentStatus.EXPIRED,
            AssignmentStatus.CANCELLED,
            AssignmentStatus.REASSIGNED,
        }:
            # Coupling de-allocation: release capacity and inventory
            if to_status == AssignmentStatus.DECLINED:
                assignment.declined_at = now
                assignment.declination_reason = reason
            elif to_status == AssignmentStatus.EXPIRED:
                assignment.expired_at = now
            elif to_status == AssignmentStatus.CANCELLED:
                assignment.cancelled_at = now
            elif to_status == AssignmentStatus.REASSIGNED:
                assignment.reassigned_at = now

            # 1. Release team capacity
            team.active_assignments_count = max(0, team.active_assignments_count - 1)
            if team.active_assignments_count == 0:
                team.status = TeamStatus.AVAILABLE

            # 2. Release active stock reservations atomically
            for res in assignment.stock_reservations:
                if res.status == ReservationStatus.RESERVED:
                    stock_res = await db.execute(
                        select(InventoryStock)
                        .where(
                            InventoryStock.depot_id == res.depot_id,
                            InventoryStock.item_id == res.item_id,
                        )
                        .with_for_update()
                    )
                    stock = stock_res.scalar_one_or_none()
                    if stock:
                        stock.quantity_available += res.quantity_reserved
                        stock.quantity_reserved = max(0, stock.quantity_reserved - res.quantity_reserved)

                    # Movement record for release
                    movement = StockMovement(
                        item_id=res.item_id,
                        from_depot_id=res.depot_id,
                        assignment_id=assignment.id,
                        quantity=res.quantity_reserved,
                        movement_type=MovementType.RELEASE,
                        actor_id=actor_id,
                        notes=f"Released due to assignment {to_status.value}.",
                    )
                    db.add(movement)
                    res.status = ReservationStatus.RELEASED

            # 3. If no active assignments remain, return incident to VERIFIED queue
            active_check = await db.execute(
                select(Assignment.id).where(
                    Assignment.incident_id == incident.id,
                    Assignment.id != assignment.id,
                    Assignment.status.in_([
                        AssignmentStatus.OFFERED,
                        AssignmentStatus.PENDING,
                        AssignmentStatus.ACCEPTED,
                        AssignmentStatus.EN_ROUTE,
                        AssignmentStatus.ON_SCENE,
                    ]),
                )
            )
            has_other_active = active_check.scalars().first() is not None

            if not has_other_active and incident.status in [IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS]:
                IncidentStateMachine.transition(
                    incident,
                    IncidentStatus.VERIFIED,
                    actor_id=actor_id,
                    comment=f"Assignment {assignment.id[:8]} {to_status.value}. Returned incident to dispatch queue.",
                )

        # 4. Outbox publication
        outbox_event = OutboxEvent(
            event_type=f"ASSIGNMENT_{to_status.value}",
            payload={
                "assignment_id": assignment.id,
                "incident_id": incident.id,
                "tracking_id": incident.tracking_id,
                "team_id": team.id,
                "team_name": team.name,
                "previous_status": previous_status.value,
                "new_status": to_status.value,
                "reason": reason,
            },
            status=OutboxStatus.PENDING,
            idempotency_key=f"ASSIGNMENT_{assignment.id}_{to_status.value}_{uuid.uuid4().hex[:8]}",
        )
        db.add(outbox_event)

        return assignment
