from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class CategoryCount(BaseModel):
    category: str
    count: int


class SeverityCount(BaseModel):
    severity: str
    count: int


class OperationalKPIs(BaseModel):
    total_incidents: int
    active_incidents: int
    critical_incidents: int
    resolved_incidents: int
    available_teams: int
    active_teams: int
    median_response_time_minutes: float
    resolution_rate_pct: float
    sla_compliance_pct: float
    resource_utilization_pct: float
    open_critical_count: int
    supplies_critical_alerts: int
    sparklines: Dict[str, List[float]]


class ResponseTimeDistribution(BaseModel):
    bins: List[str]
    counts: List[int]
    median_minutes: float
    p90_minutes: float
    raw_response_times: List[float]


class FunnelStep(BaseModel):
    stage: str
    count: int
    dropoff_pct: float


class HeatmapData(BaseModel):
    wards: List[str]
    hours: List[int]  # 0 to 23
    matrix: List[List[int]]  # [ward_idx, hour_idx, count]


class ScatterIncidentPoint(BaseModel):
    tracking_id: str
    title: str
    severity: str
    category: str
    priority_score: float
    wait_time_minutes: float
    affected_people: int
    status: str


class ResourceUtilTimePoint(BaseModel):
    timestamp: str
    water_rescue: float
    general_evac: float
    medical: float
    fire_hazmat: float
    distribution: float


class TeamRadarCapability(BaseModel):
    team_id: str
    team_name: str
    team_type: str
    status: str
    water_rescue_score: float
    medical_trauma_score: float
    fire_suppression_score: float
    evacuation_speed_score: float
    logistics_capacity_score: float
    missions_completed: int
    avg_eta_minutes: float


class SLAGaugeData(BaseModel):
    critical_compliance_pct: float
    critical_target_minutes: int
    critical_actual_avg_minutes: float
    high_compliance_pct: float
    high_target_minutes: int
    high_actual_avg_minutes: float
    medium_compliance_pct: float
    medium_target_minutes: int
    medium_actual_avg_minutes: float


class DepotStockCoverage(BaseModel):
    depot_name: str
    item_name: str
    sku: str
    available: int
    reserved: int
    total: int
    threshold: int
    daily_consumption_rate: float
    days_of_supply_left: float


class OperationalAnalytics(BaseModel):
    kpis: OperationalKPIs
    incidents_by_status: List[StatusCount]
    incidents_by_category: List[CategoryCount]
    incidents_by_severity: List[SeverityCount]
    response_distribution: ResponseTimeDistribution
    funnel: List[FunnelStep]
    heatmap: HeatmapData
    scatter_priority_wait: List[ScatterIncidentPoint]
    resource_utilization_timeline: List[ResourceUtilTimePoint]
    teams_radar: List[TeamRadarCapability]
    sla_gauges: SLAGaugeData
    stock_coverage: List[DepotStockCoverage]
    depot_utilization: List[Dict[str, Any]]
