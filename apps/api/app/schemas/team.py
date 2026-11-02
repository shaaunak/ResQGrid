from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.enums import TeamStatus, TeamType


class TeamMemberResponse(BaseModel):
    id: str
    user_id: str
    role_in_team: str
    is_active: bool

    class Config:
        from_attributes = True


class TeamCreate(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    team_type: TeamType
    capacity: int = Field(ge=1, le=100, default=5)
    base_location_name: str
    base_latitude: float
    base_longitude: float
    contact_phone: Optional[str] = None
    qualifications: List[str] = []


class TeamResponse(BaseModel):
    id: str
    name: str
    team_type: TeamType
    status: TeamStatus
    capacity: int
    base_location_name: str
    base_latitude: float
    base_longitude: float
    current_latitude: float
    current_longitude: float
    contact_phone: Optional[str]
    qualifications: Optional[List[str]] = []
    active_assignments_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamRecommendation(BaseModel):
    team: TeamResponse
    suitability_score: float
    distance_km: float
    reasons: List[str]
    is_eligible: bool

