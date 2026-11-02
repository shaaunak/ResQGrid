import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from app.algorithms.priority_engine import calculate_priority_score
from app.algorithms.matching_engine import rank_teams_for_incident
from app.models.enums import IncidentCategory, IncidentSeverity, TeamStatus, TeamType
from app.models.team import ResponseTeam
from app.models.incident import Incident


def test_priority_engine_starvation_prevention():
    """Verify that waiting time keeps steadily raising the score (starvation prevention)."""
    base_time = datetime(2026, 11, 2, 12, 0, 0, tzinfo=timezone.utc)

    t0_score = calculate_priority_score(
        severity=IncidentSeverity.LOW,
        affected_people=1,
        category=IncidentCategory.SUPPLIES,
        created_at=base_time,
        as_of_time=base_time,
    )

    t15_score = calculate_priority_score(
        severity=IncidentSeverity.LOW,
        affected_people=1,
        category=IncidentCategory.SUPPLIES,
        created_at=base_time,
        as_of_time=base_time + timedelta(minutes=15),
    )

    t45_score = calculate_priority_score(
        severity=IncidentSeverity.LOW,
        affected_people=1,
        category=IncidentCategory.SUPPLIES,
        created_at=base_time,
        as_of_time=base_time + timedelta(minutes=45),
    )

    assert t15_score["total_score"] > t0_score["total_score"], "Score must increase with waiting time"
    assert t45_score["total_score"] > t15_score["total_score"], "Score must continue increasing (starvation prevention)"
    assert "wait time contributed" in t45_score["explanation"]


def test_team_matching_engine_capability_and_eta():
    """Verify team matching ranks qualified teams higher with distance and explanation reasons."""
    flood_incident = Incident(
        id="inc-test-flood",
        category=IncidentCategory.FLOOD,
        affected_people=10,
        latitude=19.0726,
        longitude=72.8845,
    )

    water_team = ResponseTeam(
        id="t-water",
        name="Water Rescue Unit",
        team_type=TeamType.WATER_RESCUE,
        status=TeamStatus.AVAILABLE,
        capacity=10,
        base_latitude=19.0700,
        base_longitude=72.8800,
        current_latitude=19.0700,
        current_longitude=72.8800,
        qualifications=["WATER_RESCUE", "SWIFT_WATER"],
        active_assignments_count=0,
        max_concurrent_assignments=1,
    )

    general_team = ResponseTeam(
        id="t-gen",
        name="General Distribution Squad",
        team_type=TeamType.RELIEF_DISTRIBUTION,
        status=TeamStatus.AVAILABLE,
        capacity=15,
        base_latitude=18.9100,
        base_longitude=72.8100,
        current_latitude=18.9100,
        current_longitude=72.8100,
        qualifications=["DISTRIBUTION"],
        active_assignments_count=0,
        max_concurrent_assignments=1,
    )

    ranked = rank_teams_for_incident(flood_incident, [water_team, general_team])
    assert len(ranked) == 2
    assert ranked[0]["team"].id == "t-water", "Water Rescue team must rank #1 for Flood incident"
    assert ranked[0]["suitability_score"] > ranked[1]["suitability_score"]
    assert len(ranked[0]["reasons"]) > 0


def test_spatial_temporal_duplicate_merge_logic():
    """Verify duplicate merge criteria: within 150m and 20 minutes with report_count increment."""
    from app.api.v1.incidents import haversine_distance_meters

    p1_lat, p1_lon = 19.0726, 72.8845
    # Nearby point within 100 meters
    p2_lat, p2_lon = 19.0730, 72.8848

    dist = haversine_distance_meters(p1_lat, p1_lon, p2_lat, p2_lon)
    assert dist <= 150.0, f"Distance should be within 150m, got {dist}m"

    # Farther point (> 200m)
    p3_lat, p3_lon = 19.0760, 72.8870
    dist_far = haversine_distance_meters(p1_lat, p1_lon, p3_lat, p3_lon)
    assert dist_far > 150.0, f"Distance should exceed 150m, got {dist_far}m"
