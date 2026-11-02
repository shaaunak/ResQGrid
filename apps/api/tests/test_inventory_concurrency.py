import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from scripts.seed.seed_data import seed_all


@pytest.mark.asyncio
async def test_inventory_atomic_reservation_and_deficit_protection():
    """Verify that inventory reservations cannot drive available quantity negative."""
    await seed_all()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as operator
        op_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "operator@resqgrid.org", "password": "Emergency@2026"},
        )
        op_token = op_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {op_token}"}

        # Fetch first incident and stock
        incidents = (await client.get("/api/v1/incidents", headers=headers)).json()
        incident = next(i for i in incidents if i["tracking_id"] == "INC-1042")
        teams = (await client.get("/api/v1/teams", headers=headers)).json()
        team = teams[0]
        stocks = (await client.get("/api/v1/inventory/stocks", headers=headers)).json()
        stock = stocks[0]

        # First verify incident
        await client.post(f"/api/v1/incidents/{incident['id']}/verify", json={"approved": True}, headers=headers)

        # Attempt to request an exorbitant quantity exceeding depot stock (e.g. 99,999 units)
        over_request_payload = {
            "incident_id": incident["id"],
            "team_id": team["id"],
            "operator_notes": "Attempting invalid allocation exceeding depot capacity",
            "override_reason": "Authorized team test override for inventory boundaries",
            "requested_supplies": [
                {
                    "item_id": stock["item_id"],
                    "depot_id": stock["depot_id"],
                    "quantity": 99999,
                }
            ],
        }

        res = await client.post(
            f"/api/v1/incidents/{incident['id']}/assign",
            json=over_request_payload,
            headers=headers,
        )
        # Must fail safely with HTTP 409 Conflict
        assert res.status_code == 409
        assert "Insufficient inventory" in res.json()["detail"]


@pytest.mark.asyncio
async def test_rbac_boundary_enforcement():
    """Verify that unauthorized roles cannot execute restricted operations."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Citizen token
        c_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "citizen@resqgrid.org", "password": "Emergency@2026"},
        )
        c_token = c_login.json()["access_token"]
        c_headers = {"Authorization": f"Bearer {c_token}"}

        # Citizen attempts to verify an incident -> HTTP 403 Forbidden
        verify_attempt = await client.post(
            "/api/v1/incidents/some-incident-id/verify",
            json={"approved": True},
            headers=c_headers,
        )
        assert verify_attempt.status_code == 403

        # Citizen attempts to pause worker -> HTTP 403 Forbidden
        pause_attempt = await client.post(
            "/api/v1/admin/worker/pause",
            headers=c_headers,
        )
        assert pause_attempt.status_code == 403

