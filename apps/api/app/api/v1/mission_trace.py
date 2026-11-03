import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.enums import UserRole, IncidentStatus, AssignmentStatus, OutboxStatus
from app.models.incident import Incident, IncidentEvent, IncidentEvidence
from app.models.assignment import Assignment
from app.models.team import ResponseTeam
from app.models.inventory import StockReservation, StockMovement, Depot, InventoryItem
from app.models.outbox import OutboxEvent
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.mission_trace import (
    MissionTraceResponse,
    TraceOrigin,
    TraceOriginEvidence,
    TraceOriginMergedReport,
    TracePriority,
    TraceAssignment,
    TraceCandidateSquad,
    TraceInventoryItem,
    TraceStockMovement,
    TraceCloudOutboxEvent,
    TraceTimelineEvent,
    TraceDurations,
)
from app.services.storage import storage_service

router = APIRouter(prefix="/incidents", tags=["Mission Trace"])


def format_duration(seconds: Optional[int]) -> Optional[str]:
    if seconds is None:
        return None
    if seconds < 0:
        seconds = 0
    hrs = seconds // 3600
    mins = (seconds % 3600) // 60
    secs = seconds % 60
    parts = []
    if hrs > 0:
        parts.append(f"{hrs}h")
    if mins > 0 or hrs > 0:
        parts.append(f"{mins}m")
    parts.append(f"{secs}s")
    return " ".join(parts)


def compute_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


async def build_mission_trace_data(incident_identifier: str, db: AsyncSession) -> Dict[str, Any]:
    """Forensically reassemble all database records for an incident into a coherent Mission Trace."""
    # 1. Fetch incident by id or tracking_id
    query = (
        select(Incident)
        .options(
            selectinload(Incident.events),
            selectinload(Incident.evidence),
            selectinload(Incident.merged_reports),
            selectinload(Incident.verifier),
            selectinload(Incident.reporter),
        )
        .where(
            (Incident.id == incident_identifier)
            | (Incident.tracking_id == incident_identifier.upper())
        )
    )
    result = await db.execute(query)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_identifier}' not found in database records.",
        )

    # 2. Fetch all assignments for this incident
    asg_query = (
        select(Assignment)
        .options(
            selectinload(Assignment.team),
            selectinload(Assignment.dispatcher),
            selectinload(Assignment.stock_reservations).joinedload(StockReservation.depot),
            selectinload(Assignment.stock_reservations).joinedload(StockReservation.item),
        )
        .where(Assignment.incident_id == incident.id)
        .order_by(Assignment.created_at.asc())
    )
    asg_res = await db.execute(asg_query)
    assignments = asg_res.scalars().all()

    # 3. Fetch all Stock Movements for assignments of this incident
    assignment_ids = [a.id for a in assignments]
    stock_movements = []
    if assignment_ids:
        mov_query = (
            select(StockMovement)
            .options(
                selectinload(StockMovement.item),
                selectinload(StockMovement.from_depot),
                selectinload(StockMovement.to_depot),
                selectinload(StockMovement.actor),
            )
            .where(StockMovement.assignment_id.in_(assignment_ids))
            .order_by(StockMovement.created_at.asc())
        )
        mov_res = await db.execute(mov_query)
        stock_movements = mov_res.scalars().all()

    # 4. Fetch Outbox Events matching incident_id or tracking_id in payload
    all_outbox_query = select(OutboxEvent).order_by(OutboxEvent.created_at.asc())
    all_outbox = (await db.execute(all_outbox_query)).scalars().all()
    matched_outbox = [
        o for o in all_outbox
        if incident.id in str(o.payload) or incident.tracking_id in str(o.payload) or any(a.id in str(o.payload) for a in assignments)
    ]

    # 5. Fetch Audit Logs matching resource_id or details
    all_audits_query = (
        select(AuditLog)
        .options(selectinload(AuditLog.actor))
        .order_by(AuditLog.created_at.asc())
    )
    all_audits = (await db.execute(all_audits_query)).scalars().all()
    matched_audits = [
        al for al in all_audits
        if al.resource_id == incident.id
        or incident.id in str(al.details_json or "")
        or any(al.resource_id == a.id for a in assignments)
    ]

    # 6. Fetch all users involved for actor names
    user_ids = set()
    for ev in incident.events:
        if ev.actor_id:
            user_ids.add(ev.actor_id)
    for al in matched_audits:
        if al.actor_id:
            user_ids.add(al.actor_id)
    user_map = {}
    if user_ids:
        users = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all()
        user_map = {u.id: u for u in users}

    # Fetch all response teams for distance calculation in snapshots
    teams_all = (await db.execute(select(ResponseTeam))).scalars().all()
    team_map = {t.id: t for t in teams_all}

    # --- SECTION A: INCIDENT ORIGIN ---
    origin_evidence = [
        TraceOriginEvidence(
            id=ev.id,
            evidence_type=ev.evidence_type,
            s3_key=ev.s3_key,
            file_name=ev.file_name,
            file_size=ev.file_size,
            mime_type=ev.mime_type,
            file_url=storage_service.generate_download_url(ev.s3_key) if ev.s3_key else None,
            created_at=ev.created_at,
        )
        for ev in (incident.evidence or [])
    ]

    origin_merged = [
        TraceOriginMergedReport(
            id=m.id,
            tracking_id=m.tracking_id,
            title=m.title,
            description=m.description,
            affected_people=m.affected_people,
            created_at=m.created_at,
        )
        for m in (incident.merged_reports or [])
    ]

    trace_origin = TraceOrigin(
        incident_id=incident.id,
        tracking_id=incident.tracking_id,
        title=incident.title,
        description=incident.description,
        category=incident.category,
        severity=incident.severity,
        status=incident.status,
        affected_people=incident.affected_people,
        latitude=incident.latitude,
        longitude=incident.longitude,
        address=incident.address,
        reporter_id=incident.reporter_id,
        reporter_phone=incident.reporter_phone,
        is_simulated=incident.is_simulated,
        is_escalated=incident.is_escalated,
        escalation_reason=incident.escalation_reason,
        report_count=incident.report_count,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        verified_by_id=incident.verified_by,
        verified_by_name=incident.verifier.full_name if incident.verifier else None,
        verified_at=incident.verified_at,
        rejection_reason=incident.rejection_reason,
        evidence=origin_evidence,
        merged_reports=origin_merged,
    )

    # --- SECTION B: EXPLAINABLE PRIORITY ---
    breakdown = incident.priority_breakdown or {}
    trace_priority = TracePriority(
        severity_factor=float(breakdown.get("severity_factor", 0.0)),
        impact_factor=float(breakdown.get("impact_factor", 0.0)),
        wait_time_factor=float(breakdown.get("wait_time_factor", 0.0)),
        vulnerability_factor=float(breakdown.get("vulnerability_factor", 0.0)),
        total_score=float(breakdown.get("total_score", incident.priority_score)),
        explanation=str(breakdown.get("explanation", "Calculated by ResQGrid Priority Engine")),
        config_version=str(breakdown.get("config_version", "v1.2")),
        scoring_timestamp=breakdown.get("scoring_timestamp"),
        input_snapshot=breakdown.get("input_snapshot"),
        academic_disclaimer=breakdown.get("academic_disclaimer"),
    )

    # --- SECTION C: TEAM SELECTION ---
    trace_assignments: List[TraceAssignment] = []
    for asg in assignments:
        rec_team = team_map.get(asg.recommended_team_id) if asg.recommended_team_id else None
        
        # Reconstruct candidate snapshot
        candidates: List[TraceCandidateSquad] = []
        raw_snapshot = asg.recommendation_snapshot or []
        for s in raw_snapshot:
            t_obj = team_map.get(s.get("team_id"))
            dist = compute_haversine(
                incident.latitude, incident.longitude,
                t_obj.current_latitude if t_obj else incident.latitude,
                t_obj.current_longitude if t_obj else incident.longitude,
            ) if t_obj else None

            candidates.append(
                TraceCandidateSquad(
                    team_id=s.get("team_id", ""),
                    team_name=s.get("team_name", t_obj.name if t_obj else "Unknown"),
                    team_type=t_obj.team_type.value if t_obj else "MULTI_HAZARD",
                    base_location=t_obj.base_location_name if t_obj else "Mumbai Station",
                    distance_km=dist,
                    suitability_score=float(s.get("suitability_score", 0.0)),
                    is_recommended=(s.get("team_id") == asg.recommended_team_id or s == raw_snapshot[0]),
                    is_eligible=True,
                    active_assignments_count=t_obj.active_assignments_count if t_obj else 0,
                    capacity=t_obj.capacity if t_obj else 5,
                    qualifications=t_obj.qualifications or [] if t_obj else [],
                )
            )

        trace_assignments.append(
            TraceAssignment(
                assignment_id=asg.id,
                team_id=asg.team_id,
                team_name=asg.team.name if asg.team else "Squad",
                team_type=asg.team.team_type.value if asg.team else "MULTI_HAZARD",
                assigned_by_id=asg.assigned_by,
                assigned_by_name=asg.dispatcher.full_name if asg.dispatcher else "Operator",
                status=asg.status,
                is_operator_override=asg.is_operator_override,
                override_reason=asg.override_reason,
                operator_notes=asg.operator_notes,
                responder_notes=asg.responder_notes,
                declination_reason=asg.declination_reason,
                recommended_team_id=asg.recommended_team_id,
                recommended_team_name=rec_team.name if rec_team else (candidates[0].team_name if candidates else None),
                candidate_snapshots=candidates,
                assigned_at=asg.assigned_at,
                accepted_at=asg.accepted_at,
                declined_at=asg.declined_at,
                en_route_at=asg.en_route_at,
                on_scene_at=asg.on_scene_at,
                completed_at=asg.completed_at,
                cancelled_at=asg.cancelled_at,
                reassigned_at=asg.reassigned_at,
                team_base_latitude=asg.team.base_latitude if asg.team else incident.latitude,
                team_base_longitude=asg.team.base_longitude if asg.team else incident.longitude,
                team_current_latitude=asg.team.current_latitude if asg.team else incident.latitude,
                team_current_longitude=asg.team.current_longitude if asg.team else incident.longitude,
            )
        )

    # --- SECTION D: INVENTORY ALLOCATION ---
    trace_inventory: List[TraceInventoryItem] = []
    for asg in assignments:
        for resv in asg.stock_reservations:
            qty_res = resv.quantity_reserved
            qty_cons = resv.quantity_consumed
            qty_rel = max(0, qty_res - qty_cons) if resv.status.value in ["CONSUMED", "RELEASED", "CANCELLED"] else 0

            trace_inventory.append(
                TraceInventoryItem(
                    reservation_id=resv.id,
                    assignment_id=asg.id,
                    depot_id=resv.depot_id,
                    depot_name=resv.depot.name if resv.depot else "Depot",
                    depot_location=resv.depot.location_name if resv.depot else "Mumbai",
                    item_id=resv.item_id,
                    item_name=resv.item.name if resv.item else "Resource Item",
                    item_sku=resv.item.sku if resv.item else "SKU-000",
                    unit=resv.item.unit if resv.item else "units",
                    quantity_reserved=qty_res,
                    quantity_consumed=qty_cons,
                    quantity_released=qty_rel,
                    status=resv.status.value,
                    created_at=resv.created_at,
                    updated_at=resv.updated_at,
                )
            )

    trace_stock_movements = [
        TraceStockMovement(
            id=m.id,
            item_name=m.item.name if m.item else "Item",
            quantity=m.quantity,
            movement_type=m.movement_type.value,
            from_depot_name=m.from_depot.name if m.from_depot else None,
            to_depot_name=m.to_depot.name if m.to_depot else None,
            actor_name=m.actor.full_name if m.actor else None,
            notes=m.notes,
            created_at=m.created_at,
        )
        for m in stock_movements
    ]

    # --- SECTION E: CLOUD EVENT PROCESSING ---
    trace_outbox: List[TraceCloudOutboxEvent] = []
    for ob in matched_outbox:
        # Extract correlation ID and SQS delivery state honestly
        payload = ob.payload or {}
        corr_id = payload.get("correlation_id") or payload.get("tracking_id") or incident.tracking_id
        sqs_id = payload.get("sqs_message_id")
        
        # Transparent cloud delivery diagnosis
        if ob.status == OutboxStatus.PUBLISHED:
            cloud_status = "PROCESSED_BY_LOCAL_RELAY" if not sqs_id else "DELIVERED_TO_AWS_SQS"
            worker_notes = "Worker successfully processed event logic and committed state."
        elif ob.status == OutboxStatus.FAILED:
            cloud_status = "DEAD_LETTER_QUEUE_EXHAUSTED"
            worker_notes = f"Exceeded retry threshold ({ob.retry_count}). Error: {ob.last_error or 'Execution failed'}"
        else:
            cloud_status = "STAGED_IN_TRANSACTIONAL_OUTBOX_PENDING_DISPATCH"
            worker_notes = "Awaiting worker polling iteration."

        trace_outbox.append(
            TraceCloudOutboxEvent(
                id=ob.id,
                event_type=ob.event_type,
                status=ob.status.value,
                idempotency_key=ob.idempotency_key,
                retry_count=ob.retry_count,
                last_error=ob.last_error,
                created_at=ob.created_at,
                processed_at=ob.processed_at,
                correlation_id=corr_id,
                cloud_delivery_status=cloud_status,
                sqs_message_id=sqs_id,
                worker_notes=worker_notes,
                payload=payload,
            )
        )

    # --- SECTION F: SYNCHRONIZED TIMELINE ---
    timeline_events: List[TraceTimelineEvent] = []

    # 1. Incident Lifecycle Events
    for ev in incident.events:
        act = user_map.get(ev.actor_id) if ev.actor_id else None
        prev_st = ev.previous_status.value if ev.previous_status else None
        new_st = ev.new_status.value

        title = f"Incident Status: {new_st}"
        if prev_st is None:
            title = "Citizen Emergency Registered"
        elif "Merged" in (ev.comment or ""):
            title = "Corroborating Report Merged"
        elif new_st == "VERIFIED":
            title = "Incident Triage & Verification"
        elif new_st == "ASSIGNED":
            title = "Tactical Unit Dispatched"
        elif new_st == "IN_PROGRESS":
            title = "Operations Commenced On Scene"
        elif new_st == "RESOLVED":
            title = "Emergency Incident Resolved"

        timeline_events.append(
            TraceTimelineEvent(
                id=f"inc_ev_{ev.id}",
                category="INCIDENT",
                event_type=f"INCIDENT_{new_st}",
                title=title,
                description=ev.comment or f"Transitioned from {prev_st or 'INITIAL'} to {new_st}.",
                previous_state=prev_st,
                new_state=new_st,
                actor_id=ev.actor_id,
                actor_name=act.full_name if act else ("Citizen Reporter" if prev_st is None else "Command Center"),
                actor_role=act.role.value if act else ("CITIZEN" if prev_st is None else "OPERATOR"),
                timestamp=ev.created_at,
                relative_time="",
                latitude=incident.latitude,
                longitude=incident.longitude,
                metadata={"incident_id": incident.id, "tracking_id": incident.tracking_id},
            )
        )

    # 2. Assignment State Transitions
    for asg in assignments:
        squad_name = asg.team.name if asg.team else "Squad"
        disp = asg.dispatcher
        
        # Assigned
        timeline_events.append(
            TraceTimelineEvent(
                id=f"asg_disp_{asg.id}",
                category="ASSIGNMENT",
                event_type="ASSIGNMENT_OFFERED",
                title=f"Mission Order Issued: {squad_name}",
                description=f"Operator {disp.full_name if disp else 'Command'} assigned squad to emergency."
                + (f" Override Note: {asg.override_reason}" if asg.is_operator_override else "")
                + (f" Notes: {asg.operator_notes}" if asg.operator_notes else ""),
                previous_state=None,
                new_state=AssignmentStatus.OFFERED.value,
                actor_id=asg.assigned_by,
                actor_name=disp.full_name if disp else "Command Operator",
                actor_role="OPERATOR",
                timestamp=asg.assigned_at,
                relative_time="",
                latitude=asg.team.base_latitude if asg.team else incident.latitude,
                longitude=asg.team.base_longitude if asg.team else incident.longitude,
                metadata={"assignment_id": asg.id, "team_id": asg.team_id, "team_name": squad_name},
            )
        )

        # Accepted
        if asg.accepted_at:
            timeline_events.append(
                TraceTimelineEvent(
                    id=f"asg_acc_{asg.id}",
                    category="ASSIGNMENT",
                    event_type="ASSIGNMENT_ACCEPTED",
                    title=f"Mission Accepted by {squad_name}",
                    description=f"{squad_name} acknowledged mission assignment and initiated briefing.",
                    previous_state=AssignmentStatus.OFFERED.value,
                    new_state=AssignmentStatus.ACCEPTED.value,
                    actor_id=None,
                    actor_name=squad_name,
                    actor_role="RESPONDER",
                    timestamp=asg.accepted_at,
                    relative_time="",
                    latitude=asg.team.base_latitude if asg.team else incident.latitude,
                    longitude=asg.team.base_longitude if asg.team else incident.longitude,
                    metadata={"assignment_id": asg.id},
                )
            )

        # En Route
        if asg.en_route_at:
            timeline_events.append(
                TraceTimelineEvent(
                    id=f"asg_enr_{asg.id}",
                    category="ASSIGNMENT",
                    event_type="ASSIGNMENT_EN_ROUTE",
                    title=f"{squad_name} En Route to Scene",
                    description=f"Unit mobilised with siren/navigation active towards {incident.address}.",
                    previous_state=AssignmentStatus.ACCEPTED.value,
                    new_state=AssignmentStatus.EN_ROUTE.value,
                    actor_id=None,
                    actor_name=squad_name,
                    actor_role="RESPONDER",
                    timestamp=asg.en_route_at,
                    relative_time="",
                    latitude=asg.team.current_latitude if asg.team else incident.latitude,
                    longitude=asg.team.current_longitude if asg.team else incident.longitude,
                    metadata={"assignment_id": asg.id},
                )
            )

        # On Scene
        if asg.on_scene_at:
            timeline_events.append(
                TraceTimelineEvent(
                    id=f"asg_ons_{asg.id}",
                    category="ASSIGNMENT",
                    event_type="ASSIGNMENT_ON_SCENE",
                    title=f"{squad_name} Arrived On Scene",
                    description=f"Unit on-site at {incident.address}. Extraction and containment underway."
                    + (f" Field Note: {asg.responder_notes}" if asg.responder_notes else ""),
                    previous_state=AssignmentStatus.EN_ROUTE.value,
                    new_state=AssignmentStatus.ON_SCENE.value,
                    actor_id=None,
                    actor_name=squad_name,
                    actor_role="RESPONDER",
                    timestamp=asg.on_scene_at,
                    relative_time="",
                    latitude=incident.latitude,
                    longitude=incident.longitude,
                    metadata={"assignment_id": asg.id},
                )
            )

        # Completed
        if asg.completed_at:
            timeline_events.append(
                TraceTimelineEvent(
                    id=f"asg_cmp_{asg.id}",
                    category="ASSIGNMENT",
                    event_type="ASSIGNMENT_COMPLETED",
                    title=f"{squad_name} Mission Completed",
                    description=f"Rescue objectives accomplished successfully at {incident.address}."
                    + (f" Final Note: {asg.responder_notes}" if asg.responder_notes else ""),
                    previous_state=AssignmentStatus.ON_SCENE.value,
                    new_state=AssignmentStatus.COMPLETED.value,
                    actor_id=None,
                    actor_name=squad_name,
                    actor_role="RESPONDER",
                    timestamp=asg.completed_at,
                    relative_time="",
                    latitude=incident.latitude,
                    longitude=incident.longitude,
                    metadata={"assignment_id": asg.id},
                )
            )

    # 3. Inventory Stock Reservations & Movements
    for inv in trace_inventory:
        timeline_events.append(
            TraceTimelineEvent(
                id=f"inv_res_{inv.reservation_id}",
                category="INVENTORY",
                event_type="STOCK_RESERVED",
                title=f"Stock Reserved: {inv.quantity_reserved}x {inv.item_name}",
                description=f"Locked in depot '{inv.depot_name}' ({inv.depot_location}) for response mission. Status: {inv.status}.",
                previous_state=None,
                new_state=inv.status,
                actor_id=None,
                actor_name="Inventory Engine",
                actor_role="SYSTEM",
                timestamp=inv.created_at,
                relative_time="",
                latitude=None,
                longitude=None,
                metadata={"reservation_id": inv.reservation_id, "depot": inv.depot_name, "quantity": inv.quantity_reserved},
            )
        )

    # 4. Outbox Publication Events
    for ob in trace_outbox:
        timeline_events.append(
            TraceTimelineEvent(
                id=f"ob_ev_{ob.id}",
                category="OUTBOX",
                event_type=ob.event_type,
                title=f"Transactional Outbox: {ob.event_type}",
                description=f"Staged with key [{ob.idempotency_key[:24]}...]. Cloud State: {ob.cloud_delivery_status}.",
                previous_state="PENDING",
                new_state=ob.status,
                actor_id=None,
                actor_name="Transactional Outbox Relay",
                actor_role="SYSTEM",
                timestamp=ob.created_at,
                relative_time="",
                latitude=None,
                longitude=None,
                metadata={"outbox_id": ob.id, "correlation_id": ob.correlation_id, "status": ob.status},
            )
        )

    # Sort all events chronologically (stable sort)
    timeline_events.sort(key=lambda x: x.timestamp)

    # Compute relative offsets and elapsed timestamps
    origin_time = incident.created_at
    for ev in timeline_events:
        delta_sec = int((ev.timestamp - origin_time).total_seconds())
        if delta_sec <= 0:
            ev.relative_time = "T+00:00"
        else:
            mins = delta_sec // 60
            secs = delta_sec % 60
            ev.relative_time = f"T+{mins:02d}:{secs:02d}"

    # Calculate exact milestone durations
    now_utc = datetime.now(timezone.utc)
    t_created = incident.created_at.replace(tzinfo=timezone.utc) if incident.created_at.tzinfo is None else incident.created_at
    incident_age_sec = int((now_utc - t_created).total_seconds())

    t_verify_sec = None
    if incident.verified_at:
        t_v = incident.verified_at.replace(tzinfo=timezone.utc) if incident.verified_at.tzinfo is None else incident.verified_at
        t_verify_sec = max(0, int((t_v - t_created).total_seconds()))

    t_assign_sec = None
    if assignments and assignments[0].assigned_at:
        t_a = assignments[0].assigned_at.replace(tzinfo=timezone.utc) if assignments[0].assigned_at.tzinfo is None else assignments[0].assigned_at
        t_assign_sec = max(0, int((t_a - t_created).total_seconds()))

    t_accept_sec = None
    if assignments and assignments[0].accepted_at:
        t_acc = assignments[0].accepted_at.replace(tzinfo=timezone.utc) if assignments[0].accepted_at.tzinfo is None else assignments[0].accepted_at
        t_accept_sec = max(0, int((t_acc - t_created).total_seconds()))

    t_resolve_sec = None
    # Check if incident is resolved
    resolve_event = next((e for e in incident.events if e.new_status == IncidentStatus.RESOLVED), None)
    if resolve_event:
        t_r = resolve_event.created_at.replace(tzinfo=timezone.utc) if resolve_event.created_at.tzinfo is None else resolve_event.created_at
        t_resolve_sec = max(0, int((t_r - t_created).total_seconds()))

    trace_durations = TraceDurations(
        incident_age_seconds=max(0, incident_age_sec),
        time_to_verification_seconds=t_verify_sec,
        time_to_assignment_seconds=t_assign_sec,
        time_to_acceptance_seconds=t_accept_sec,
        time_to_resolution_seconds=t_resolve_sec,
        incident_age_display=format_duration(max(0, incident_age_sec)) or "0s",
        time_to_verification_display=format_duration(t_verify_sec),
        time_to_assignment_display=format_duration(t_assign_sec),
        time_to_acceptance_display=format_duration(t_accept_sec),
        time_to_resolution_display=format_duration(t_resolve_sec),
    )

    export_url = f"/api/v1/incidents/{incident.id}/trace/export"

    return {
        "incident": trace_origin,
        "priority": trace_priority,
        "assignments": trace_assignments,
        "inventory_reservations": trace_inventory,
        "stock_movements": trace_stock_movements,
        "cloud_outbox_events": trace_outbox,
        "timeline": timeline_events,
        "durations": trace_durations,
        "export_url": export_url,
    }


@router.get("/{incident_id}/trace", response_model=MissionTraceResponse)
async def get_incident_mission_trace(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN])),
):
    """Retrieve comprehensive, database-backed forensic Mission Trace for an incident."""
    data = await build_mission_trace_data(incident_id, db)
    return MissionTraceResponse(**data)


@router.get("/{incident_id}/trace/export")
async def export_mission_trace_report(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN])),
):
    """Generate an authoritative forensic incident report from persisted database records."""
    data = await build_mission_trace_data(incident_id, db)
    inc = data["incident"]
    prio = data["priority"]
    asgs = data["assignments"]
    invs = data["inventory_reservations"]
    outbox = data["cloud_outbox_events"]
    timeline = data["timeline"]
    durations = data["durations"]

    lines = []
    lines.append("=" * 80)
    lines.append("RESQGRID DISASTER RESPONSE & RESOURCE COORDINATION PLATFORM")
    lines.append(f"MISSION TRACE & FORENSIC AUDIT DOSSIER — {inc.tracking_id}")
    lines.append("=" * 80)
    lines.append(f"Generated At: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    lines.append(f"Authorizing Operator: {user.full_name} ({user.role.value})")
    lines.append(f"Audit Correlation ID: {inc.tracking_id}")
    lines.append("")

    lines.append("--- SECTION A: INCIDENT ORIGIN ---")
    lines.append(f"Incident ID:       {inc.incident_id}")
    lines.append(f"Tracking Code:     {inc.tracking_id}")
    lines.append(f"Title:             {inc.title}")
    lines.append(f"Category:          {inc.category.value}")
    lines.append(f"Current Status:    {inc.status.value}")
    lines.append(f"Severity:          {inc.severity.value}")
    lines.append(f"Affected People:   {inc.affected_people}")
    lines.append(f"Coordinates:       {inc.latitude}, {inc.longitude}")
    lines.append(f"Address:           {inc.address}")
    lines.append(f"Created At:        {inc.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    lines.append(f"Merged Reports:    {inc.report_count} citizen submissions combined")
    if inc.merged_reports:
        for mr in inc.merged_reports:
            lines.append(f"  * [{mr.tracking_id}] {mr.title} (+{mr.affected_people} citizens)")
    lines.append(f"Verification:      {'VERIFIED by ' + inc.verified_by_name if inc.verified_by_name else 'PENDING'}")
    if inc.verified_at:
        lines.append(f"Verified At:       {inc.verified_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    lines.append("")

    lines.append("--- SECTION B: EXPLAINABLE PRIORITY ENGINE ---")
    lines.append(f"Calculated Priority Score: {prio.total_score:.1f} / 100.0 (Config {prio.config_version})")
    lines.append(f"  - Severity Factor (35%):     {prio.severity_factor:.1f} pts")
    lines.append(f"  - Impact Factor (25%):       {prio.impact_factor:.1f} pts")
    lines.append(f"  - Wait-Time Factor (20%):    {prio.wait_time_factor:.1f} pts (Starvation Prevention)")
    lines.append(f"  - Vulnerability Factor (20%):{prio.vulnerability_factor:.1f} pts")
    lines.append(f"Model Explanation: {prio.explanation}")
    lines.append("")

    lines.append("--- SECTION C: TACTICAL SQUAD DISPATCH ---")
    if not asgs:
        lines.append("No response squad assigned.")
    else:
        for a in asgs:
            lines.append(f"Assignment ID:     {a.assignment_id}")
            lines.append(f"Selected Squad:    {a.team_name} ({a.team_type})")
            lines.append(f"Dispatcher:        {a.assigned_by_name}")
            lines.append(f"Mission Status:    {a.status.value}")
            lines.append(f"Operator Override: {'YES - ' + (a.override_reason or 'None') if a.is_operator_override else 'NO (Followed Top Recommendation)'}")
            if a.candidate_snapshots:
                lines.append("Candidate Squads Evaluated by Matching Engine:")
                for c in a.candidate_snapshots:
                    lines.append(f"  * {c.team_name} | Match: {c.suitability_score}% | Dist: {c.distance_km}km | Cap: {c.capacity}")
    lines.append("")

    lines.append("--- SECTION D: INVENTORY ALLOCATION & RESERVATIONS ---")
    if not invs:
        lines.append("No warehouse inventory reserved for this incident.")
    else:
        lines.append(f"Total Reserved Items: {len(invs)}")
        for i in invs:
            lines.append(f"  * {i.quantity_reserved}x {i.item_name} ({i.item_sku}) from {i.depot_name} | Status: {i.status} | Consumed: {i.quantity_consumed}")
    lines.append("")

    lines.append("--- SECTION E: CLOUD EVENT PROCESSING & OUTBOX ---")
    if not outbox:
        lines.append("No outbox records logged.")
    else:
        for ob in outbox:
            lines.append(f"Event: [{ob.event_type}] | ID: {ob.id[:8]} | Status: {ob.status} | Cloud: {ob.cloud_delivery_status}")
            lines.append(f"  Key: {ob.idempotency_key} | Retries: {ob.retry_count}")
    lines.append("")

    lines.append("--- SECTION F: MISSION LIFECYCLE TIMELINE ---")
    lines.append(f"Incident Age:              {durations.incident_age_display}")
    lines.append(f"Time to Verification:      {durations.time_to_verification_display or 'N/A'}")
    lines.append(f"Time to Squad Assignment:  {durations.time_to_assignment_display or 'N/A'}")
    lines.append(f"Time to Mission Acceptance:{durations.time_to_acceptance_display or 'N/A'}")
    lines.append(f"Time to Final Resolution:  {durations.time_to_resolution_display or 'In Progress'}")
    lines.append("")
    lines.append("Chronological Event Trail:")
    for t in timeline:
        lines.append(f"[{t.relative_time}] {t.timestamp.strftime('%H:%M:%S UTC')} | {t.title.upper()} ({t.category})")
        lines.append(f"       Actor: {t.actor_name} ({t.actor_role}) | {t.description}")
    lines.append("=" * 80)

    report_text = "\n".join(lines)
    s3_key = f"trace_reports/{inc.tracking_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.txt"
    storage_service.save_local_file(s3_key, report_text.encode("utf-8"))

    return PlainTextResponse(
        content=report_text,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename=mission_trace_{inc.tracking_id}.txt"
        },
    )
