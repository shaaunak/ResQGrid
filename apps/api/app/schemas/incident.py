from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import IncidentCategory, IncidentSeverity, IncidentStatus


class PriorityBreakdown(BaseModel):
    severity_factor: float
    impact_factor: float
    wait_time_factor: float
    vulnerability_factor: float
    total_score: float
    explanation: str
    config_version: Optional[str] = "v1.2"


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=5)
    category: IncidentCategory
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    affected_people: int = Field(ge=1, le=10000, default=1)
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    address: str = Field(min_length=3, max_length=500)
    reporter_phone: Optional[str] = None
    is_simulated: bool = False


class IncidentVerifyRequest(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None
    severity_override: Optional[IncidentSeverity] = None


class EscalationRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=1000)


class IncidentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    previous_status: Optional[IncidentStatus]
    new_status: IncidentStatus
    actor_id: Optional[str]
    comment: Optional[str]
    created_at: datetime


class IncidentEvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_type: str
    s3_key: str
    file_name: str
    file_size: int
    mime_type: str
    file_url: Optional[str] = None
    created_at: datetime


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
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
    priority_score: float
    priority_breakdown: Optional[Dict[str, Any]] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    # Independent Escalation
    is_escalated: bool = False
    escalation_reason: Optional[str] = None
    escalated_by: Optional[str] = None
    escalated_at: Optional[datetime] = None
    escalation_resolved_at: Optional[datetime] = None

    # Optimistic Concurrency Control
    version: int = 1

    # Spatial-temporal duplicate grouping
    report_count: int = 1
    parent_incident_id: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    events: Optional[List[IncidentEventResponse]] = []
    evidence: Optional[List[IncidentEvidenceResponse]] = []
