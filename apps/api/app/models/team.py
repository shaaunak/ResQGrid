import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Enum as SQLEnum,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import TeamStatus, TeamType


class ResponseTeam(Base):
    __tablename__ = "response_teams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    team_type = Column(SQLEnum(TeamType), nullable=False, index=True)
    status = Column(SQLEnum(TeamStatus), nullable=False, default=TeamStatus.AVAILABLE, index=True)
    capacity = Column(Integer, default=5, nullable=False)  # Maximum people or simultaneous ops
    
    # Base location (e.g. Mumbai stations: Bandra, Dadar, Colaba, Kurla, Andheri)
    base_location_name = Column(String(255), nullable=False)
    base_latitude = Column(Float, nullable=False)
    base_longitude = Column(Float, nullable=False)
    
    # Current live location
    current_latitude = Column(Float, nullable=False)
    current_longitude = Column(Float, nullable=False)

    contact_phone = Column(String(50), nullable=True)
    qualifications = Column(JSON, nullable=True)  # List of qualifications e.g. ["WATER_RESCUE", "PARAMEDIC", "BOAT_OPERATOR"]
    active_assignments_count = Column(Integer, default=0, nullable=False)
    max_concurrent_assignments = Column(Integer, default=1, nullable=False)  # Enforce strict capacity limit
    version = Column(Integer, default=1, nullable=False)  # Optimistic concurrency control

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("response_teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_in_team = Column(String(100), default="OPERATIVE", nullable=False)  # LEADER, MEDIC, DRIVER, OPERATIVE
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    team = relationship("ResponseTeam", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

