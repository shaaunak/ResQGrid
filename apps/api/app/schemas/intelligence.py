from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    details_json: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime


class SituationBriefResponse(BaseModel):
    brief_id: str
    timestamp: str
    disaster_scenario: str
    open_incidents_by_severity: Dict[str, int]
    total_active_incidents: int
    units_free_count: int
    units_total_count: int
    units_free_details: List[str]
    stock_at_risk_alerts: List[Dict[str, Any]]
    top_actions_recommended: List[Dict[str, Any]]
    pdf_presigned_download_url: str
    academic_disclosure: str


class DisasterPackTemplate(BaseModel):
    id: str
    name: str
    description: str
    incident_types: List[str]
    required_equipment: List[str]
    default_templates: List[Dict[str, str]]
    priority_weight_adjustments: Dict[str, float]

