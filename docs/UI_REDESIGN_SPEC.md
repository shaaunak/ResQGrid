# ResQGrid — UI/UX Redesign and Product-Hardening Spec

Save as `docs/UI_REDESIGN_SPEC.md`. Kickoff message for the agent: "Read docs/UI_REDESIGN_SPEC.md fully. Do Section 1 (the audit) only, write docs/ui/AUDIT.md, then stop and show me the plan before changing any code."

## 0. Mission

You are improving an existing, working app: React + TypeScript + Vite + Tailwind frontend, FastAPI backend, PostgreSQL, AWS deployment planned. Do not rewrite it from scratch.

Two goals carry equal weight:

1. **Design quality.** It must look like a serious municipal emergency-operations product, not a generic AI-generated dashboard.
2. **Truthfulness.** Every number, label, badge and claim on screen must be real, consistent across pages, and traceable to backend data. A strict examiner will click around looking for contradictions and fake values.

Ground rules:
- Keep every working feature. If something is not actually implemented, either implement it or hide or relabel it. Never leave a decorative claim on screen.
- Change backend contracts only when needed, and document each change in `docs/ui/CHANGELOG.md`.
- Work in small verified increments. Run the app, look at it, fix it. Do not declare anything done without running it and viewing the result.
- Keep `docs/ui/PROGRESS.md` current: done / in progress / blocked, with evidence paths.
- Never invent test results, screenshots, metrics or AWS values.

---

## 1. Step 0 — Audit before touching code

Run the app. Visit every route at 1440, 1024 and 390 px wide, in light and dark mode. Save screenshots to `docs/evidence/ui/before/`. Write `docs/ui/AUDIT.md` with, for each issue: route, what you saw, severity, planned fix.

The following defects were observed in a screen recording of the current build. Verify each one and mark it CONFIRMED or NOT REPRODUCED. Do not assume.

| ID | Observed defect |
|---|---|
| D1 | Overview shows 2 critical incidents and median response 18.5 min; Analytics shows 4 open critical and median 17.6 min. Same concepts, different numbers. |
| D2 | Analytics "Incident Lifecycle Funnel" shows Assigned 28 and En route 28 above Reported 21 and Verified 15. A funnel cannot grow downstream. The counts look like current-status counts, not a cohort. |
| D3 | "Resource util 72.5% — Optimal" is shown while "0 active squads". |
| D4 | Three different depots all show "Stock Availability 82%". Check whether this is real or seeded and uniform. |
| D5 | Cloud & Health: the alarm timeline cards show 12:00, 14:00, 16:00, 18:00 and "Current", but the live chart runs at about 20:53. The history does not match the live data. |
| D6 | The SNS notice names emergency-lead@resqgrid.org, a domain that does not exist. |
| D7 | Project Evidence shows "14 / 14 — 100% Compliance Verified" and "3 alarms configured: SQS Age, ALB 5xx, Stock". The architecture has no ALB. The VPC CIDR shown is 10.0.0.0/16 while the design says 10.20.0.0/16. Check whether the values are computed or hardcoded. |
| D8 | Hero copy says "explainable AI priority scoring". The engine is deterministic and rule-based; it is not AI. |
| D9 | A "LIVE WS" badge is shown. Check whether WebSockets are actually used or the app polls. |
| D10 | Citizen page shows an "Offline cache ready" badge. Check whether any service worker or offline queue exists. |
| D11 | Audit page claims "Cryptographically sealed" and "ACID compliant". Check whether hash chaining exists. |
| D12 | One shared navigation shows every portal (Citizen, Responder, Inventory, Evidence…) to an operator, with "Role: OPERATOR" visible on the Citizen page. Role-based portals are not visibly separated. |
| D13 | 13 left-nav items mixing daily operations with evaluation material (Evidence, Docs, Audit). |
| D14 | Terminology drift: "squad", "team", "unit", "tactical squad" all appear for the same thing. |

For every defect, the fix is either to make the claim true or remove it.

---

## 2. Design direction

### 2.1 Identity: "calm control room"
Think printed municipal atlas crossed with an air-traffic-control screen. Quiet, paper-like surfaces. One strong ink colour. Colour used for meaning (severity and status), not decoration. Dense but legible. The operational screens are the product. A marketing hero inside the app is not.

### 2.2 Tokens
Define CSS variables and map them in the Tailwind theme. No raw hex values in components.
- Ink `#142235` (text, primary buttons). Paper `#F7F8F6` (page). Panel `#FFFFFF`. Sunken `#EFF1EE`. Line: ink at about 12% opacity.
- Secondary text slate `#526276`. Accent teal `#137C82` (links, selection, focus ring, secondary actions).
- Severity and status colours, each with fg, bg and border variants that pass WCAG AA when used as text on their tint: critical `#CF4B4B`, high deep orange (about `#D9822B` for fills, darker for text), medium amber `#E7A645` for fills only (use a dark amber for text), low slate.
- Severity is never colour-only. Pair colour with shape and label: critical = filled triangle, high = diamond, medium = filled circle, low = hollow circle. The same shapes appear on map markers, queue rows and badges.
- Dark mode is a full theme with the same tokens redefined, not an inverted afterthought. Test both.

### 2.3 Typography
- UI: IBM Plex Sans (400, 500, 600). Base size 14px for dense screens. Scale: 12 / 13 / 14 / 16 / 20 / 28 / 40.
- IDs, coordinates, timestamps, quantities: IBM Plex Mono with `font-variant-numeric: tabular-nums`. Numbers in tables are right-aligned.
- Marathi and Hindi: Noto Sans Devanagari, with a size bump of about 1px.
- Optional display serif (Newsreader) only on the logged-out landing page and PDF report titles.
- Self-host fonts with `@fontsource` packages. No runtime dependency on Google Fonts.
- Sentence case everywhere. Uppercase tracked labels only for table headers and at most two overlines per screen.

### 2.4 Layout and spacing
- 4px grid. Panel padding 16 or 24. Table rows 36px (compact) or 44px (comfortable), with a density toggle that is remembered.
- Radius: 6px controls, 8px panels, full-round only for status dots. Do not mix 12/16/20px radii.
- Hairline 1px borders. Shadows only on popovers, drawers and dialogs.
- Left navigation is an icon rail by default (56px) with labels on expand or hover. Top bar is minimal: breadcrumb, working search, mode badge, notifications, user menu.
- Prefer dividers and whitespace to a wall of boxed cards. No card inside a card.

### 2.5 Component set (build once, reuse everywhere)
Button, IconButton, Input, Select, Combobox, Checkbox, Switch, Tabs, Stepper, Badge (status only), Tag (neutral), StatusMark (shape + colour), DataTable (sticky header, sortable, filterable, density, virtualised for long lists), Drawer, Dialog, Popover, Toast, Tooltip, Skeleton, EmptyState (always offers a next action), ErrorState (retry + request id), Stat (number, label, definition tooltip, as-of time; sparkline only when backed by real series), themed chart wrappers, map markers, CommandPalette (cmdk), KeyboardShortcutHelp.

### 2.6 Anti-"AI-generated" rules (enforced in review)
- No icon-in-a-coloured-rounded-square on every metric. A metric is a number, a label and a delta.
- No pill badge on every element. Badges are for status and severity only.
- No vague taglines or buzzwords: "intelligent", "AI-powered", "dynamic disaster theatres", "cryptographically sealed", "real-time" unless literally true and measurable.
- No gradient text, glows, glassmorphism or decorative blobs. No emoji.
- No hero section inside the authenticated app.
- No identical grids of same-sized cards as the main layout. Use a table, a list or a map where the data is a table, a list or a place.
- One accent colour per screen besides status colours.
- Copy is specific and plain: "3 incidents waiting for verification", not "Immediate triage required".
- Empty states explain what to do next. Errors say what failed and offer retry.
- Glossary is fixed: incident, team, mission, depot, shelter, dispatch. Replace squad, unit, tactical squad, beacon, etc. everywhere, including seeds and API-facing labels.

### 2.7 Motion
Restrained and functional only: drawer slide, row highlight on update, skeleton shimmer, toast. 150–200 ms, transform and opacity only. Respect `prefers-reduced-motion`. No animation libraries unless already present.

---

## 3. Information architecture — role-based shells

Each role gets its own shell and navigation, enforced by the router and by backend authorization. A user never sees nav entries for portals they cannot use.

| Role | Navigation (max 6) |
|---|---|
| Citizen | Report, My reports, Track |
| Operator | Briefing, Command, Incidents, Teams, Analytics |
| Responder | Missions, History |
| Relief coordinator | Inventory, Depots and shelters, Movements, Reports |
| Admin | Users, Audit log, Scoring config, System health, Evaluation |

- Logged-out routes: Landing (marketing allowed here), Login/Register, public Track, anonymised public map.
- The Evidence, Docs, demo script and failure-drill pages move to an Evaluation section under `/eval`, visible only to Admin when `VITE_EVAL_MODE=true`. It has a thin amber top bar reading "Evaluation mode". The operational product must not contain faculty-facing wording.
- A dev-only role switcher is allowed for demos. It shows a persistent banner and is compiled out of production builds.

---

## 4. Page specifications

### 4.1 Briefing (operator home, replaces the hero overview)
A shift briefing, not a landing page.
- Header: date and time in IST, shift, last refreshed time.
- Needs your decision (primary column): unverified incidents, incidents near SLA breach, declined or expired assignments, low-stock alerts. Each row has the one-click next action.
- Situation (secondary column): small 2D map with hotspots plus four numbers (open critical, active missions, teams available, median time to dispatch), each with a definition tooltip and "as of".
- Since you were last here: a feed derived from the audit log.
- Every number comes from the same endpoints the Analytics page uses (see Section 5).

### 4.2 Command Center (flagship)
Three resizable panes:
- Queue (left): virtualised list sorted by priority score. Row: StatusMark, tracking ID (mono), headline, locality, score, SLA countdown. Filters for category, severity, status, time.
- Map (centre): 2D by default. Marker shape = severity, colour = status, clustering when zoomed out, selection halo, optional heat layer, Mumbai service-area outline. Legend is collapsible and never covers markers. The 3D digital twin is an optional "Briefing view", lazy-loaded, and must not affect the initial bundle.
- Detail drawer (right): summary, evidence thumbnails (presigned URLs), score breakdown as a stacked horizontal bar with factor values and weights on hover, event timeline, ranked team recommendations with plain-English reasons and a collapsed "why not other teams" section, Dispatch button. Overriding the top recommendation requires a reason, which is stored with a snapshot of what was shown.
- Keyboard: j/k move, Enter open, v verify, d dispatch, / search, ? help. The command palette (⌘K) searches incidents, teams and depots and runs real actions. It must not be a non-functional search box.
- The flood-depth slider is allowed only if it feeds a real input (for example a scenario parameter that changes scores or the 3D layer). Otherwise remove it.

### 4.3 Citizen — report wizard
Keep the 4-step wizard. Improve:
- Location step: map pin with search and optional GPS (permission-based), service-area validation, plain-language error if outside Mumbai.
- Details step: photo upload with preview, size and type limits shown before upload, EXIF location stripped server-side.
- Review step: everything editable before submit.
- Success: large tracking ID, copy button, link to Track. A small QR code to the tracking page is optional.
- Marathi / Hindi / English via `react-i18next` with complete translations for every citizen string. Missing keys must fail the build or tests, not fall back silently. Language choice persists.
- "Offline cache ready" appears only if a real service worker plus IndexedDB queue exists and has been tested. Otherwise remove the badge.

### 4.4 Track incident
Vertical timeline of real events with timestamps. ETA is labelled "about N min (straight-line estimate)". Any squad position shown on the map is labelled "simulated telemetry" in this academic build. The public view shows only what Section 5 allows.

### 4.5 Responder — mobile first
Design at 390 px first. Single column. Large touch targets (at least 44px). Mission card → Accept or Decline → status buttons (En route, On scene, Complete) with confirmation → consumption form with steppers → photo proof upload. Navigation link opens an external map app. Works when the connection is slow (retry with clear state). The desktop view is a centred column, not a stretched layout.

### 4.6 Relief inventory
- Depot summary as a compact table (name, type, availability, low-stock count) rather than three identical cards. Values must differ because the data differs. Check D4.
- Ledger: sticky header, filters, low-stock rows highlighted by mark and text, not just colour.
- Add a projected run-out column (hours remaining at the recent consumption rate) with the calculation shown on hover.
- Tabs: Stock, Reservations, Movements, Shelters. Donation intake in a dialog. CSV export.

### 4.7 Scenario Commander
Three-step layout: Configure → Run → Compare.
- Compare view: metric table with FIFO vs proposed, delta and 95% confidence interval; waiting-time CDF; per-seed paired-difference dot plot; ablation rows (priority only, matching only).
- A "Where the baseline wins" callout generated from the data.
- Reproducibility card: seed, config hash, run time, git commit.
- Saved runs list. Replay timeline for one seed.
- Clearly label fast algorithmic simulation vs integration demo.

### 4.8 Analytics
- Time-window selector. Every KPI has a definition tooltip, an n = and an "as of" time.
- Funnel: either a proper cohort funnel (incidents created in the window, monotonic non-increasing) or replace it with a status-distribution chart with an honest title. Fixes D2.
- Remove sparklines that are not backed by real time series.
- Chart colours come from the token palette, with direct labels instead of legends where possible.

### 4.9 Audit log
DataTable with entity, actor, action, time, expandable before/after diff. Filters. Export. Show "Verify chain integrity" only if hash chaining is implemented (each row stores the hash of the previous row; verification runs server-side). Otherwise remove "cryptographically sealed" and "ACID compliant". The audit tables must be append-only at the database level.

### 4.10 System health (Admin)
- Mode badge in the top bar from the backend: Local simulation or AWS · ap-south-1.
- Every tile shows its data source and last-updated time.
- Queue depth and oldest-message age chart with the alarm threshold line.
- In AWS mode, alarm history comes from CloudWatch alarm history. In local mode, show "No CloudWatch in local mode" and clearly label any simulated series "simulated". Fixes D5.
- Pause/Resume worker controls: admin only, with confirmation, and state shown from the real worker heartbeat.
- Real email addresses come from configuration. No made-up domains.

### 4.11 Evaluation section (/eval)
- Requirements matrix computed, not typed. Each row has a check (script, API call or file test), a status VERIFIED / NOT VERIFIED / NOT APPLICABLE IN LOCAL MODE, the time it was checked, and an evidence link. The "14 / 14" style summary is calculated from the rows.
- Show VPC IDs, ARNs and alarm names only when read from Terraform outputs or AWS APIs.
- Export dossier (PDF and CSV) from the same data.
- Docs viewer renders `docs/*.md` with Mermaid diagrams. Failure-drill and demo script are step-by-step panels with real status.

---

## 5. Truthfulness and data integrity rules
1. **One source of truth.** KPIs are computed by backend endpoints (`/api/v1/analytics/...`). The Briefing, Analytics, Command Center header and Evidence pages call the same endpoints and show the same numbers for the same window.
2. Every number has a definition, a window and an "as of" time. Hover or click reveals the formula and the query basis.
3. The funnel and any status counts follow documented semantics. Add backend tests for them.
4. Seed data is internally consistent: depots differ, counts add up, timestamps are plausible. Seed scripts are deterministic.
5. Replace "LIVE WS" with what is true. If polling: "Auto-refresh every 10 s · updated 12:41:07". Only say live if a WebSocket or SSE connection exists.
6. Remove every claim that is not implemented: "AI", "cryptographically sealed", "ACID compliant", "offline ready", fake alarm history, fake email domains.
7. Mode awareness: any value that exists only in AWS mode is hidden or labelled in local mode.
8. Public pages show only: category, coarse status, locality name, location rounded to about 500 m, time. Never description, reporter details or evidence.
9. All labels, glossary terms and units are consistent (minutes vs min, IST everywhere).

---

## 6. New features (build in this order, stop when time runs out)
1. **Duplicate detection.** When a new report is within about 150 m and the same category within a time window, suggest merging with the existing incident. Operator confirms or splits. Audited.
2. **Decision explainability panel.** Score factors, formula, weights and config version, plus "why not team B".
3. **What-if dispatch preview.** Before committing, show affected stock, team load and straight-line distance for the chosen team vs the top recommendation.
4. **SLA timers and escalation ladder.** Countdown chips; automatic escalation event at thresholds; visible in queue and Briefing.
5. **Shift handover report.** One click generates a PDF of the last shift (open items, decisions, overrides, stock changes), stored in S3 with a presigned link.
6. **Stock run-out forecast (Section 4.6)** with an alert when run-out is under a configurable number of hours.
7. **Incident replay.** Scrub through an incident's events on the map and timeline.
8. **Operator override analytics.** How often operators override recommendations, and the stated reasons.
9. **Public status map (anonymised, Section 5.8).**

Each feature needs a backend endpoint, tests and an entry in the audit log where it changes state.

---

## 7. Accessibility, responsiveness, performance
- WCAG 2.2 AA. Visible focus rings (teal, 2px offset). Full keyboard operation. Skip link. Landmarks. Correct labels and aria-live for toasts and status changes.
- Colour contrast checked for both themes, including severity tints.
- Breakpoints: 390 / 768 / 1024 / 1440. The command centre collapses to queue → map → detail tabs on small screens. No horizontal scroll on the body.
- Budgets (on a production build): initial JS under 250 kB gzip excluding map and 3D chunks; 3D and chart-heavy routes lazy-loaded; long lists virtualised; polling pauses when the tab is hidden.
- Every page has loading (skeleton), empty, error and success states.

---

## 8. Testing and evidence
Add or extend Playwright tests and run them for real:
- Per-role login shows only that role's navigation and rejects forbidden routes.
- Consistency test: Briefing and Analytics report identical values for the same window.
- Funnel test: counts never increase downstream.
- `@axe-core/playwright` on every route in both themes: zero serious or critical violations.
- Keyboard-only walkthrough of report → verify → dispatch.
- i18n test: no missing keys in en / mr / hi for the citizen flow.
- Visual snapshots at 1440 and 390 for key pages.
- Mode test: in local mode no AWS-only values are shown.

Capture before and after screenshots for every route in `docs/evidence/ui/before/` and `docs/evidence/ui/after/`. Report real test output in `docs/ui/TEST_RESULTS.md`. If something fails, say so.

---

## 9. Execution order and definition of done

| Phase | Work | Exit gate |
|---|---|---|
| A | Audit (Section 1). Tokens, fonts, base components. | `AUDIT.md` written; component gallery route renders in both themes |
| B | Role shells and navigation. Mode badge. Remove false claims (D6–D11). | Role test passes |
| C | Command Center (4.2) and detail drawer. | Keyboard flow works; 2D default; 3D lazy |
| D | Data integrity: shared KPI endpoints, funnel fix, consistent seeds (D1–D5). | Consistency test passes |
| E | Remaining pages (4.1, 4.3–4.11). | Each page has all states; axe clean |
| F | New features in Section 6 order. | Each feature tested |
| G | Accessibility, performance, i18n, visual polish pass. | Budgets met or exceptions documented |

A task is done only when: it runs, you have looked at it in the browser at 1440 and 390 px in both themes, its tests pass, and `PROGRESS.md` and `CHANGELOG.md` are updated.

---

## 10. Constraints and reporting
- Add dependencies only when justified. Pre-approved: `@fontsource/*`, `cmdk`, `react-i18next`, `@tanstack/react-virtual`, `@axe-core/playwright`, a small QR library. Everything else needs a line of justification in CHANGELOG.
- Do not commit, push or deploy. Leave changes in the working tree and list suggested commit groupings per area in `PROGRESS.md`.
- Never touch AWS. This spec is frontend and local backend only.
- At the end, produce `docs/ui/CHANGELOG.md` with before/after for each route, the defect table with final status (FIXED / REMOVED / NOT REPRODUCED / DEFERRED with reason), and a short list of known limitations.

