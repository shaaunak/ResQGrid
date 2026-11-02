import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
    Enum as SQLEnum,
    JSON,
)
from app.core.database import Base
from app.models.enums import OutboxStatus


class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(100), nullable=False, index=True)  # INCIDENT_VERIFIED, ASSIGNMENT_DISPATCHED, ESCALATION_TRIGGERED
    payload = Column(JSON, nullable=False)
    status = Column(SQLEnum(OutboxStatus), default=OutboxStatus.PENDING, nullable=False, index=True)
    idempotency_key = Column(String(255), unique=True, nullable=False, index=True)
    retry_count = Column(Integer, default=0, nullable=False)
    last_error = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    processed_at = Column(DateTime, nullable=True)

