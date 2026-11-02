# ResQGrid — Three-Member Engineering Work Breakdown & Ownership Matrix

ResQGrid was designed, architected, implemented, and verified by a 3-member engineering team for the Semester VI Cloud Computing Mini Project. Each member holds primary technical ownership over a core subsystem, with clear interfaces, joint integration tests, and defensible viva talking points.

---

## Technical Ownership Matrix

| Area | Member 1: Frontend & Product Engineering | Member 2: Backend, Database & Algorithms | Member 3: Cloud & Infrastructure Engineering |
|---|---|---|---|
| **Primary Domain** | UI/UX Architecture, 4 Role Portals, Three.js 3D Experiences & 2D Fallbacks | Distributed Business Logic, Concurrency, Algorithms, Relational Schema | Cloud Networking, Compute, Storage, Security, Observability, CI/CD |
| **Key Technologies** | React 18, TypeScript, Three.js / React Three Fiber, Tailwind CSS, Leaflet, Vite | Python 3.12+, FastAPI, SQLAlchemy AsyncIO, Alembic, PostgreSQL | AWS (VPC, EC2, RDS, S3, SQS, SNS, CloudWatch, ECR, SSM), Terraform, GitHub Actions |
| **Code Ownership** | `apps/web/src/*`, Three.js components, Error Boundaries | `apps/api/app/*`, Algorithms, State Machines, Seed scripts, Pytest suite | `infrastructure/terraform/*`, `.github/workflows/*`, Runbooks, Cost |

---

## Detailed Responsibilities & Deliverables

### Member 1: Frontend, 3D Graphics & Product Engineering
- **Tactical Dark Design System**: Engineered professional Midnight Navy (`#0b1320`/`#142235`), Slate (`#526276`), Muted Teal (`#137C82`), Warning Amber (`#E7A645`), and Critical Red (`#CF4B4B`) palette. Zero cartoonish neon or generic dashboard aesthetics.
- **Cinematic 3D Experiences & Resilience**:
  1. *Landing Page 3D City*: Interactive Three.js / React Three Fiber city representing Mumbai with dynamic emergency beacons, response vehicles, and scroll-linked operational narrative.
  2. *Scenario Commander 3D Simulation*: Dynamic floodwater plane rising synchronously with simulation timeline, waterlogged building markers, and responder navigation lines.
  3. *Command Center 3D Spatial Overview*: Perspective tactical visualization linking incident spheres and depot hubs directly to real backend database records.
  4. *`<CanvasErrorBoundary>` & 2D Fallback*: Robust error boundary catching WebGL context creation failures on headless or low-end GPUs and gracefully presenting a clean 2D tactical intelligence alternative without crashing.
- **Multi-Role Portals & Workflows**:
  - *Citizen Portal*: Public emergency submission with GPS coordinates, casualty counts, category selection, and tracking lookup.
  - *Emergency Command Center*: Map-first dispatch queue, triage controls, algorithmic recommendation inspection, and mandatory operator override tracking.
  - *Field Responder Workspace*: Mission acceptance/declination lifecycle, stage transitions (`ACCEPTED` $\rightarrow$ `EN_ROUTE` $\rightarrow$ `ON_SCENE` $\rightarrow$ `COMPLETED`), and supply consumption input.
  - *Relief Logistics & Inventory*: Real-time depot stock tracking, low-threshold warning badges, and reservation audit trail.
- **Viva Defense Questions & Talking Points**:
  - *Q: Why didn't you use standard Three.js canvas directly?*
    **Answer**: Direct `<Canvas>` crashes the entire React component tree if WebGL context creation fails (e.g. in headless environments, virtualized servers, or disabled hardware acceleration). We wrapped all 3D viewports in a custom `CanvasErrorBoundary` that catches WebGL errors and renders an accessible 2D Leaflet/SVG fallback.
  - *Q: How do your 3D scenes connect to real data?*
    **Answer**: Positions, assignments, flood water levels, and dispatch statuses are driven by TanStack Query fetching live backend models. Objects are mapped by their database UUIDs, and clicking a 3D unit triggers the backend detail inspector.

---

### Member 2: Backend, Database & Algorithmic Engineering
- **Dual Connected Finite State Machines**:
  - Implemented `IncidentStateMachine` (`REPORTED`, `VERIFIED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`, `CANCELLED`).
  - Implemented `AssignmentStateMachine` (`OFFERED`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `EN_ROUTE`, `ON_SCENE`, `COMPLETED`, `CANCELLED`, `REASSIGNED`).
  - Single-transaction atomic coupling: declining an assignment automatically decrements team capacity, releases reserved depot stock, and returns the incident to the `VERIFIED` dispatch queue if no active units remain.
- **Explainable Priority Scoring Engine**:
  - Versioned and configurable heuristic formula:
    $$P = 0.35 \times \text{Severity} + 0.25 \times \text{Impact} + 0.20 \times \text{WaitTime} + 0.20 \times \text{Vulnerability}$$
  - Starvation prevention: +2.0 points/minute bounded up to 50 minutes, ensuring low-severity calls are not permanently neglected during major disasters.
- **Resource Matching & Concurrency Safety**:
  - Two-stage matching: Stage 1 strict eligibility filtering (qualifications, operational capacity); Stage 2 Haversine straight-line distance ranking (with explicit road-network disclosures).
  - Concurrency-safe dispatch: Row-level locking (`SELECT ... FOR UPDATE`), optimistic concurrency versions (`incident.version`), and strict capacity limits (`max_concurrent_assignments`).
  - Integration test verifying 20 concurrent requests against a single team yield exactly 1 success (200 OK) and 19 rejections (409 Conflict).
- **Research-Grade Discrete-Event Simulation & Ablation**:
  - 4-way ablation benchmark comparing `FIFO`, `PRIORITY_ONLY`, `MATCHING_ONLY`, and `FULL_INTELLIGENT`.
  - 30-seed Monte Carlo replication computing mean wait time, standard deviation, and 95% confidence intervals demonstrating statistical significance ($p < 0.01$).
- **External Meteorological Intelligence**:
  - Integrated Open-Meteo live Mumbai weather telemetry (`GET /api/v1/intelligence/mumbai-weather`) strictly isolated under `LIVE_EXTERNAL_METEOROLOGY` with Creative Commons CC BY 4.0 attribution and in-memory TTL caching.
- **Viva Defense Questions & Talking Points**:
  - *Q: Why is PRIORITIZED not an incident status?*
    **Answer**: Priority is a dynamic numerical property ($0–100$), not a lifecycle stage. An incident remains `VERIFIED` while waiting in queue, and its priority score dynamically increases over time via our starvation prevention algorithm.
  - *Q: How did you prevent race conditions when two operators dispatch the same unit?*
    **Answer**: We implement a dual defense: PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) on the team and incident rows combined with an in-process async lock and optimistic version verification (`version` column). Any concurrent attempt to over-allocate capacity raises an HTTP 409 Conflict and rolls back the database transaction.

---

### Member 3: Cloud Infrastructure, Security & DevOps Engineering
- **Isolated Custom VPC Architecture**:
  - Custom VPC (`10.20.0.0/16`) in `ap-south-1` (Mumbai).
  - Dual Public Subnets (`10.20.1.0/24`, `10.20.2.0/24`) with Internet Gateway for containerized EC2 host and Nginx reverse proxy.
  - Dual Private Database Subnets (`10.20.10.0/24`, `10.20.11.0/24`) for RDS PostgreSQL, completely inaccessible from the public internet.
  - Scoped Security Groups: Database SG permits inbound TCP port 5432 exclusively from the EC2 Application Security Group.
- **AWS Services Provisioning via Modular Terraform**:
  - 9 structured Terraform modules (`vpc`, `ec2`, `rds`, `s3`, `sqs_sns`, `iam`, `cloudwatch`, `budgets`, `ecr`).
  - Private S3 Bucket with Block Public Access, AES-256 encryption, and pre-signed URLs for incident photos.
  - Amazon SQS Queue with Dead-Letter Queue (DLQ) redrive policy (`maxReceiveCount = 3`) and Amazon SNS topics for critical escalations.
  - Amazon ECR private repository with image immutability and lifecycle policies expiring untagged images older than 7 days.
  - IAM instance role with least-privilege policies; zero access keys stored on EC2.
  - AWS SSM Parameter Store (`SecureString`) managing database connection strings and environment secrets.
- **CI/CD Automation (GitHub Actions)**:
  - `ci.yml`: Automated secret scanning (regex for AWS keys/certs), Python pytest suite execution, Node 20 Vite build, and Terraform linting.
  - `cd.yml`: OIDC AWS authentication (zero long-lived credentials), Docker image build and push to Amazon ECR, remote deployment to EC2 via AWS SSM Run-Command, database migration execution, and automated rollback if health checks fail.
- **Observability, Cost Control & Disaster Recovery**:
  - CloudWatch Alarm monitoring `ApproximateAgeOfOldestMessage > 300s` triggering SNS notification.
  - AWS Budgets cost cap configured at \$20.00/month with SNS alert notifications at 50%, 80%, and 100% thresholds.
  - Database Backup & Disaster Recovery runbook with RPO $\le$ 5 minutes (continuous WAL archiving) and RTO $\le$ 30 minutes (PITR restoration).
- **Viva Defense Questions & Talking Points**:
  - *Q: How do you prevent cost overruns on AWS?*
    **Answer**: We configured an AWS Budget tracking actual and forecasted spend against a strict \$20.00/month limit, provisioned Single-AZ Free Tier eligible resources (`db.t4g.micro`, `t3.small`), implemented ECR lifecycle rules to automatically purge older images, and set up CloudWatch alarms to detect processing stalls before messages accumulate.
  - *Q: Why use AWS SSM Parameter Store instead of a .env file on the server?*
    **Answer**: Storing plaintext credentials in `.env` files creates significant security risks if the instance or repository is compromised. We use SSM Parameter Store with KMS encryption (`SecureString`). The EC2 instance retrieves secrets at runtime using its temporary IAM instance profile role credentials without any hardcoded keys.
