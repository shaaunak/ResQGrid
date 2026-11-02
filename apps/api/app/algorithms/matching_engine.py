from typing import Any, Dict, List
from app.algorithms.haversine import haversine_distance_km
from app.models.enums import IncidentCategory, TeamStatus, TeamType


# Mapping of Incident Category to preferred team types and essential qualifications
CATEGORY_REQUIREMENTS = {
    IncidentCategory.FLOOD: {
        "preferred_types": [TeamType.WATER_RESCUE, TeamType.GENERAL_EVACUATION],
        "essential_qual": ["WATER_RESCUE", "BOAT_OPERATOR"],
    },
    IncidentCategory.MEDICAL: {
        "preferred_types": [TeamType.MEDICAL],
        "essential_qual": ["PARAMEDIC", "TRAUMA_CARE"],
    },
    IncidentCategory.FIRE: {
        "preferred_types": [TeamType.FIREFIGHTING],
        "essential_qual": ["HAZMAT", "FIRE_SUPPRESSION"],
    },
    IncidentCategory.COLLAPSE: {
        "preferred_types": [TeamType.GENERAL_EVACUATION, TeamType.WATER_RESCUE],
        "essential_qual": ["SEARCH_AND_RESCUE", "HEAVY_RESCUE"],
    },
    IncidentCategory.EVACUATION: {
        "preferred_types": [TeamType.GENERAL_EVACUATION, TeamType.WATER_RESCUE],
        "essential_qual": ["LOGISTICS", "EVACUATION"],
    },
    IncidentCategory.SUPPLIES: {
        "preferred_types": [TeamType.RELIEF_DISTRIBUTION, TeamType.GENERAL_EVACUATION],
        "essential_qual": ["LOGISTICS"],
    },
    IncidentCategory.CYCLONE: {
        "preferred_types": [TeamType.GENERAL_EVACUATION, TeamType.WATER_RESCUE],
        "essential_qual": ["EMERGENCY_RESPONSE"],
    },
    IncidentCategory.OTHER: {
        "preferred_types": [TeamType.GENERAL_EVACUATION, TeamType.RELIEF_DISTRIBUTION],
        "essential_qual": [],
    },
}


def rank_teams_for_incident(
    incident: Any,
    teams: List[Any],
) -> List[Dict[str, Any]]:
    """Two-stage Resource Matching Engine:

    Stage A: Hard Eligibility Filtering (Status, Qualifications, Concurrency Capacity).
    Stage B: Multi-Criteria Suitability Ranking:
      Score = 0.40 * Capability + 0.30 * Proximity + 0.20 * Availability + 0.10 * Capacity

    Explainability:
      - Explains rank score factor by factor.
      - Never labels straight-line spherical distance as actual road travel time.
    """
    cat_reqs = CATEGORY_REQUIREMENTS.get(
        incident.category, {"preferred_types": [], "essential_qual": []}
    )
    ranked_results: List[Dict[str, Any]] = []

    for team in teams:
        # Stage A: Eligibility Verification
        is_eligible = True
        disqualification_reasons = []

        if team.status == TeamStatus.OFFLINE:
            is_eligible = False
            disqualification_reasons.append("Unit is currently OFFLINE")

        max_concurrent = getattr(team, "max_concurrent_assignments", 1)
        if team.active_assignments_count >= max_concurrent:
            is_eligible = False
            disqualification_reasons.append(
                f"Maximum concurrent capacity reached ({team.active_assignments_count}/{max_concurrent} active missions)"
            )

        qualifications = team.qualifications or []
        team_type = team.team_type

        # Category qualification mismatch checks
        if incident.category == IncidentCategory.FLOOD and team_type == TeamType.FIREFIGHTING:
            is_eligible = False
            disqualification_reasons.append("Firefighting squad lacks amphibious watercraft equipment")

        if incident.category == IncidentCategory.MEDICAL and team_type != TeamType.MEDICAL:
            if "PARAMEDIC" not in qualifications and "TRAUMA_CARE" not in qualifications:
                is_eligible = False
                disqualification_reasons.append("No certified paramedic or trauma-care qualification in unit")

        # Proximity via Spherical Haversine
        distance_km = haversine_distance_km(
            incident.latitude, incident.longitude,
            team.current_latitude, team.current_longitude
        )

        # Proximity score (0 to 100): 100 at 0km, degrades linearly to 0 at 25km
        proximity_score = max(0.0, 100.0 - (distance_km * 4.0))

        # Stage B: Suitability Scoring
        capability_score = 50.0
        reasons = []

        if team_type in cat_reqs["preferred_types"]:
            capability_score = 100.0
            reasons.append(f"Specialized response unit for {incident.category.value}")
        else:
            reasons.append("Secondary general response unit")

        matched_quals = [q for q in qualifications if q in cat_reqs["essential_qual"]]
        if matched_quals:
            reasons.append(f"Certified qualifications: {', '.join(matched_quals)}")
            capability_score = min(100.0, capability_score + 10.0)

        # Availability & Workload (0 - 100)
        if team.status == TeamStatus.AVAILABLE:
            availability_score = 100.0
            reasons.append("Unit immediately ready for deployment")
        elif team.status == TeamStatus.DISPATCHED:
            availability_score = 50.0
            reasons.append(f"Unit already dispatched on {team.active_assignments_count} active mission(s)")
        else:
            availability_score = 20.0
            reasons.append("Unit currently engaged on-scene")

        # Capacity Fit (0 - 100)
        if team.capacity >= incident.affected_people:
            capacity_score = 100.0
            reasons.append(f"Full rescue capacity fit ({team.capacity} squad cap vs {incident.affected_people} victims)")
        else:
            capacity_score = max(20.0, (team.capacity / max(1, incident.affected_people)) * 100.0)
            reasons.append(f"Partial rescue capacity ({team.capacity} squad cap vs {incident.affected_people} victims)")

        reasons.append(
            f"Straight-line distance: {distance_km} km (spherical Haversine; actual road travel time subject to local waterlogging and traffic)"
        )

        if is_eligible:
            suitability = (
                (0.40 * capability_score)
                + (0.30 * proximity_score)
                + (0.20 * availability_score)
                + (0.10 * capacity_score)
            )
            suitability = round(min(100.0, max(0.0, suitability)), 1)
        else:
            suitability = 0.0
            reasons = disqualification_reasons

        ranked_results.append({
            "team": team,
            "suitability_score": suitability,
            "distance_km": distance_km,
            "reasons": reasons,
            "is_eligible": is_eligible,
        })

    # Sort descending by eligibility, then suitability, then nearest distance
    ranked_results.sort(key=lambda x: (x["is_eligible"], x["suitability_score"], -x["distance_km"]), reverse=True)
    return ranked_results
