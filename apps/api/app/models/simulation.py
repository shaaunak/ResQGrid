import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_name = Column(String(255), nullable=False)  # "Mumbai Urban Flood", "Cyclone Relief", "Earthquake"
    random_seed = Column(Integer, default=42, nullable=False)
    total_incidents = Column(Integer, nullable=False)
    total_teams = Column(Integer, nullable=False)
    algorithm_used = Column(String(50), nullable=False)  # "FIFO" or "RISK_AWARE"
    status = Column(String(50), default="COMPLETED", nullable=False)  # RUNNING, COMPLETED, FAILED

    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    metrics = relationship("SimulationMetric", back_populates="simulation_run", cascade="all, delete-orphan", uselist=False)


class SimulationMetric(Base):
    __tablename__ = "simulation_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_run_id = Column(String(36), ForeignKey("simulation_runs.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    avg_wait_time_seconds = Column(Float, nullable=False)
    critical_wait_time_seconds = Column(Float, nullable=False)
    p95_wait_time_seconds = Column(Float, nullable=False)
    resource_utilization_pct = Column(Float, nullable=False)
    assignment_success_rate = Column(Float, nullable=False)
    unfulfilled_requests = Column(Integer, nullable=False)
    metrics_json = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    simulation_run = relationship("SimulationRun", back_populates="metrics")

