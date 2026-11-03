# ResQGrid — Faculty Recovery Audit & Technical Gap Analysis
**Date**: November 3, 2026  
**Auditor**: Principal Software Architect & QA Lead  
**Assessment Target**: Transform build from 2/10 to 10/10 University Cloud Computing Capstone Standard  
**Governing Rule**: Mark every requirement PASS, FAIL, NOT VERIFIED, or BLOCKED. Label anything simulated "simulated" and anything replayed "replay". Never claim without evidence.

---

## 1. Executive Summary & Brutal Gap Analysis

A rigorous forensic audit of the codebase, APIs, authentication layer, database models, background queues, and cloud infrastructure was conducted. The examination revealed why a strict professor rated the project 2/10:

1. **Frontend Persona Switcher Bypass**: The UI contained a dropdown menu (`Navbar.tsx`) that permitted any guest/unauthenticated user to switch operational personas (e.g. to `OPERATOR` or `ADMIN`) by auto-populating credentials or spoofing local state, rather than enforcing hard route guards and real authentication. Privileged frontend views were accessible by direct navigation.
2. **Local SQLite vs. Real AWS Cloud PostgreSQL**: While Terraform configs exist for AWS Aurora/RDS, local development defaulted to `sqlite+aiosqlite:///./resqgrid.db` with local file uploads (`./uploads`) instead of an authoritative PostgreSQL database and true S3 presigned URLs.
3. **Queue & Background Worker Disconnection**: The API wrote to a transactional outbox table, but the background worker (`apps/worker/app/worker.py`) was not continuously running as a synchronized daemon in development, leaving queue processing disjointed.
4. **Mission Trace Visibility Missing**: There was no dedicated, verifiable "Mission Trace" screen showing the complete causal lineage of an incident from citizen submission $\to$ priority calculation breakdown $\to$ operator candidate selection $\to$ atomic supply reservation $\to$ outbox/SQS event $\to$ responder lifecycle milestones.
5. **Simulated vs. Real Demarcation**: Some telemetry and metrics in the dashboard were labelled as real despite lacking clear provenance from the underlying database or cloud APIs.

---

## 2. Comprehensive Itemized Audit Matrix

| # | Subsystem / Feature | Implementation Details | File Paths | Test Performed | Evidence / Command Output | Result | Fix Required | Severity |
|---|---|---|---|---|---|---|---|---|
| **1** | **Real Authentication & Protected Routes** | JWT Bearer tokens issued via `/api/v1/auth/login`. Passwords hashed with bcrypt. However, frontend `App.tsx` lacked route guards (`ProtectedRoute`), allowing unauthenticated guests to view `/command`, `/analytics`, `/health`, `/inventory`. | `apps/web/src/App.tsx`<br>`apps/web/src/components/Navbar.tsx`<br>`apps/api/app/api/v1/auth.py` | Direct GET to `/command` without token; inspection of Navbar persona switcher. | `Navbar.tsx` lines 200-260: Persona dropdown allowed 1-click persona switching; `App.tsx` routes had no `<ProtectedRoute>` wrapper. | **FAIL** | Add `<ProtectedRoute allowedRoles={[...]}>` wrapper in `App.tsx`; restrict Navbar to genuine logout; require real credential submission on `/login`. | **CRITICAL** |
| **2** | **Backend Role Enforcement (RBAC)** | FastAPI endpoints use `require_roles([UserRole.OPERATOR, UserRole.ADMIN])`. Unauthenticated or unauthorized calls correctly return 401/403. | `apps/api/app/api/deps.py`<br>`apps/api/app/api/v1/incidents.py`<br>`apps/api/app/api/v1/admin.py` | Automated probe sending unauthenticated POST to `/api/v1/incidents/{id}/verify` and `/api/v1/admin/worker/pause`. | `res.status_code == 401 Unauthorized` for all protected endpoints. | **PASS** | Maintain strict dependency injection and ensure no endpoint bypasses `require_roles`. | **LOW** |
| **3** | **Incident Persistence & Relational Schema** | SQLAlchemy 2.0 async models with PostgreSQL/SQLite compatibility. 18 tables including incidents, assignments, teams, inventory, events, evidence, and audit logs. | `apps/api/app/models/incident.py`<br>`apps/api/app/models/assignment.py`<br>`apps/api/app/models/inventory.py` | Database query for record counts on live database. | `db_counts: {'incidents': 20, 'assignments': 14, 'inventory_stocks': 18, 'audit_logs': 220}` | **PASS** | Add PostgreSQL container integration tests in `tests/` for multi-worker race conditions. | **MEDIUM** |
| **4** | **Evidence Upload (S3 vs. Local Mock)** | `StorageService` implements `generate_upload_url` with dual backends: AWS S3 presigned PUT URLs when `STORAGE_BACKEND=s3` and fallback to local API route when offline. | `apps/api/app/services/storage.py`<br>`apps/api/app/api/v1/evidence.py` | POST to `/api/v1/evidence/presigned-url` with image filename and MIME type. | Returns valid presigned URL or local structured upload endpoint with unique UUID key. | **PASS** | Clearly label uploaded media metadata with storage backend (`s3` vs `local_simulated`). | **MEDIUM** |
| **5** | **Priority Scoring Engine** | Four-factor explainable calculation: Urgency (35%), Affected People (25%), Waiting Time (20%), Critical Facilities / Vulnerability (20%). Monotonic waiting time prevents starvation. | `apps/api/app/services/priority_engine.py` | Pytest `test_priority_engine_starvation_prevention` and `test_waiting_time_increases_priority`. | `pytest apps/api/tests/test_priority_engine.py -v` $\to$ PASSED. Weights strictly sum to 1.0. | **PASS** | Expose full breakdown factors in the new Mission Trace view. | **LOW** |
| **6** | **Dynamic Team Recommendation** | Haversine distance, capability matching score, equipment checklist, and current workload calculated dynamically. Operator must explicitly approve. | `apps/api/app/services/matching_engine.py`<br>`apps/api/app/api/v1/incidents.py` | Pytest `test_matching_engine_filters_and_ranks` and query `/incidents/{id}/recommendations`. | Ranks candidates with match percentages, transit time ETA, and plain-language reason. | **PASS** | Ensure operator dispatch creates atomic assignment and reservations in ONE transaction. | **LOW** |
| **7** | **Atomic Dispatch & Inventory Reservation** | Approving dispatch triggers transactional row-level lock (`with_for_update()`), reserves depot items, logs stock movements, creates assignment, and stages outbox event. | `apps/api/app/api/v1/incidents.py#L650-L750` | Pytest `test_inventory_atomic_reservation_and_deficit_protection`. | PASSED. Prevents negative stock under concurrent requests. | **PASS** | Ensure release occurs cleanly upon incident resolution or mission cancellation. | **LOW** |
| **8** | **Responder Workflow & Milestone Progression** | Responders receive offered missions and transition: `OFFERED` $\to$ `ACCEPTED` $\to$ `EN_ROUTE` $\to$ `ON_SCENE` $\to$ `COMPLETED`. | `apps/api/app/api/v1/assignments.py` | Pytest `test_assignment_state_machine_valid_transitions` and UI responder portal actions. | `AssignmentEvent` and `IncidentEvent` rows persisted synchronously. | **PASS** | Connect to Track Incident stepper and synchronize responder GPS coordinates. | **LOW** |
| **9** | **Asynchronous Queue & Outbox Processing** | EventPublisher stages events in `outbox_events` table; `EventWorker` polls and relays to SQS or executes idempotent handlers. | `apps/api/app/services/event_publisher.py`<br>`apps/worker/app/worker.py` | Tested worker pause and resume endpoints in `apps/api/app/api/v1/admin.py`. | Backlog accumulates above 5 msgs, alarm state switches to `ALARM`, recovery drains backlog to 0. | **PASS** | Integrate background worker daemon with health check and correlation ID logging. | **MEDIUM** |
| **10** | **CloudWatch Alarms & Infrastructure Telemetry** | Alarms defined in Terraform for SQS message age, ALB 5xx, and low stock. Telemetry endpoint reports CPU, RAM, RDS query latency, and alarm timeline. | `apps/api/app/api/v1/health.py`<br>`infrastructure/terraform/modules/cloudwatch/main.tf` | Curl `/api/v1/health` and verify latency measurements. | Real database ping latency measured (`1.69 ms`), uptime tracked from process start. | **PASS** | Clearly distinguish live local metrics from simulated AWS cloud telemetry. | **LOW** |
| **11** | **3D Digital Twin Integration** | React Three Fiber extruded OSM building footprints of Mumbai with elevation terrain, custom GLSL water shader, and beacons. | `apps/web/src/components/three/OperationalLayers3D.tsx`<br>`apps/web/src/pages/CommandCenter.tsx` | Headless Chrome screenshot capture with Angle Metal WebGL rendering. | `three_command_angle.png` rendered with depth occlusion and dynamic priority pillars. | **PASS** | Ensure 3D playback timeline is strictly driven by real database simulation events. | **MEDIUM** |
| **12** | **Spatial-Temporal Duplicate Merging** | Corroborating reports within $150\text{ m}$ and $20\text{ min}$ merge under a single parent incident, incrementing `report_count`. | `apps/api/app/api/v1/incidents.py#L80-L175` | Pytest `test_spatial_temporal_duplicate_merge_logic`. | Merged reports listed in `IncidentResponse.merged_reports` and displayed in Triage Drawer. | **PASS** | Maintain strict idempotency keys across rapid submissions. | **LOW** |
| **13** | **Mission Trace (Signature Feature)** | End-to-end auditability showing Origin $\to$ Priority Decision $\to$ Responder Selection $\to$ Resource Allocation $\to$ Cloud Event Trail $\to$ Mission Lifecycle. | Not yet built as a standalone dedicated page. | Route inspection. | No `/trace/:id` or `/mission-trace` page existed. | **FAIL** | **Build dedicated Mission Trace route (`/trace/:id`) backed by real database records.** | **HIGH** |

---

## 3. Immediate Action Plan

To systematically resolve all audit findings and guarantee a **10/10** capstone grade:
1. **Execute Phase 2 (Real Auth & Roles)**:
   - Build a robust `<ProtectedRoute allowedRoles={[...]} />` component in React Router.
   - Guard all privileged operational routes (`/command`, `/responder`, `/inventory`, `/analytics`, `/evidence`, `/health`, `/audit`, `/scenarios`).
   - Redesign `LoginPage.tsx` with clean credential prefill pills for testing, but require an explicit, authentic `POST /api/v1/auth/login` request.
   - Strip out any fake persona switching that bypasses API authentication.
2. **Execute Phase 3 (One Perfect End-to-End Workflow)**:
   - Verify citizen emergency reporting with location pin and image metadata.
   - Verify operator verification, four-factor priority computation, dynamic team ranking, and atomic dispatch with supply reservation.
   - Verify responder mission lifecycle progression (`ACCEPTED` $\to$ `EN_ROUTE` $\to$ `ON_SCENE` $\to$ `COMPLETED`).
   - Verify incident tracking and live analytics reflect real status changes.

