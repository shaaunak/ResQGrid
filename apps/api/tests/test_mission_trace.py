import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token


@pytest.fixture
def operator_token():
    return create_access_token(subject="7c0a4fdf-806a-49ee-9e82-47bcaf505953", role="OPERATOR")


@pytest.fixture
def citizen_token():
    return create_access_token(subject="4a40a6b3-c89f-45bb-9536-e93e16571de4", role="CITIZEN")


@pytest.fixture
def responder_token():
    return create_access_token(subject="f49a6a25-ff80-44ce-97ad-a8dabcc981c8", role="RESPONDER")


@pytest.mark.asyncio
async def test_mission_trace_auth_and_rbac(operator_token, citizen_token, responder_token):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create an incident to trace
        create_res = await client.post(
            "/api/v1/incidents",
            json={
                "title": "Kurla West Station Flooding Test",
                "description": "Severe platform flooding trapping 10 commuters.",
                "category": "FLOOD",
                "severity": "CRITICAL",
                "affected_people": 10,
                "latitude": 19.0657,
                "longitude": 72.8794,
                "address": "Kurla West Station Road",
            },
        )
        assert create_res.status_code == 201
        tracking_id = create_res.json()["tracking_id"]
        inc_id = create_res.json()["id"]

        # 1. Unauthenticated request -> 401
        res = await client.get(f"/api/v1/incidents/{tracking_id}/trace")
        assert res.status_code == 401

        # 2. Citizen role request -> 403 (Citizen cannot view privileged tactical trace)
        res = await client.get(
            f"/api/v1/incidents/{tracking_id}/trace",
            headers={"Authorization": f"Bearer {citizen_token}"}
        )
        assert res.status_code == 403

        # 3. Unknown incident -> 404
        res = await client.get(
            "/api/v1/incidents/INC-NONEXISTENT/trace",
            headers={"Authorization": f"Bearer {operator_token}"}
        )
        assert res.status_code == 404

        # 4. Authorized Operator -> 200
        res = await client.get(
            f"/api/v1/incidents/{tracking_id}/trace",
            headers={"Authorization": f"Bearer {operator_token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["incident"]["tracking_id"] == tracking_id
        assert data["incident"]["incident_id"] == inc_id


@pytest.mark.asyncio
async def test_mission_trace_forensic_integrity(operator_token):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create primary incident
        create_res = await client.post(
            "/api/v1/incidents",
            json={
                "title": "Hindmata Flyover Structural Distress",
                "description": "Water logging rising fast, 15 citizens on bus roof.",
                "category": "FLOOD",
                "severity": "CRITICAL",
                "affected_people": 15,
                "latitude": 19.0180,
                "longitude": 72.8430,
                "address": "Hindmata Flyover Junction, Dadar",
            },
        )
        assert create_res.status_code == 201
        primary = create_res.json()
        tracking_id = primary["tracking_id"]
        inc_id = primary["id"]

        # 2. Submit duplicate report within 25m to trigger spatial merge
        dup_res = await client.post(
            "/api/v1/incidents",
            json={
                "title": "Hindmata Flyover Water Level 4ft",
                "description": "Corroborating citizen report of rising water.",
                "category": "FLOOD",
                "severity": "CRITICAL",
                "affected_people": 5,
                "latitude": 19.0181,
                "longitude": 72.8431,
                "address": "Hindmata Junction East",
            },
        )
        assert dup_res.status_code == 201

        # 3. Operator verifies incident
        v_res = await client.post(
            f"/api/v1/incidents/{inc_id}/verify",
            headers={"Authorization": f"Bearer {operator_token}"},
            json={"approved": True, "severity_override": "CRITICAL"},
        )
        assert v_res.status_code == 200

        # 4. Get team recommendations
        rec_res = await client.get(
            f"/api/v1/incidents/{inc_id}/recommendations",
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        assert rec_res.status_code == 200
        recommendations = rec_res.json()
        assert len(recommendations) >= 1
        top_team = recommendations[0]["team"]

        # 5. Fetch depot items for inventory reservation
        depots_res = await client.get("/api/v1/inventory/depots")
        depot_id = depots_res.json()[0]["id"]
        items_res = await client.get("/api/v1/inventory/items")
        item_id = items_res.json()[0]["id"]

        # Dispatch team with atomic supply reservation
        dispatch_res = await client.post(
            f"/api/v1/incidents/{inc_id}/assign",
            headers={"Authorization": f"Bearer {operator_token}"},
            json={
                "incident_id": inc_id,
                "team_id": top_team["id"],
                "operator_notes": "Urgent life rescue mission.",
                "requested_supplies": [
                    {"item_id": item_id, "depot_id": depot_id, "quantity": 2}
                ]
            },
        )
        assert dispatch_res.status_code == 200
        asg_id = dispatch_res.json()["id"]

        # 6. Responder progresses assignment: ACCEPTED -> EN_ROUTE -> ON_SCENE -> COMPLETED
        resp_headers = {"Authorization": f"Bearer {operator_token}"}
        await client.patch(
            f"/api/v1/assignments/{asg_id}/status",
            headers=resp_headers,
            json={"status": "ACCEPTED", "responder_notes": "Unit responding."},
        )
        await client.patch(
            f"/api/v1/assignments/{asg_id}/status",
            headers=resp_headers,
            json={"status": "EN_ROUTE", "responder_notes": "Navigating flooded corridors."},
        )
        await client.patch(
            f"/api/v1/assignments/{asg_id}/status",
            headers=resp_headers,
            json={"status": "ON_SCENE", "responder_notes": "Commencing extraction."},
        )
        await client.patch(
            f"/api/v1/assignments/{asg_id}/status",
            headers=resp_headers,
            json={
                "status": "COMPLETED",
                "responder_notes": "All victims extracted safely to dry ground.",
                "consumed_supplies": [
                    {"item_id": item_id, "depot_id": depot_id, "quantity": 2}
                ]
            },
        )

        # 7. Query Mission Trace endpoint
        trace_res = await client.get(
            f"/api/v1/incidents/{tracking_id}/trace",
            headers={"Authorization": f"Bearer {operator_token}"}
        )
        assert trace_res.status_code == 200
        trace_data = trace_res.json()

        # Section A: Origin verification
        incident = trace_data["incident"]
        assert incident["tracking_id"] == tracking_id
        assert incident["category"] == "FLOOD"
        assert incident["report_count"] == 2
        assert len(incident["merged_reports"]) == 1

        # Section B: Explainable Priority
        prio = trace_data["priority"]
        assert prio["severity_factor"] == 100.0
        assert prio["impact_factor"] > 0
        assert prio["total_score"] >= 65.0
        assert "Severity 'CRITICAL'" in prio["explanation"]

        # Section C: Team Selection & Snapshots
        asgs = trace_data["assignments"]
        assert len(asgs) == 1
        asg = asgs[0]
        assert asg["team_id"] == top_team["id"]
        assert asg["status"] == "COMPLETED"
        assert len(asg["candidate_snapshots"]) >= 1

        # Section D: Inventory Reservations
        invs = trace_data["inventory_reservations"]
        assert len(invs) == 1
        assert invs[0]["quantity_reserved"] == 2
        assert invs[0]["quantity_consumed"] == 2
        assert invs[0]["status"] == "CONSUMED"

        # Section E: Cloud Outbox Events
        outbox = trace_data["cloud_outbox_events"]
        assert len(outbox) >= 4
        ev_types = [o["event_type"] for o in outbox]
        assert "INCIDENT_REPORTED" in ev_types
        assert "INCIDENT_VERIFIED" in ev_types
        assert "ASSIGNMENT_DISPATCHED" in ev_types
        for o in outbox:
            assert o["correlation_id"] is not None
            assert o["cloud_delivery_status"] is not None

        # Section F: Chronological Timeline Events
        timeline = trace_data["timeline"]
        assert len(timeline) >= 8
        for i in range(len(timeline) - 1):
            assert timeline[i]["timestamp"] <= timeline[i + 1]["timestamp"]

        # 8. Export Forensic Report
        exp_res = await client.get(
            f"/api/v1/incidents/{tracking_id}/trace/export",
            headers={"Authorization": f"Bearer {operator_token}"}
        )
        assert exp_res.status_code == 200
        report_text = exp_res.text
        assert f"MISSION TRACE & FORENSIC AUDIT DOSSIER — {tracking_id}" in report_text
        assert "SECTION A: INCIDENT ORIGIN" in report_text
        assert "SECTION B: EXPLAINABLE PRIORITY ENGINE" in report_text
        assert "SECTION C: TACTICAL SQUAD DISPATCH" in report_text
        assert "SECTION D: INVENTORY ALLOCATION & RESERVATIONS" in report_text
        assert "SECTION E: CLOUD EVENT PROCESSING & OUTBOX" in report_text
        assert "SECTION F: MISSION LIFECYCLE TIMELINE" in report_text

