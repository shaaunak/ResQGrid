# ResQGrid — Mumbai Urban Flood Demonstration Script

**Demonstration Title:** Mumbai Urban Flood Response — Coordinated Relief Simulation  
**Duration:** ~8 to 10 Minutes  
**Focus:** Live multi-role collaboration, 3D spatial operations, concurrency-safe dispatch, explainable algorithms, 4-way ablation discrete-event simulation, asynchronous event resilience, and AWS observability.

---

## Pre-Demonstration Setup
Have 3 browser windows or tabs open simultaneously:
1. **Window A (Left)**: Citizen Portal (`/citizen` or `/track`)
2. **Window B (Center)**: Command Center Operations Console (`/command`)
3. **Window C (Right)**: Field Responder Tactical Workspace (`/responder`)
4. *(Supplementary Tabs)*: Scenario Commander (`/scenario`) and Health Console (`/health`).

---

## 8–10 Minute Demonstration Sequence

### Segment 1: Opening & Citizen Emergency Intake (Minutes 0:00 – 2:00) — Member 1
1. **Cinematic 3D Landing Page**:
   - Open `/` to show the interactive miniature 3D Mumbai city.
   - Show dynamic beacons pulsing at Kurla, Bandra, and Dadar.
   - Scroll through the 5 operational storytelling stages (Surveillance $\rightarrow$ Intake $\rightarrow$ Prioritization $\rightarrow$ Dispatch $\rightarrow$ Resolution).
   - *Technical Note*: Explain `<CanvasErrorBoundary>` and accessible 2D fallback ensuring hardware compatibility across student laptops and institutional projectors.
2. **Citizen Emergency Submission**:
   - Switch to Window A (`/citizen`).
   - Title: *"Severe Waterlogging Near Kranti Nagar Bridge"*
   - Category: `Urban Flooding`
   - Severity: `Critical`
   - Affected Citizens: `12`
   - Click quick landmark *"Kurla West (Mithi River Basin)"* to populate coordinates (`19.0726, 72.8845`).
   - Click **Submit Emergency Help Request**.
   - Note the generated tracking reference (e.g. `INC-1042`). Status begins as `REPORTED`.

---

### Segment 2: Command Center Triage, Priority Scoring & Safe Dispatch (Minutes 2:00 – 4:30) — Member 2
1. **Command Center Operations Map (2D/3D Toggle)**:
   - Switch to Window B (`/command`).
   - Click the **3D Tactical Mode** toggle in the top bar to transition into the Three.js spatial view; rotate and pitch camera to show Mumbai topography.
   - Toggle back to 2D Leaflet mode to inspect the active incident card.
2. **Explainable Priority Urgency Score**:
   - Click the Kurla incident in the queue to open the triage drawer.
   - Show the calculated urgency score ($P = 88.5 / 100$):
     $$P = 0.35 \times \text{Severity} + 0.25 \times \text{Impact} + 0.20 \times \text{WaitTime} + 0.20 \times \text{Vulnerability}$$
   - Explain starvation prevention: low-severity calls steadily gain $+2.0$ pts/min so they are never indefinitely stalled.
   - Click **Verify Emergency** (moves to `VERIFIED`).
3. **Two-Stage Team Matching & Operator Override**:
   - Inspect recommended response units.
   - *Bandra Water Rescue Alpha* ranks #1 ($94\%$ suitability): certified swiftwater unit, 4.8 km straight-line distance, available capacity.
   - Show examiner the **Operator Override Safeguard**: deliberately pick an alternate squad (*Colaba Coastal Distribution Squad*) $\rightarrow$ show that ResQGrid enforces a mandatory text justification before dispatch can proceed.
   - Revert to *Bandra Water Rescue Alpha*, select 5 units of *Swiftwater Lifejackets*, and click **Mobilize & Dispatch Assignment**.
4. **Concurrency Safety & Atomic Inventory**:
   - Explain the backend database execution: `SELECT FOR UPDATE` row lock on the team and stock records, atomic reservation of 5 lifejackets, and status transition to `ASSIGNED`.
   - Highlight the Pytest concurrency test: 20 simultaneous dispatch requests against a single-capacity squad yield exactly 1 success (200 OK) and 19 rejections (409 Conflict).

---

### Segment 3: Field Responder Workflow & Coupled State Transitions (Minutes 4:30 – 6:30) — Member 1 & 2
1. **Responder Mission Progression**:
   - Switch to Window C (`/responder`) logged in as Captain Vikram Patil.
   - Mission appears under active assignments in `OFFERED` status.
   - Click **Accept Mission Order** (moves to `ACCEPTED`).
   - Click **Depart Base • Mark En Route** (moves to `EN_ROUTE`; incident moves to `IN_PROGRESS`).
   - Click **Arrive on Scene** (moves to `ON_SCENE`).
2. **Mission Completion & De-Allocation Rule**:
   - Enter completion report: *"All 12 citizens evacuated safely. 4 lifejackets deployed."*
   - Specify 4 units consumed (1 unit returned to depot available inventory).
   - Click **Complete Mission & Resolve Incident**.
3. **Coupled Resolution**:
   - Show Window B (`/command`): incident automatically transitions to `RESOLVED`.
   - Team capacity is released (`active_assignments_count = 0`), team status returns to `AVAILABLE`.
   - Note the **Atomic De-allocation Rule**: if a responder had declined or expired, capacity and stock would be instantly returned, and the incident returned to `VERIFIED` in the dispatch queue.

---

### Segment 4: Scenario Commander 4-Way Ablation Benchmark (Minutes 6:30 – 8:00) — Member 2
1. **Ablation Study Execution**:
   - Open `/scenario` in the browser.
   - Configure benchmark: Scenario = *Mumbai Urban Flood*, Incidents = 30, Teams = 10.
   - Click **Run 4-Way Ablation Benchmark**.
2. **Empirical Results Analysis**:
   - Walk the examiner through the side-by-side comparative table:
     1. `FIFO` (Baseline First-In First-Out)
     2. `PRIORITY_ONLY` (Risk-Aware Scoring without Spatial Matching)
     3. `MATCHING_ONLY` (Spatial Matching without Urgency Weighting)
     4. `FULL_INTELLIGENT` (Combined ResQGrid Dual Engine)
   - Highlight key findings:
     - Full Intelligent reduces critical incident wait time by **~65%** compared to FIFO.
     - 30-seed Monte Carlo replication with 95% confidence intervals verifies statistical significance ($p < 0.01$).
3. **Live External Meteorology**:
   - Point out the Open-Meteo live Mumbai weather card: temperature, wind speed, precipitation, and flood alert indicator, strictly isolated as `LIVE_EXTERNAL_METEOROLOGY` with CC BY 4.0 attribution.

---

### Segment 5: Cloud Architecture, Resilience & Defense (Minutes 8:00 – 10:00) — Member 3
1. **AWS Infrastructure & Cost Awareness**:
   - Open `/health` showing active system components.
   - Explain the AWS architecture: Custom VPC (`10.20.0.0/16`), EC2 host in public subnet, RDS PostgreSQL isolated in private DB subnets, S3 private evidence bucket, SQS queue with DLQ, SNS escalation topics, and Amazon ECR with image immutability.
   - Emphasize cost controls: AWS Budgets \$20.00/month cap, zero NAT Gateway charges, Single-AZ `db.t4g.micro`.
2. **Failure Injection & CloudWatch Alarm Recovery**:
   - Click **Pause Worker (Simulate EC2/Queue Stall)**.
   - Submit a new emergency report in Window A.
   - Show SQS queue backlog building up from 0 to 1+.
   - Explain the CloudWatch Alarm: `ApproximateAgeOfOldestMessage > 300s` trips to `ALARM` state and fires an Amazon SNS notification.
   - Click **Resume Worker (Drain & Recover)**.
   - Watch the background worker immediately drain the backlog and restore CloudWatch metric to `OK`.
3. **Database RPO/RTO & Team Work Breakdown**:
   - Reference `docs/database/backup-and-recovery.md`: RPO $\le$ 5 minutes via continuous WAL archiving; RTO $\le$ 30 minutes via point-in-time recovery (PITR).
   - Reference `docs/team-work-breakdown.md` showcasing balanced 3-engineer workload and viva defense preparation.
