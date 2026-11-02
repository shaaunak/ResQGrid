from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import AssignmentStatus
from app.schemas.team import TeamResponse


class RequestedStockItem(BaseModel):
    item_id: str
    depot_id: str
    quantity: int = Field(ge=1)


class AssignmentCreate(BaseModel):
    incident_id: str
    team_id: str
    operator_notes: Optional[str] = None
    override_reason: Optional[str] = None
    expected_version: Optional[int] = None
    requested_supplies: Optional[List[RequestedStockItem]] = []


class AssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus
    responder_notes: Optional[str] = None
    declination_reason: Optional[str] = None
    consumed_supplies: Optional[List[RequestedStockItem]] = None


class StockReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    assignment_id: str
    depot_id: str
    item_id: str
    quantity_reserved: int
    quantity_consumed: int
    status: str
    created_at: datetime


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: str
    team_id: str
    assigned_by: str
    status: AssignmentStatus
    operator_notes: Optional[str] = None
    responder_notes: Optional[str] = None
    declination_reason: Optional[str] = None
    is_operator_override: bool = False
    override_reason: Optional[str] = None
    version: int = 1
    assigned_at: datetime
    accepted_at: Optional[datetime] = None
    declined_at: Optional[datetime] = None
    en_route_at: Optional[datetime] = None
    on_scene_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    reassigned_at: Optional[datetime] = None
    created_at: datetime
    team: Optional[TeamResponse] = None
    stock_reservations: List[StockReservationResponse] = []
