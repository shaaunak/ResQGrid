from typing import Any, Dict, List
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
    average_response_time_minutes: float
    supplies_critical_alerts: int


class OperationalAnalytics(BaseModel):
    kpis: OperationalKPIs
    incidents_by_status: List[StatusCount]
    incidents_by_category: List[CategoryCount]
    incidents_by_severity: List[SeverityCount]
    timeline_activity: List[Dict[str, Any]]
    depot_utilization: List[Dict[str, Any]]

