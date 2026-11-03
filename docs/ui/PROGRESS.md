# ResQGrid UI Redesign & Product Hardening Progress Tracker

**Document Path:** `docs/ui/PROGRESS.md`  
**Specification:** `docs/UI_REDESIGN_SPEC.md`  
**Audit Report:** `docs/ui/AUDIT.md`  

---

## Phase Status Summary

| Phase | Description | Status | Evidence Path |
|---|---|---|---|
| **Phase A** | Audit (Section 1). Tokens, fonts, base components, component gallery. | **AUDIT DONE** (Waiting for approval before code changes) | `docs/ui/AUDIT.md`<br>`docs/evidence/ui/before/` (84 screenshots) |
| **Phase B** | Role shells and navigation. Mode badge. Remove false claims (D6–D11). | *PENDING APPROVAL* | — |
| **Phase C** | Command Center (4.2) and detail drawer. Keyboard flow, 2D default, lazy 3D. | *PENDING APPROVAL* | — |
| **Phase D** | Data integrity: shared KPI endpoints, funnel fix, consistent seeds (D1–D5). | *PENDING APPROVAL* | — |
| **Phase E** | Remaining pages: Briefing, Citizen, Responder mobile-first, Inventory, Audit, Health. | *PENDING APPROVAL* | — |
| **Phase F** | High-value features: Duplicate detection, explainability, dispatch preview, SLA timers. | *PENDING APPROVAL* | — |
| **Phase G** | Accessibility (WCAG 2.2 AA), performance budgets, i18n, Playwright verification. | *PENDING APPROVAL* | — |

---

## Defect Resolution Tracker

- [x] **D1**: Overview vs Analytics number discrepancy — **CONFIRMED IN AUDIT**
- [x] **D2**: Funnel count growth downstream — **CONFIRMED IN AUDIT**
- [x] **D3**: Resource util 72.5% vs 0 active squads — **CONFIRMED IN AUDIT**
- [x] **D4**: Uniform 82% stock availability across all depots — **CONFIRMED IN AUDIT**
- [x] **D5**: Alarm timeline static timestamps vs live clock — **CONFIRMED IN AUDIT**
- [x] **D6**: Unregistered email domain `emergency-lead@resqgrid.org` — **CONFIRMED IN AUDIT**
- [x] **D7**: Hardcoded 14/14 compliance badge and static VPC CIDR — **CONFIRMED IN AUDIT**
- [x] **D8**: Inaccurate "explainable AI" terminology for rule-based engine — **CONFIRMED IN AUDIT**
- [x] **D9**: Decorative "LIVE WS" badge while app polls — **CONFIRMED IN AUDIT**
- [x] **D10**: Fake "Offline cache ready" badge without IndexedDB queue — **CONFIRMED IN AUDIT**
- [x] **D11**: Unsubstantiated "Cryptographically sealed" claim — **CONFIRMED IN AUDIT**
- [x] **D12**: Single shared navigation mixing portals across roles — **CONFIRMED IN AUDIT**
- [x] **D13**: 13 bloated left-nav items mixing operations and evaluation — **CONFIRMED IN AUDIT**
- [x] **D14**: Terminology drift (squad vs team vs unit) — **CONFIRMED IN AUDIT**

---

## Suggested Commit Groupings (For Phase Execution)
1. `feat(design-system): implement calm control room tokens, IBM Plex typography, and base components`
2. `feat(auth): establish distinct role shells and migrate evaluation routes to /eval`
3. `fix(data-integrity): eliminate false claims (D6-D11) and align terminology`
4. `feat(command): rebuild command center with 3-pane layout, 2D default, and keyboard control`
5. `fix(analytics): unify KPI query contracts and resolve funnel and utilization calculations`
6. `feat(pages): implement shift briefing, mobile responder portal, and dynamic inventory ledger`
7. `feat(features): add duplicate merge, decision explainability, and SLA escalation chips`
8. `test(a11y): verify WCAG 2.2 AA compliance, bundle budgets, and Playwright suites`

