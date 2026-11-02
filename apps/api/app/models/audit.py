import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    String,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # INCIDENT_VERIFIED, ASSIGNMENT_CREATED, STOCK_RESERVED, etc.
    resource_type = Column(String(100), nullable=False, index=True)  # incident, assignment, inventory, team
    resource_id = Column(String(100), nullable=False, index=True)
    details_json = Column(JSON, nullable=True)
    ip_address = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    actor = relationship("User", back_populates="audit_logs")

