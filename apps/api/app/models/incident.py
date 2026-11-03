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
    Text,
    Enum as SQLEnum,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import IncidentCategory, IncidentSeverity, IncidentStatus


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tracking_id = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(IncidentCategory), nullable=False, index=True)
    severity = Column(SQLEnum(IncidentSeverity), nullable=False, default=IncidentSeverity.MEDIUM, index=True)
    status = Column(SQLEnum(IncidentStatus), nullable=False, default=IncidentStatus.REPORTED, index=True)
    affected_people = Column(Integer, nullable=False, default=1)
    
    # Location (Mumbai coordinates default)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=False)

    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    reporter_phone = Column(String(50), nullable=True)
    is_simulated = Column(Boolean, default=False, nullable=False, index=True)

    # Intelligent Prioritization
    priority_score = Column(Float, default=0.0, nullable=False, index=True)
    priority_breakdown = Column(JSON, nullable=True)

    # Verification workflow
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Independent Escalation Subsystem (can be escalated in any active status)
    is_escalated = Column(Boolean, default=False, nullable=False, index=True)
    escalation_reason = Column(Text, nullable=True)
    escalated_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    escalated_at = Column(DateTime, nullable=True)
    escalation_resolved_at = Column(DateTime, nullable=True)

    # Optimistic Concurrency Control
    version = Column(Integer, default=1, nullable=False)

    # Spatial-temporal duplicate grouping
    report_count = Column(Integer, default=1, nullable=False)
    parent_incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    reporter = relationship("User", back_populates="incidents", foreign_keys=[reporter_id])
    verifier = relationship("User", back_populates="verified_incidents", foreign_keys=[verified_by])
    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentEvent.created_at")
    evidence = relationship("IncidentEvidence", back_populates="incident", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="incident", cascade="all, delete-orphan")
    merged_reports = relationship(
        "Incident",
        cascade="all, delete-orphan",
        primaryjoin="Incident.id==Incident.parent_incident_id",
        remote_side="Incident.parent_incident_id",
    )


class IncidentEvent(Base):
    """Tracks every lifecycle transition with actor and reason."""
    __tablename__ = "incident_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(SQLEnum(IncidentStatus), nullable=True)
    new_status = Column(SQLEnum(IncidentStatus), nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    incident = relationship("Incident", back_populates="events")
    actor = relationship("User")


class IncidentEvidence(Base):
    """Stores metadata for evidence files uploaded to S3 / local storage."""
    __tablename__ = "incident_evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    uploader_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    evidence_type = Column(String(50), default="CITIZEN_SUBMISSION", nullable=False)  # CITIZEN_SUBMISSION, RESPONDER_COMPLETION
    s3_key = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_url = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    incident = relationship("Incident", back_populates="evidence")
    uploader = relationship("User")

