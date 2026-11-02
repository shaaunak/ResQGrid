from app.algorithms.haversine import haversine_distance_km
from app.algorithms.matching_engine import rank_teams_for_incident
from app.models.enums import IncidentCategory, TeamStatus, TeamType


class MockTeam:
    def __init__(self, id, name, team_type, status, capacity, lat, lon, qualifications=None, active_assignments=0):
        self.id = id
        self.name = name
        self.team_type = team_type
        self.status = status
        self.capacity = capacity
        self.current_latitude = lat
        self.current_longitude = lon
        self.qualifications = qualifications or []
        self.active_assignments_count = active_assignments


class MockIncident:
    def __init__(self, category, affected_people, lat, lon):
        self.category = category
        self.affected_people = affected_people
        self.latitude = lat
        self.longitude = lon


def test_haversine_distance_calculation():
    # Mumbai Dadar (19.0178, 72.8478) to Bandra (19.0596, 72.8402) ~ 4.7 km
    dist = haversine_distance_km(19.0178, 72.8478, 19.0596, 72.8402)
    assert 4.0 <= dist <= 5.5


def test_matching_engine_filters_and_ranks():
    # Flood incident in Kurla West
    flood_incident = MockIncident(
        category=IncidentCategory.FLOOD,
        affected_people=10,
        lat=19.0726,
        lon=72.8845,
    )

    # Teams: 1 Water Rescue nearby, 1 Water Rescue far, 1 Firefighting team (ineligible for flood)
    water_nearby = MockTeam(
        id="t1",
        name="Kurla Water Unit",
        team_type=TeamType.WATER_RESCUE,
        status=TeamStatus.AVAILABLE,
        capacity=12,
        lat=19.0720,
        lon=72.8840,
        qualifications=["WATER_RESCUE", "BOAT_OPERATOR"],
    )
    water_far = MockTeam(
        id="t2",
        name="Colaba Water Unit",
        team_type=TeamType.WATER_RESCUE,
        status=TeamStatus.AVAILABLE,
        capacity=12,
        lat=18.9067,
        lon=72.8147,
        qualifications=["WATER_RESCUE"],
    )
    fire_team = MockTeam(
        id="t3",
        name="Andheri Fire Unit",
        team_type=TeamType.FIREFIGHTING,
        status=TeamStatus.AVAILABLE,
        capacity=10,
        lat=19.1136,
        lon=72.8697,
        qualifications=["FIRE_SUPPRESSION"],
    )

    ranked = rank_teams_for_incident(flood_incident, [water_far, water_nearby, fire_team])

    assert len(ranked) == 3
    # First ranked must be eligible and be the nearby water team
    assert ranked[0]["team"].id == "t1"
    assert ranked[0]["is_eligible"] is True
    assert ranked[0]["suitability_score"] > ranked[1]["suitability_score"]

    # Firefighting team should be marked ineligible for flood
    fire_result = next(r for r in ranked if r["team"].id == "t3")
    assert fire_result["is_eligible"] is False

