from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from app.models.enums import IncidentCategory, IncidentSeverity


@dataclass
class PriorityScoringConfig:
    version: str = "v1.2"
    weight_severity: float = 0.35
    weight_impact: float = 0.25
    weight_wait_time: float = 0.20
    weight_vulnerability: float = 0.20
    max_wait_time_minutes: float = 50.0  # Bounded wait time cap
    starvation_boost_per_minute: float = 2.0  # 1 min = +2 pts (caps at 100 in 50 mins)

    def validate(self) -> None:
        total = (
            self.weight_severity
            + self.weight_impact
            + self.weight_wait_time
            + self.weight_vulnerability
        )
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Priority weights must sum to 1.0, got {total:.4f}")


DEFAULT_CONFIG = PriorityScoringConfig()

# Backward compatible constants
WEIGHT_SEVERITY = DEFAULT_CONFIG.weight_severity
WEIGHT_IMPACT = DEFAULT_CONFIG.weight_impact
WEIGHT_WAIT_TIME = DEFAULT_CONFIG.weight_wait_time
WEIGHT_VULNERABILITY = DEFAULT_CONFIG.weight_vulnerability


def calculate_priority_score(
    severity: Optional[IncidentSeverity] = None,
    affected_people: Optional[int] = None,
    category: Optional[IncidentCategory] = None,
    created_at: Optional[datetime] = None,
    as_of_time: Optional[datetime] = None,
    config: Optional[PriorityScoringConfig] = None,
) -> Dict[str, Any]:
    """Explainable rule-based incident prioritization algorithm.

    Computes normalized score (0 - 100):
      P = W_sev * Severity + W_imp * Impact + W_wait * WaitTime + W_vuln * Vulnerability

    Guarantees:
      - Normalized outputs strictly bounded in [0.0, 100.0]
      - Starvation prevention: older low-severity reports gain wait-time priority steadily
      - Versioned and configurable scoring weights
      - Defensive fallback defaults for missing optional factors
      - Explicit academic disclaimer
    """
    cfg = config or DEFAULT_CONFIG
    cfg.validate()

    calc_time = as_of_time or datetime.now(timezone.utc)
    if created_at is None:
        created_at = calc_time

    # Defensive defaults for optional factors
    eff_severity = severity or IncidentSeverity.MEDIUM
    eff_affected = max(1, affected_people if affected_people is not None else 1)
    eff_category = category or IncidentCategory.OTHER

    # 1. Severity Factor (0 - 100)
    severity_map = {
        IncidentSeverity.CRITICAL: 100.0,
        IncidentSeverity.HIGH: 75.0,
        IncidentSeverity.MEDIUM: 50.0,
        IncidentSeverity.LOW: 25.0,
    }
    severity_factor = severity_map.get(eff_severity, 50.0)

    # 2. Impact Factor (0 - 100)
    # Logarithmic progression: 1 person = 20, 5 people = 50, 15+ people = 85, 30+ = 100
    if eff_affected <= 1:
        impact_factor = 20.0
    elif eff_affected <= 5:
        impact_factor = 20.0 + (eff_affected - 1) * 7.5  # 20.0 -> 50.0
    elif eff_affected <= 20:
        impact_factor = 50.0 + (eff_affected - 5) * 2.5  # 50.0 -> 87.5
    else:
        impact_factor = min(100.0, 87.5 + (eff_affected - 20) * 0.5)

    # 3. Wait Time Factor (0 - 100) with Starvation Protection
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    if calc_time.tzinfo is None:
        calc_time = calc_time.replace(tzinfo=timezone.utc)

    wait_seconds = max(0.0, (calc_time - created_at).total_seconds())
    wait_minutes = wait_seconds / 60.0

    # Starvation prevention policy: steady increase bounded by max_wait_time_minutes
    wait_time_factor = min(100.0, wait_minutes * cfg.starvation_boost_per_minute)

    # 4. Vulnerability / Urgency Factor (0 - 100)
    category_urgency_map = {
        IncidentCategory.FLOOD: 90.0,
        IncidentCategory.MEDICAL: 95.0,
        IncidentCategory.COLLAPSE: 95.0,
        IncidentCategory.FIRE: 90.0,
        IncidentCategory.CYCLONE: 85.0,
        IncidentCategory.EVACUATION: 75.0,
        IncidentCategory.SUPPLIES: 50.0,
        IncidentCategory.OTHER: 30.0,
    }
    vulnerability_factor = category_urgency_map.get(eff_category, 50.0)

    # Weighted normalized sum
    raw_score = (
        (cfg.weight_severity * severity_factor)
        + (cfg.weight_impact * impact_factor)
        + (cfg.weight_wait_time * wait_time_factor)
        + (cfg.weight_vulnerability * vulnerability_factor)
    )
    total_score = round(min(100.0, max(0.0, raw_score)), 1)

    # Human-readable explainability breakdown
    explanation_parts = [
        f"Severity '{eff_severity.value}' contributed {round(cfg.weight_severity * severity_factor, 1)} pts ({severity_factor:.1f} normalized)",
        f"{eff_affected} affected people contributed {round(cfg.weight_impact * impact_factor, 1)} pts ({impact_factor:.1f} normalized)",
        f"{wait_minutes:.1f}m wait time contributed {round(cfg.weight_wait_time * wait_time_factor, 1)} pts (starvation prevention active)",
        f"Category '{eff_category.value}' inherent urgency contributed {round(cfg.weight_vulnerability * vulnerability_factor, 1)} pts",
    ]
    explanation = " | ".join(explanation_parts)

    return {
        "severity_factor": severity_factor,
        "impact_factor": round(impact_factor, 1),
        "wait_time_factor": round(wait_time_factor, 1),
        "vulnerability_factor": vulnerability_factor,
        "total_score": total_score,
        "explanation": explanation,
        "config_version": cfg.version,
        "scoring_timestamp": calc_time.isoformat(),
        "input_snapshot": {
            "severity": eff_severity.value,
            "affected_people": eff_affected,
            "category": eff_category.value,
            "wait_minutes": round(wait_minutes, 1),
        },
        "academic_disclaimer": "Simulated heuristic priority calculation. Not a certified clinical triage model.",
    }
