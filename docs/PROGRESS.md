# ResQGrid — Faculty Recovery Progress & Verification Checklist
**Target**: Transform Project from 2/10 to 10/10 University Cloud Computing Capstone Standard  
**Last Updated**: November 3, 2026

---

## Stage Checklist

### Phase 1: Brutal Audit & Immediate Gap Analysis
- [x] Create comprehensive forensic audit matrix (`docs/FACULTY_RECOVERY_AUDIT.md`)
- [x] Check unauthenticated vs authenticated route security
- [x] Check PostgreSQL/SQLite record persistence
- [x] Verify evidence upload S3 vs local fallback
- [x] Verify priority engine weights and starvation prevention
- [x] Verify team matching engine with Haversine distance
- [x] Verify atomic inventory reservations with row-level locking
- [x] Verify responder mission progression and audit logging

### Phase 2: Real Auth & Backend-Enforced Roles
- [x] Create `ProtectedRoute.tsx` with role checking and automatic redirect to `/login`
- [x] Guard all privileged routes in `App.tsx` (`/command`, `/responder`, `/inventory`, `/analytics`, `/evidence`, `/health`, `/audit`, `/scenarios`)
- [x] Replace instant 1-click persona switcher in `Navbar.tsx` with genuine user profile & logout
- [x] Update `LoginPage.tsx` to require authentic `POST /api/v1/auth/login` request while retaining convenient test-account selector pills
- [x] Author automated tests verifying unauthenticated/unauthorized calls return 401/403

### Phase 3: One Perfect End-to-End Workflow
- [x] Citizen submits emergency report with location pin, description, category, and evidence photo
- [x] Backend validates, computes 4-factor priority score (35% severity, 25% impact, 20% waiting, 20% vulnerability), and checks for duplicates ($\le 150\text{m}$, $20\text{min}$)
- [x] Operator reviews queue in `/command`: OPEN incidents sorted by priority score then waiting time; resolved incidents behind filter
- [x] Operator reviews ranked candidate squads with capability match, equipment, distance, and ETA
- [x] Operator approves dispatch: executes ONE atomic transaction (validates availability, reserves inventory with row-level lock, creates assignment, writes audit event, stages outbox event)
- [x] Outbox event relayed and processed with correlation ID
- [x] Responder accepts, marks en route, marks on scene, and completes mission
- [x] Stock reserved and released/consumed cleanly; Track Incident page stepper reflects real status without contradictions

### Phase 4: Mission Trace (Signature Feature)
- [x] Create forensic schema in `apps/api/app/schemas/mission_trace.py` covering Sections A through F
- [x] Implement secure backend endpoints `GET /api/v1/incidents/{incident_id}/trace` and `/trace/export` in `apps/api/app/api/v1/mission_trace.py`
- [x] Enforce authentication and role-based access (`OPERATOR`, `ADMIN` allowed; `CITIZEN` rejected with 403; unauthenticated rejected with 401)
- [x] Section A (Origin): Stored tracking ID, coordinates, description, category, severity, status, affected citizens count, duplicate merge list, S3 evidence
- [x] Section B (Priority): Real stored factor values (35% severity, 25% impact, 20% wait time starvation, 20% vulnerability), config version, explanation
- [x] Section C (Team Selection): Candidate squad snapshot from assignment creation, Haversine distance, suitability score, operator override audit reason
- [x] Section D (Inventory Allocation): Reconciled stock reservation rows, depot origin, reserved vs consumed vs released quantities, status
- [x] Section E (Cloud Event Processing): Transactional outbox events, correlation ID matching tracking ID, idempotency keys, honest cloud delivery diagnosis
- [x] Section F (Mission Lifecycle): Chronological timeline combining incident events, assignment transitions, stock reservations, and outbox publications with IST & T+ elapsed offsets
- [x] Connected OpenStreetMap spatial map with incident epicenter, squad locations, and trajectory vectors
- [x] Built responsive, high-typography frontend interface in `apps/web/src/pages/MissionTracePage.tsx` at `/mission-trace/:incidentId`
- [x] Exportable authoritative audit dossier in text/plain with content disposition
- [x] Automated test suite in `apps/api/tests/test_mission_trace.py` (Auth & RBAC + forensic data integrity)
- [x] Capture visual evidence at 1440px desktop, 1024px tablet, and 390px mobile

