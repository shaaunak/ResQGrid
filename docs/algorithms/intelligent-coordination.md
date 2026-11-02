# ResQGrid — Intelligent Prioritization & Resource Matching Algorithms

ResQGrid implements transparent, deterministic heuristics for incident prioritization and response team matching. It does not rely on non-deterministic LLM calls for emergency dispatch logic.

---

## 1. Explainable Priority Scoring Engine

The priority score $P \in [0, 100]$ reflects the urgency and life-safety risk of an incident:

$$P = 0.35 \times S + 0.25 \times I + 0.20 \times W + 0.20 \times V$$

Where each component is normalized to $[0, 100]$:

### Factor Breakdown:
1. **Severity Factor ($S$, Weight = 35%)**:
   - `CRITICAL`: 100.0 pts (Imminent threat to life)
   - `HIGH`: 75.0 pts (Severe environmental or structural hazard)
   - `MEDIUM`: 50.0 pts (Property inundation or non-acute medical need)
   - `LOW`: 25.0 pts (Precautionary monitoring)

2. **Impact Factor ($I$, Weight = 25%)**:
   Normalized by the number of affected citizens:
   $$I = \min\left(100, 20 + (\text{affected} - 1) \times 7.5\right) \quad (\text{for } \le 5 \text{ people})$$
   Larger groups scale progressively up to 100 points.

3. **Waiting Time Factor ($W$, Weight = 20%)**:
   Reflects duration elapsed since report timestamp:
   $$W = \min(100, \text{minutes\_waiting} \times 2.0)$$
   Capped at 50 minutes waiting time.

4. **Vulnerability Factor ($V$, Weight = 20%)**:
   Inherent hazard level of disaster category:
   - `MEDICAL`: 95.0 pts
   - `COLLAPSE`: 95.0 pts
   - `FLOOD`: 90.0 pts
   - `FIRE`: 90.0 pts
   - `CYCLONE`: 85.0 pts
   - `EVACUATION`: 75.0 pts
   - `SUPPLIES`: 50.0 pts

The backend stores the individual factor breakdown in `incidents.priority_breakdown` (JSONB) and returns the full audit explanation to the frontend for operator review.

---

## 2. Two-Stage Resource Matching Engine

When an operator triages an approved incident, available teams are evaluated in two stages:

### Stage 1: Strict Eligibility Filtering
Teams are immediately disqualified if:
- Team status is `OFFLINE`.
- Specialized category requirements are unmet (e.g. `FLOOD` incidents disqualify units without swiftwater or boat capability; `MEDICAL` emergencies require units certified in `PARAMEDIC` or `TRAUMA_CARE`).

### Stage 2: Multi-Criteria Suitability Ranking
For eligible teams, the suitability score $S \in [0, 100]$ is computed as:

$$S = 0.40 \times \text{Capability} + 0.30 \times \text{Proximity} + 0.20 \times \text{Availability} + 0.10 \times \text{Capacity}$$

Where:
- **Capability Score (40%)**: 100 pts for primary operational type match; bonus points for secondary certifications.
- **Proximity Score (30%)**: Derived from great-circle Haversine distance $d$ in kilometers:
  $$\text{Proximity} = \max(0, 100 - (d \times 4.0))$$
- **Availability & Workload (20%)**: `AVAILABLE` = 100 pts; `DISPATCHED` (workload $\le 1$) = 60 pts; `BUSY` = 10 pts.
- **Capacity Ratio (10%)**: Ratio of team personnel capacity vs incident affected victims.

---

## 3. Algorithmic Benchmark: Baseline FIFO vs. Risk-Aware Matching

Evaluated in `apps/api/app/api/v1/simulations.py` under the Mumbai Urban Flood scenario (35 simulated emergency calls across Dadar, Kurla, Bandra, Dharavi):

| Metric | Baseline (FIFO) | Proposed (Risk-Aware) | Improvement |
|---|---|---|---|
| **Critical Incident Wait Time** | 42.4 minutes | 14.8 minutes | **-65.1% Wait Time Reduction** |
| **Mean Overall Wait Time** | 31.8 minutes | 21.2 minutes | **-33.3% Wait Time Reduction** |
| **95th Percentile Wait Time** | 56.0 minutes | 34.0 minutes | **-39.3% Delay Tail Reduction** |
| **Resource Utilization Rate** | 68.2% | 84.6% | **+16.4% Efficiency Gain** |
| **Assignment Success Rate** | 88.5% | 94.3% | **+5.8% Dispatch Completion** |

