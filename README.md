# ResQGrid: Cloud-Native Disaster Response & Intelligent Resource Coordination Platform

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org)
[![AWS Cloud](https://img.shields.io/badge/AWS-8%20Services-orange.svg)](https://aws.amazon.com)
[![Terraform IaC](https://img.shields.io/badge/Terraform-1.5+-purple.svg)](https://www.terraform.io)
[![Test Suite](https://img.shields.io/badge/Pytest-27%2F27%20Passing%20(100%25)-brightgreen.svg)](https://docs.pytest.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org)

> **Mission:** Intelligent Emergency Coordination. Deterministic Dispatch. Explainable Resource Allocation.  
> **Demonstration Focus:** Mumbai Urban Multi-Hazard Disaster Response (Floods, Earthquakes, Cyclones, Industrial Fires)  
> **Engineering Scope:** Academic Cloud Computing Engineering Project

---

## Academic & Simulation Disclaimer
*All emergency incidents, victim reports, responder squads, depot inventories, and flood inundation boundaries in this project are strictly simulated for academic evaluation in Cloud Computing. ResQGrid is not certified or positioned as an active public emergency dispatch service.*

---

## 1. Project Overview & Architecture

ResQGrid is an end-to-end, cloud-native operational coordination system engineered to survive the worst operational hour of a metropolitan disaster. When sudden emergencies trigger high volumes of citizen reports, ResQGrid guarantees transactional integrity, zero over-allocation of critical supplies, transparent algorithmic ranking, and full state-machine auditability with cryptographic AWS S3 evidence hashing.

### Cloud-Native AWS Infrastructure Architecture

```mermaid
graph TD
    Client["Citizens / Operators / Responders<br/>(HTTPS Web Client)"]
    ALB["AWS Application Load Balancer (ALB)<br/>SSL / TLS Termination & Health Checks"]
    
    subgraph VPC ["Amazon VPC (10.0.0.0/16, ap-south-1)"]
        subgraph PublicSubnets ["Public Subnets (Dual-AZ)"]
            NAT["Internet Gateway (IGW)<br/>(Strictly No Costly NAT Gateway)"]
            ALB
        end

        subgraph AppSubnets ["Auto Scaling App Tier"]
            ASG["Auto Scaling Group (t3.micro EC2)<br/>Docker: React Web + FastAPI Monolith"]
            Worker["SQS Background Consumer<br/>Transactional Outbox Poller"]
        end

        subgraph PrivateDataSubnet ["Private Isolated Subnets (Dual-AZ)"]
            RDS["Amazon RDS PostgreSQL 16<br/>(db.t3.micro, Single-AZ)<br/>Encrypted gp3 Storage (TCP 5432 Only)"]
        end
    end

    subgraph AWSServices ["AWS Managed Services (ap-south-1)"]
        S3Bucket["Amazon S3 Evidence Bucket<br/>- SHA-256 Checksums<br/>- Presigned URLs & SSE-S3"]
        SQSQueue["Amazon SQS Operational Queue<br/>- MaxReceiveCount = 3<br/>- SQS Dead-Letter Queue (DLQ)"]
        SNSTopics["Amazon SNS Alert Topics<br/>- SLA Escalations & Stock Deficits"]
        CloudWatch["Amazon CloudWatch<br/>- Logs: /resqgrid/production<br/>- Alarms: AgeOfOldestMessage > 120s"]
        SSM["AWS SSM Parameter Store<br/>SecureString Secrets"]
        Budgets["AWS Budgets ($20 Cap)<br/>Alerts at 50%, 80%, 100%"]
    end

    Client -->|HTTPS :443| ALB
    ALB -->|HTTP :8000 / :80| ASG
    ASG -->|SQL Port 5432| RDS
    ASG -->|Publish Messages| SQSQueue
    Worker -->|Long Polling 20s| SQSQueue
    Worker -->|MaxRetries Exceeded| SQSQueue --> DLQ
    Worker -->|Trigger Urgent Escalation| SNSTopics
    Worker -->|Stream App Telemetry| CloudWatch
    ASG -->|Presigned Upload / Download| S3Bucket
    ASG -.->|Fetch DB & JWT Config| SSM
```

---

## 2. End-to-End Operational Lifecycle Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen / Reporter
    actor Operator as Command Center Operator
    participant API as FastAPI Backend
    participant DB as PostgreSQL 16
    participant Queue as Amazon SQS / Outbox
    participant Worker as Background Worker
    actor Responder as Field Response Squad

    Citizen->>API: 1. Submit Emergency Report (Coords, Hazard, Victims, Photo)
    API->>DB: 2. Geo-spatial Deduplication Check (150m, 20min radius)
    alt Is Duplicate Report
        API->>DB: Increment report_count on Parent Incident & log Citizen report
    else Is Distinct Incident
        API->>DB: INSERT Incident (Status: REPORTED, Severity, Priority Score)
    end
    API-->>Citizen: 201 Created (Tracking Token & Incident ID)

    Operator->>API: 3. Triage & Request Ranked Candidate Teams
    API->>DB: Query Unit Availability, Capability Matrix, Haversine Distance
    API-->>Operator: Top-3 Candidate Teams + Plain-Language Reason + Stock Verification

    Operator->>API: 4. Operator Approves Dispatch (Mandatory Human-in-the-Loop)
    critical Atomic Database Transaction
        API->>DB: SELECT FOR UPDATE on Depot Inventory
        API->>DB: Reserve Required Stock & Insert Stock Movement Record
        API->>DB: Transition Incident to ASSIGNED
        API->>DB: INSERT Outbox Event (INCIDENT_DISPATCHED)
    end
    API-->>Operator: 200 OK (Dispatch Confirmed, Team Assigned)

    Worker->>Queue: 5. Dequeue & Process Event
    Worker->>API: Notify Squad & Emit CloudWatch Telemetry
    
    Responder->>API: 6. Responder Updates Status (EN_ROUTE -> ON_SCENE -> RESOLVED)
    API->>DB: Update State Machine & Record Transition Audit Log
    
    Responder->>API: 7. Upload Cryptographic Completion Evidence (Photo + SHA-256)
    API->>DB: Verify & Store S3 Key, Release Unconsumed Stock Reserves
    API-->>Responder: Mission Complete (Audit Record Sealed)
```

---

## 3. Platform Visual Showcase

All screenshots are captured directly from live test executions in the environment:

| Command Center & 3D Twin | Mission Trace (Signature Feature) |
|:---:|:---:|
| ![Command Center](docs/screenshots/command_center.png) | ![Mission Trace](docs/screenshots/mission_trace_1440.png) |
| *Real-time incident queue, 3D geospatial twin, and team status.* | *Full audit trail, DB query breakdown, and SLA verification.* |

| Mission Trace Timeline & Map | Citizen Emergency Reporting Portal |
|:---:|:---:|
| ![Timeline & Map](docs/screenshots/mission_trace_timeline_map.png) | ![Citizen Portal](docs/screenshots/citizen_portal.png) |
| *Interactive step-by-step geospatial and audit playback.* | *Multilingual submission, offline-ready sync, and photo upload.* |

| Real-Time Incident Tracker | Responder Tactical Portal |
|:---:|:---:|
| ![Incident Tracker](docs/screenshots/incident_tracker.png) | ![Responder Portal](docs/screenshots/responder_portal.png) |
| *Public tracking token verification and real-time status.* | *Squad status execution: En Route, On Scene, and Evidence Upload.* |

| Relief Inventory & Depot Management | Scenario Commander (Simulation Engine) |
|:---:|:---:|
| ![Relief Inventory](docs/screenshots/relief_inventory.png) | ![Scenario Commander](docs/screenshots/scenario_commander.png) |
| *Atomic inventory reserves, depot levels, and consumption logs.* | *Flood water slider, synthetic load generation, and FIFO benchmark.* |

| Operational KPIs & Analytics | System Health & Cloud Telemetry |
|:---:|:---:|
| ![Analytics KPIs](docs/screenshots/analytics_kpis.png) | ![System Health](docs/screenshots/system_health.png) |
| *Incident funnels, response distribution, and team leaderboards.* | *Queue depth, dead-letter monitoring, and synthetic alarm triggers.* |

---

## 4. Key Engineering Highlights & Innovations

1. **Mission Trace System (`/mission-trace/:id`)**:
   - Signature audit verification showing every database query, state transition, inventory lock, priority weight calculation, and outbox event for an incident.
   - Computes live SLA compliance (`MET`, `AT_RISK`, `BREACHED`) with exact seconds and provides one-click JSON export.

2. **Strict Role-Based Access Control (RBAC)**:
   - Full JWT authentication with 4 distinct roles: `citizen`, `operator`, `responder`, and `admin`.
   - Backend enforcement (`require_roles(...)`) on all sensitive dispatch and triage endpoints.
   - Frontend route guarding via `<ProtectedRoute />` preventing unauthorized role escalation.

3. **Concurrency-Safe Atomic Inventory Allocation**:
   - Implements PostgreSQL `SELECT ... FOR UPDATE` row-level locking on depot inventory.
   - Prevents race conditions and phantom allocation when simultaneous dispatches compete for finite medical kits, rescue boats, or dewatering pumps.
   - Automatic stock release upon incident resolution or operator cancellation.

4. **Geospatial Incident Deduplication**:
   - Automatically merges incoming citizen emergency reports within 150 meters and 20 minutes of an active incident of the same hazard type.
   - Prevents queue flooding while updating caller counts and citizen contact history.

5. **Explainable Priority & Team Matching Engine**:
   - Multi-criteria decision heuristic incorporating severity, population density, reported casualties, and dynamic waiting-time starvation prevention ($\Delta t$).
   - Team ranking matches capability sets, haversine travel distance, equipment readiness, and active squad workload with plain-language operational rationales.

6. **AWS Well-Architected Cloud Infrastructure (Terraform IaC)**:
   - Designed for cost optimization in `ap-south-1` (Mumbai).
   - Strict dual-subnet architecture without expensive NAT Gateways ($0 NAT cost).
   - Auto Scaling Group with Application Load Balancer and health-check routing.
   - CloudWatch custom metric monitoring (`ApproximateAgeOfOldestMessage`) with synthetic worker pause controls to demonstrate real alarm triggering.

---

## 5. Technology Stack

- **Backend**: Python 3.12+, FastAPI, SQLAlchemy ORM, Alembic, Pydantic v2, Pytest.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet, Three.js / React Three Fiber, Apache ECharts / Recharts.
- **Database & Storage**: PostgreSQL 16 (with PostGIS extensions), Amazon S3 (AES-256 SSE).
- **Messaging & Compute**: Amazon SQS + DLQ, Amazon SNS, AWS Systems Manager (SSM), Amazon CloudWatch.
- **Infrastructure as Code (IaC)**: Terraform 1.5+ (modular: VPC, ASG/ALB, RDS, S3, IAM, SQS/SNS, CloudWatch, Budgets).

---

## 6. Local Development & Quickstart

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- Docker and Docker Compose (or local PostgreSQL 16)

### Option A: One-Command Docker Setup
```bash
# Clone the repository
git clone https://github.com/shaaunak/ResQGrid.git
cd ResQGrid

# Copy configuration
cp .env.example .env

# Build and start all services (PostgreSQL, FastAPI API, React Web, SQS Worker)
docker compose up --build -d
```

### Option B: Local Native Setup
```bash
# 1. Start PostgreSQL
docker run --name resqgrid-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=resqgrid -p 5432:5432 -d postgres:16-alpine

# 2. Setup and run Backend API
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resqgrid"
alembic -c apps/api/alembic.ini upgrade head
python scripts/seed/seed_data.py
uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port 8000 --reload

# 3. Setup and run Frontend Web
cd apps/web
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 7. Automated Testing & Verification Evidence

ResQGrid includes an exhaustive automated test suite testing RBAC boundaries, atomic inventory reservation, priority calculation, and end-to-end incident lifecycles:

```bash
source .venv/bin/activate
pytest apps/api/tests/ -v
```

### Test Suite Execution Output
```text
============================= test session starts ==============================
platform darwin -- Python 3.12.2, pytest-8.3.4, pluggy-1.5.0 -- /Users/shaaunak/ccl/.venv/bin/python
rootdir: /Users/shaaunak/ccl
configfile: pyproject.toml
plugins: anyio-4.8.0
collected 27 items

apps/api/tests/test_auth_and_rbac.py::test_public_endpoints_accessible PASSED            [  3%]
apps/api/tests/test_auth_and_rbac.py::test_login_success_and_jwt_generation PASSED       [  7%]
apps/api/tests/test_auth_and_rbac.py::test_invalid_credentials_rejected PASSED          [ 11%]
apps/api/tests/test_auth_and_rbac.py::test_rbac_forbidden_for_unauthorized_role PASSED  [ 14%]
apps/api/tests/test_auth_and_rbac.py::test_rbac_allowed_for_authorized_role PASSED      [ 18%]
apps/api/tests/test_auth_and_rbac.py::test_admin_has_universal_access PASSED            [ 22%]
apps/api/tests/test_e2e_workflow.py::test_full_incident_lifecycle_workflow PASSED        [ 25%]
apps/api/tests/test_inventory_concurrency.py::test_inventory_atomic_reservation_and_deficit_protection PASSED [ 29%]
apps/api/tests/test_inventory_concurrency.py::test_rbac_boundary_enforcement PASSED    [ 33%]
apps/api/tests/test_matching_engine.py::test_haversine_distance_calculation PASSED      [ 37%]
apps/api/tests/test_matching_engine.py::test_matching_engine_filters_and_ranks PASSED   [ 40%]
apps/api/tests/test_mission_trace.py::test_mission_trace_endpoint_returns_audit_trail PASSED [ 44%]
apps/api/tests/test_mission_trace.py::test_mission_trace_not_found_returns_404 PASSED   [ 48%]
apps/api/tests/test_mission_trace.py::test_mission_trace_sla_compliance_calculation PASSED [ 51%]
apps/api/tests/test_perfect_e2e_workflow.py::test_perfect_disaster_response_lifecycle PASSED [ 55%]
apps/api/tests/test_perfect_e2e_workflow.py::test_duplicate_incident_deduplication PASSED [ 59%]
apps/api/tests/test_perfect_e2e_workflow.py::test_inventory_stock_locking_and_deficit_prevention PASSED [ 62%]
apps/api/tests/test_perfect_e2e_workflow.py::test_outbox_event_creation_and_worker_processing PASSED [ 66%]
apps/api/tests/test_priority_engine.py::test_priority_weights_sum_to_one PASSED         [ 70%]
apps/api/tests/test_priority_engine.py::test_critical_flood_urgency_higher_than_minor_incident PASSED [ 74%]
apps/api/tests/test_priority_engine.py::test_waiting_time_increases_priority PASSED    [ 77%]
apps/api/tests/test_priority_engine.py::test_severity_order_respected PASSED            [ 81%]
apps/api/tests/test_priority_engine.py::test_score_bounded_between_zero_and_one PASSED   [ 85%]
apps/api/tests/test_priority_engine.py::test_priority_breakdown_contains_all_components PASSED [ 88%]
apps/api/tests/test_priority_engine.py::test_vulnerability_multiplier_for_sensitive_zones PASSED [ 92%]
apps/api/tests/test_priority_engine.py::test_zero_waiting_time_does_not_break PASSED    [ 96%]
apps/api/tests/test_priority_engine.py::test_extreme_people_affected_caps_gracefully PASSED [100%]

============================== 27 passed in 1.48s ==============================
```

---

## 8. 3-Member Team Contribution & Work Breakdown

| Contributor & Role | Primary Engineering Responsibilities | Key Deliverables & Modules |
|:---|:---|:---|
| **Shaunak (Member 1)**<br/>*Cloud Architect & Backend Lead* | • Cloud infrastructure design & Terraform IaC (VPC, ASG, ALB, RDS, S3)<br/>• FastAPI monolith architecture & PostgreSQL 16 schema design<br/>• Transactional Outbox pattern & SQS background polling worker<br/>• Concurrency-safe atomic inventory reservation (`FOR UPDATE`) | `infrastructure/terraform/`<br/>`apps/api/app/services/`<br/>`apps/api/app/models/`<br/>`apps/worker/` |
| **Team Member 2**<br/>*Algorithms & Security Auditor* | • Explainable multi-factor Priority Engine & starvation prevention ($\Delta t$)<br/>• Heuristic Team-Matching & Haversine distance calculator<br/>• Geospatial duplicate detection engine (150m / 20min radius)<br/>• JWT Authentication & role-based access control (RBAC) middleware | `apps/api/app/services/priority.py`<br/>`apps/api/app/services/matching.py`<br/>`apps/api/app/core/security.py`<br/>`apps/api/tests/` |
| **Team Member 3**<br/>*Frontend & Data Visualization Lead* | • React 18 + TypeScript tactical operator command center<br/>• Mission Trace interactive audit replay & timeline explorer<br/>• Three.js / React Three Fiber 3D digital twin of Mumbai flood zones<br/>• Multi-hazard disaster packs & responsive field responder portals | `apps/web/src/pages/`<br/>`apps/web/src/components/`<br/>`apps/web/src/components/three/`<br/>`apps/web/public/data/` |

---

## 9. Cloud Cost & Budget Protection (AWS ap-south-1)

- **Evaluation Demonstration Run (40 hours)**: **~$1.87 USD**
- **Continuous 1-Month Operation (730 hours)**: **~$33.77 USD** (or **~$3.65 USD** with AWS Free Tier)
- **High-Cost Resources Avoided**: Zero NAT Gateway (-$32.85/mo saved), Single-AZ RDS PostgreSQL (-$15/mo saved), efficient t3.micro sizing.
- **Budget Protection**: AWS Budgets configured with $20.00 monthly cap and 50%, 80%, 100% email triggers.

---

## 10. Repository File Structure

```text
ResQGrid/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD (Test, Lint, Docker Build)
├── apps/
│   ├── api/                    # Python 3.12+ FastAPI Application
│   │   ├── alembic/            # Database schema migrations
│   │   ├── app/                # Routers, Models, Schemas, Services, Core
│   │   ├── tests/              # 27 Automated Pytest unit & integration tests
│   │   └── Dockerfile          # Production backend container
│   ├── web/                    # React 18, TypeScript, Tailwind, Three.js
│   │   ├── public/             # Static assets, GeoJSON Mumbai elevation data
│   │   ├── src/                # Pages, Components, Context, Types
│   │   └── Dockerfile          # Multi-stage production container
│   └── worker/                 # Amazon SQS / Outbox background event consumer
│       ├── app/worker.py       # Idempotent polling, retries & DLQ handling
│       └── Dockerfile          # Worker service container
├── docs/
│   ├── screenshots/            # Authentic application screenshots
│   ├── architecture/           # Cloud networking & system design
│   ├── algorithms/             # Priority & Matching heuristic math
│   └── FACULTY_RECOVERY_AUDIT.md # Faculty audit & verification report
├── infrastructure/
│   └── terraform/              # Terraform modules (vpc, asg_alb, rds, s3, iam, sqs_sns, cloudwatch, budgets)
├── scripts/
│   ├── seed/seed_data.py       # Mumbai disaster demonstration seed dataset
│   ├── k6_load_test.js         # K6 load testing script
│   ├── demo_autoscaling.sh     # Auto Scaling demonstration trigger
│   └── nightly_backup.sh       # S3 automated database backup script
├── docker-compose.yml          # Local multi-service orchestration
├── Makefile                    # Make commands for test, lint, build, seed
├── .env.example                # Zero credentials environment template
└── README.md                   # Master engineering documentation
```

---

## License
Distributed under the MIT License. Built for Cloud Computing Academic Evaluation.
