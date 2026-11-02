import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import AssignmentStatus


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(String(36), ForeignKey("response_teams.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(AssignmentStatus), default=AssignmentStatus.OFFERED, nullable=False, index=True)

    # Operational notes
    operator_notes = Column(Text, nullable=True)
    responder_notes = Column(Text, nullable=True)
    declination_reason = Column(Text, nullable=True)

    # Operator Override Audit Trail
    is_operator_override = Column(Boolean, default=False, nullable=False)
    recommended_team_id = Column(String(36), nullable=True)
    override_reason = Column(Text, nullable=True)
    recommendation_snapshot = Column(JSON, nullable=True)

    # Optimistic Concurrency Control
    version = Column(Integer, default=1, nullable=False)

    # Lifecycle timestamps
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    declined_at = Column(DateTime, nullable=True)
    en_route_at = Column(DateTime, nullable=True)
    on_scene_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    reassigned_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="assignments")
    team = relationship("ResponseTeam", back_populates="assignments")
    dispatcher = relationship("User", foreign_keys=[assigned_by])
    stock_reservations = relationship("StockReservation", back_populates="assignment", cascade="all, delete-orphan")

