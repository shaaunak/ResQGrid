from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SimulationRunConfig(BaseModel):
    scenario_name: str = Field(default="Mumbai Urban Flood")
    random_seed: int = Field(default=42)
    incident_count: int = Field(ge=5, le=200, default=30)
    team_count: int = Field(ge=2, le=50, default=10)
    algorithm: str = Field(default="BOTH")  # "FIFO", "RISK_AWARE", "BOTH", "ABLATION"
    run_monte_carlo: bool = Field(default=False)
    monte_carlo_seeds_count: int = Field(ge=5, le=50, default=30)


class SimulationMetricsData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    strategy_name: Optional[str] = "Algorithm"
    avg_wait_time_seconds: float
    median_wait_time_seconds: Optional[float] = 0.0
    critical_wait_time_seconds: float
    p95_wait_time_seconds: float
    resource_utilization_pct: float
    assignment_success_rate: float
    unfulfilled_requests: int
    starvation_index: Optional[float] = 0.0  # Max delay relative to priority
    step_history: Optional[List[Dict[str, Any]]] = []


class SimulationResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    run_id: str
    scenario_name: str
    algorithm: str
    total_incidents: int
    total_teams: int
    status: str
    metrics: SimulationMetricsData
    created_at: datetime


class ComparisonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scenario_name: str
    random_seed: int
    total_incidents: int
    baseline_fifo: SimulationMetricsData
    risk_aware_algorithm: SimulationMetricsData
    priority_only: Optional[SimulationMetricsData] = None
    matching_only: Optional[SimulationMetricsData] = None
    ablation_study: Optional[Dict[str, SimulationMetricsData]] = None
    improvements: Dict[str, Any]
    summary_analysis: str
    monte_carlo_summary: Optional[Dict[str, Any]] = None
    exportable_report: Optional[Dict[str, Any]] = None
