import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.core.database import AsyncSessionLocal, Base, engine
from app.main import app
from scripts.seed.seed_data import seed_all


@pytest_asyncio.fixture(scope="module", autouse=True)
async def setup_test_db():
    """Ensure database schema and initial seed data are populated."""
    await seed_all()
    yield
    # Cleanup


@pytest.mark.asyncio
async def test_full_incident_lifecycle_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        health_res = await client.get("/api/v1/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

        # 2. Login as Citizen
        citizen_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "citizen@resqgrid.org", "password": "Emergency@2026"},
        )
        assert citizen_login.status_code == 200
        citizen_token = citizen_login.json()["access_token"]
        citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

        # 3. Citizen submits new emergency report
        incident_payload = {
            "title": "Severe Waterlogging on S.V. Road Bandra",
            "description": "Rising water level over 3 feet. 8 people trapped inside stranded passenger bus.",
            "category": "FLOOD",
            "severity": "CRITICAL",
            "affected_people": 8,
            "latitude": 19.0596,
            "longitude": 72.8402,
            "address": "S.V. Road near Bandra Post Office, Mumbai",
            "reporter_phone": "+91 98200 11223",
            "is_simulated": True,
        }
        create_res = await client.post(
            "/api/v1/incidents",
            json=incident_payload,
            headers=citizen_headers,
        )
        assert create_res.status_code == 201
        created_incident = create_res.json()
        incident_id = created_incident["id"]
        tracking_id = created_incident["tracking_id"]
        assert created_incident["status"] == "REPORTED"
        assert created_incident["priority_score"] >= 65.0

        # 4. Public Tracking lookup
        track_res = await client.get(f"/api/v1/incidents/tracking/{tracking_id}")
        assert track_res.status_code == 200
        assert track_res.json()["id"] == incident_id

        # 5. Login as Command Center Operator
        op_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "operator@resqgrid.org", "password": "Emergency@2026"},
        )
        assert op_login.status_code == 200
        op_token = op_login.json()["access_token"]
        op_headers = {"Authorization": f"Bearer {op_token}"}

        # 6. Operator verifies and triages the incident
        verify_res = await client.post(
            f"/api/v1/incidents/{incident_id}/verify",
            json={"approved": True, "severity_override": "CRITICAL"},
            headers=op_headers,
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["status"] == "VERIFIED"

        # 7. Operator retrieves team recommendations
        recs_res = await client.get(
            f"/api/v1/incidents/{incident_id}/recommendations",
            headers=op_headers,
        )
        assert recs_res.status_code == 200
        recommendations = recs_res.json()
        assert len(recommendations) > 0
        recommended_team = recommendations[0]["team"]
        team_id = recommended_team["id"]

        # 8. Operator fetches inventory to reserve supplies
        stocks_res = await client.get("/api/v1/inventory/stocks", headers=op_headers)
        assert stocks_res.status_code == 200
        stocks = stocks_res.json()
        assert len(stocks) > 0
        test_stock = stocks[0]
        initial_available = test_stock["quantity_available"]

        # 9. Operator dispatches team and reserves 5 units of relief supplies
        assign_payload = {
            "incident_id": incident_id,
            "team_id": team_id,
            "operator_notes": "Immediate swiftwater deployment authorized.",
            "requested_supplies": [
                {
                    "item_id": test_stock["item_id"],
                    "depot_id": test_stock["depot_id"],
                    "quantity": 5,
                }
            ],
        }
        assign_res = await client.post(
            f"/api/v1/incidents/{incident_id}/assign",
            json=assign_payload,
            headers=op_headers,
        )
        assert assign_res.status_code == 200
        assignment = assign_res.json()
        assignment_id = assignment["id"]
        assert assignment["status"] in ["OFFERED", "PENDING"]

        # 10. Login as Field Responder (Vikram Patil)
        resp_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "responder@resqgrid.org", "password": "Emergency@2026"},
        )
        assert resp_login.status_code == 200
        resp_token = resp_login.json()["access_token"]
        resp_headers = {"Authorization": f"Bearer {resp_token}"}

        # 11. Responder updates assignment to ACCEPTED -> EN_ROUTE -> ON_SCENE -> COMPLETED
        for next_status in ["ACCEPTED", "EN_ROUTE", "ON_SCENE"]:
            up_res = await client.patch(
                f"/api/v1/assignments/{assignment_id}/status",
                json={"status": next_status, "responder_notes": f"Moving to {next_status}"},
                headers=resp_headers,
            )
            assert up_res.status_code == 200

        # Complete mission with consumed supplies
        complete_res = await client.patch(
            f"/api/v1/assignments/{assignment_id}/status",
            json={
                "status": "COMPLETED",
                "responder_notes": "All 8 citizens rescued safely. 4 lifejackets deployed.",
                "consumed_supplies": [
                    {
                        "item_id": test_stock["item_id"],
                        "depot_id": test_stock["depot_id"],
                        "quantity": 4,
                    }
                ],
            },
            headers=resp_headers,
        )
        assert complete_res.status_code == 200
        assert complete_res.json()["status"] == "COMPLETED"

        # 12. Verify incident is RESOLVED
        final_inc_res = await client.get(f"/api/v1/incidents/{incident_id}")
        assert final_inc_res.status_code == 200
        assert final_inc_res.json()["status"] == "RESOLVED"

        # 13. Verify operational analytics reflects updated state
        analytics_res = await client.get("/api/v1/analytics", headers=op_headers)
        assert analytics_res.status_code == 200
        kpis = analytics_res.json()["kpis"]
        assert kpis["total_incidents"] > 0
        assert kpis["resolved_incidents"] > 0
