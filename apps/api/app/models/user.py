import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, String, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CITIZEN, index=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    incidents = relationship("Incident", back_populates="reporter", foreign_keys="Incident.reporter_id")
    verified_incidents = relationship("Incident", back_populates="verifier", foreign_keys="Incident.verified_by")
    team_memberships = relationship("TeamMember", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor")

