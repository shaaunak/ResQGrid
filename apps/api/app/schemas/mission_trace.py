from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import IncidentCategory, IncidentSeverity, IncidentStatus, AssignmentStatus


class TraceOriginEvidence(BaseModel):
    id: str
    evidence_type: str
    s3_key: str
    file_name: str
    file_size: int
    mime_type: str
    file_url: Optional[str] = None
    created_at: datetime


class TraceOriginMergedReport(BaseModel):
    id: str
    tracking_id: str
    title: str
    description: str
    affected_people: int
    created_at: datetime


class TraceOrigin(BaseModel):
    incident_id: str
    tracking_id: str
    title: str
    description: str
    category: IncidentCategory
    severity: IncidentSeverity
    status: IncidentStatus
    affected_people: int
    latitude: float
    longitude: float
    address: str
    reporter_id: Optional[str] = None
    reporter_phone: Optional[str] = None
    is_simulated: bool
    is_escalated: bool
    escalation_reason: Optional[str] = None
    report_count: int
    created_at: datetime
    updated_at: datetime
    verified_by_id: Optional[str] = None
    verified_by_name: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    evidence: List[TraceOriginEvidence] = []
    merged_reports: List[TraceOriginMergedReport] = []


class TracePriority(BaseModel):
    severity_factor: float
    impact_factor: float
    wait_time_factor: float
    vulnerability_factor: float
    total_score: float
    explanation: str
    config_version: str = "v1.2"
    scoring_timestamp: Optional[datetime] = None
    input_snapshot: Optional[Dict[str, Any]] = None
    academic_disclaimer: Optional[str] = None


class TraceCandidateSquad(BaseModel):
    team_id: str
    team_name: str
    team_type: str
    base_location: str
    distance_km: Optional[float] = None
    suitability_score: float
    is_recommended: bool = False
    is_eligible: bool = True
    active_assignments_count: int = 0
    capacity: int = 5
    qualifications: List[str] = []


class TraceAssignment(BaseModel):
    assignment_id: str
    team_id: str
    team_name: str
    team_type: str
    assigned_by_id: str
    assigned_by_name: Optional[str] = None
    status: AssignmentStatus
    is_operator_override: bool
    override_reason: Optional[str] = None
    operator_notes: Optional[str] = None
    responder_notes: Optional[str] = None
    declination_reason: Optional[str] = None
    recommended_team_id: Optional[str] = None
    recommended_team_name: Optional[str] = None
    candidate_snapshots: List[TraceCandidateSquad] = []
    assigned_at: datetime
    accepted_at: Optional[datetime] = None
    declined_at: Optional[datetime] = None
    en_route_at: Optional[datetime] = None
    on_scene_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    reassigned_at: Optional[datetime] = None
    team_base_latitude: float
    team_base_longitude: float
    team_current_latitude: float
    team_current_longitude: float


class TraceInventoryItem(BaseModel):
    reservation_id: str
    assignment_id: str
    depot_id: str
    depot_name: str
    depot_location: str
    item_id: str
    item_name: str
    item_sku: str
    unit: str
    quantity_reserved: int
    quantity_consumed: int
    quantity_released: int
    status: str
    created_at: datetime
    updated_at: datetime


class TraceStockMovement(BaseModel):
    id: str
    item_name: str
    quantity: int
    movement_type: str
    from_depot_name: Optional[str] = None
    to_depot_name: Optional[str] = None
    actor_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class TraceCloudOutboxEvent(BaseModel):
    id: str
    event_type: str
    status: str
    idempotency_key: str
    retry_count: int
    last_error: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    correlation_id: str
    cloud_delivery_status: str
    sqs_message_id: Optional[str] = None
    worker_notes: Optional[str] = None
    payload: Dict[str, Any]


class TraceTimelineEvent(BaseModel):
    id: str
    category: str  # INCIDENT, ASSIGNMENT, INVENTORY, OUTBOX, AUDIT
    event_type: str
    title: str
    description: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    timestamp: datetime
    relative_time: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    metadata: Dict[str, Any] = {}


class TraceDurations(BaseModel):
    incident_age_seconds: int
    time_to_verification_seconds: Optional[int] = None
    time_to_assignment_seconds: Optional[int] = None
    time_to_acceptance_seconds: Optional[int] = None
    time_to_resolution_seconds: Optional[int] = None
    incident_age_display: str
    time_to_verification_display: Optional[str] = None
    time_to_assignment_display: Optional[str] = None
    time_to_acceptance_display: Optional[str] = None
    time_to_resolution_display: Optional[str] = None


class MissionTraceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    incident: TraceOrigin
    priority: TracePriority
    assignments: List[TraceAssignment]
    inventory_reservations: List[TraceInventoryItem]
    stock_movements: List[TraceStockMovement]
    cloud_outbox_events: List[TraceCloudOutboxEvent]
    timeline: List[TraceTimelineEvent]
    durations: TraceDurations
    export_url: Optional[str] = None
