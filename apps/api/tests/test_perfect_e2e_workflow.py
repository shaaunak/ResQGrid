import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.enums import IncidentStatus, AssignmentStatus
from scripts.seed.seed_data import seed_all


@pytest.mark.asyncio
async def test_perfect_end_to_end_disaster_workflow():
    """Phase 3 Verification: ONE Perfect End-to-End Workflow with real DB and real APIs:
    
    1. Citizen submits emergency report with location & affected people.
    2. Duplicate report within 150m and 20min merges into parent incident.
    3. Operator verifies incident, re-computing priority score (Urgency 35%, Impact 25%, Wait 20%, Vuln 20%).
    4. Operator reviews candidate response squads ranked by capability, distance, and ETA.
    5. Operator dispatches selected team: ONE atomic transaction creates assignment,
       reserves inventory with row-level locks, writes audit events, and stages outbox event.
    6. Responder accepts mission, marks EN_ROUTE, marks ON_SCENE, and marks COMPLETED.
    7. Incident and assignment reflect COMPLETED/RESOLVED with full event timeline.
    """
    await seed_all()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # ---------------------------------------------------------
        # Step 1: Citizen Emergency Submission
        # ---------------------------------------------------------
        citizen_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "citizen@resqgrid.org", "password": "Emergency@2026"}
        )
        assert citizen_login.status_code == 200
        citizen_token = citizen_login.json()["access_token"]
        citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

        report_payload = {
            "title": "Severe Flash Flood Stranding Citizens Near Hindmata",
            "description": "Rapid water surge 1.3m high, 12 citizens trapped inside flooded residential ground floor.",
            "category": "FLOOD",
            "severity": "CRITICAL",
            "latitude": 19.0110,
            "longitude": 72.8435,
            "address": "Hindmata Cinema Junction, Dadar East, Mumbai",
            "affected_people": 12,
        }
        res_report = await client.post("/api/v1/incidents", json=report_payload, headers=citizen_headers)
        assert res_report.status_code == 201
        inc_data = res_report.json()
        inc_id = inc_data["id"]
        tracking_id = inc_data["tracking_id"]
        assert inc_data["status"] == IncidentStatus.REPORTED.value
        assert inc_data["report_count"] == 1
        assert inc_data["priority_score"] > 0

        # ---------------------------------------------------------
        # Step 2: Corroborating Report Merged (within 150m and 20min)
        # ---------------------------------------------------------
        corrob_payload = {
            "title": "Hindmata flood level rising rapidly",
            "description": "Water reached 1.4m depth, assistance urgently needed.",
            "category": "FLOOD",
            "severity": "CRITICAL",
            "latitude": 19.0112,  # ~25 meters away
            "longitude": 72.8436,
            "address": "Hindmata Junction Road, Dadar East",
            "affected_people": 12,
        }
        res_corrob = await client.post("/api/v1/incidents", json=corrob_payload, headers=citizen_headers)
        assert res_corrob.status_code == 201
        corrob_data = res_corrob.json()
        # Must link to the parent incident and increment report_count to 2
        assert corrob_data["id"] == inc_id
        assert corrob_data["report_count"] == 2

        # ---------------------------------------------------------
        # Step 3: Operator Verification & Dynamic Priority Score
        # ---------------------------------------------------------
        op_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "operator@resqgrid.org", "password": "Emergency@2026"}
        )
        assert op_login.status_code == 200
        op_token = op_login.json()["access_token"]
        op_headers = {"Authorization": f"Bearer {op_token}"}

        verify_res = await client.post(
            f"/api/v1/incidents/{inc_id}/verify",
            json={"approved": True, "severity_override": "CRITICAL"},
            headers=op_headers
        )
        assert verify_res.status_code == 200
        verified_inc = verify_res.json()
        assert verified_inc["status"] == IncidentStatus.VERIFIED.value
        assert verified_inc["priority_breakdown"] is not None
        assert "severity_factor" in verified_inc["priority_breakdown"]
        assert "impact_factor" in verified_inc["priority_breakdown"]
        assert "wait_time_factor" in verified_inc["priority_breakdown"]
        assert "vulnerability_factor" in verified_inc["priority_breakdown"]

        # ---------------------------------------------------------
        # Step 4: Candidate Team Matching & Plain-Language Reason
        # ---------------------------------------------------------
        rec_res = await client.get(f"/api/v1/incidents/{inc_id}/recommendations", headers=op_headers)
        assert rec_res.status_code == 200
        recommendations = rec_res.json()
        assert len(recommendations) >= 1
        best_team = recommendations[0]
        assert best_team["is_eligible"] is True
        assert best_team["distance_km"] >= 0
        assert len(best_team["reasons"]) >= 1
        team_id = best_team["team"]["id"]

        # ---------------------------------------------------------
        # Step 5: Atomic Dispatch Transaction (Assignment + Supply Reservation)
        # ---------------------------------------------------------
        assign_payload = {
            "incident_id": inc_id,
            "team_id": team_id,
            "operator_notes": "Emergency dispatch approved by Command Operator for Hindmata flood zone.",
            "requested_supplies": []
        }
        assign_res = await client.post(
            f"/api/v1/incidents/{inc_id}/assign",
            json=assign_payload,
            headers=op_headers
        )
        assert assign_res.status_code == 200
        asg_data = assign_res.json()
        asg_id = asg_data["id"]
        assert asg_data["status"] == AssignmentStatus.OFFERED.value
        assert asg_data["stock_reservations"] is not None

        # Verify incident status advanced to ASSIGNED
        inc_check = (await client.get(f"/api/v1/incidents/{inc_id}", headers=op_headers)).json()
        assert inc_check["status"] == IncidentStatus.ASSIGNED.value

        # ---------------------------------------------------------
        # Step 6: Field Responder Lifecycle Progression
        # ---------------------------------------------------------
        resp_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "responder@resqgrid.org", "password": "Emergency@2026"}
        )
        assert resp_login.status_code == 200
        resp_token = resp_login.json()["access_token"]
        resp_headers = {"Authorization": f"Bearer {resp_token}"}

        # 6a. Accept Mission
        accept_res = await client.patch(
            f"/api/v1/assignments/{asg_id}/status",
            json={"status": "ACCEPTED", "responder_notes": "Captain accepted mission. Mobilizing boat team."},
            headers=resp_headers
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == AssignmentStatus.ACCEPTED.value

        # 6b. En Route
        en_route_res = await client.patch(
            f"/api/v1/assignments/{asg_id}/status",
            json={"status": "EN_ROUTE", "responder_notes": "Vehicle en route along Dr. Ambedkar Road."},
            headers=resp_headers
        )
        assert en_route_res.status_code == 200
        assert en_route_res.json()["status"] == AssignmentStatus.EN_ROUTE.value

        # 6c. On Scene
        on_scene_res = await client.patch(
            f"/api/v1/assignments/{asg_id}/status",
            json={"status": "ON_SCENE", "responder_notes": "On scene at Hindmata. Deploying inflatable rescue raft."},
            headers=resp_headers
        )
        assert on_scene_res.status_code == 200
        assert on_scene_res.json()["status"] == AssignmentStatus.ON_SCENE.value

        # 6d. Complete Mission
        complete_res = await client.patch(
            f"/api/v1/assignments/{asg_id}/status",
            json={"status": "COMPLETED", "responder_notes": "All 12 citizens evacuated safely to Dadar Relief Shelter."},
            headers=resp_headers
        )
        assert complete_res.status_code == 200
        assert complete_res.json()["status"] == AssignmentStatus.COMPLETED.value

        # ---------------------------------------------------------
        # Step 7: Incident Tracking & Audit Parity Check
        # ---------------------------------------------------------
        track_res = await client.get(f"/api/v1/incidents/tracking/{tracking_id}")
        assert track_res.status_code == 200
        track_data = track_res.json()
        assert track_data["status"] == IncidentStatus.RESOLVED.value
        assert len(track_data["events"]) >= 5
