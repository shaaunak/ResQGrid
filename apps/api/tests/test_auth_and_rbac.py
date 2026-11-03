import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.enums import UserRole
from scripts.seed.seed_data import seed_all


@pytest.mark.asyncio
async def test_unauthenticated_requests_denied():
    """Verify that unauthenticated calls to privileged routes are strictly rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Analytics query without token -> 401
        res_analytics = await client.get("/api/v1/analytics")
        assert res_analytics.status_code == 401

        # 2. Worker control without token -> 401
        res_worker = await client.post("/api/v1/admin/worker/pause")
        assert res_worker.status_code == 401

        # 3. Dispatch assignment without token -> 401
        res_assign = await client.post("/api/v1/incidents/some-id/assign", json={"team_id": "dummy"})
        assert res_assign.status_code == 401

        # 4. Inventory intake without token -> 401
        res_inv = await client.post(
            "/api/v1/inventory/intake",
            json={"depot_id": "dummy", "item_id": "dummy", "quantity": 10}
        )
        assert res_inv.status_code == 401

        # 5. Incident verify without token -> 401
        res_verify = await client.post("/api/v1/incidents/some-id/verify", json={"approved": True})
        assert res_verify.status_code == 401


@pytest.mark.asyncio
async def test_role_authorization_forbidden():
    """Verify that authenticated users with unauthorized roles receive 403 Forbidden."""
    await seed_all()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as Citizen
        citizen_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "citizen@resqgrid.org", "password": "Emergency@2026"}
        )
        assert citizen_login.status_code == 200
        citizen_token = citizen_login.json()["access_token"]
        citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

        # Citizen attempts to pause worker -> 403
        res_worker = await client.post("/api/v1/admin/worker/pause", headers=citizen_headers)
        assert res_worker.status_code == 403

        # Citizen attempts to view operator recommendations -> 403
        res_rec = await client.get("/api/v1/incidents/some-id/recommendations", headers=citizen_headers)
        assert res_rec.status_code == 403

        # Citizen attempts to assign dispatch -> 403
        res_assign = await client.post("/api/v1/incidents/some-id/assign", json={"team_id": "dummy"}, headers=citizen_headers)
        assert res_assign.status_code == 403

        # Login as Responder
        responder_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "responder@resqgrid.org", "password": "Emergency@2026"}
        )
        assert responder_login.status_code == 200
        resp_token = responder_login.json()["access_token"]
        resp_headers = {"Authorization": f"Bearer {resp_token}"}

        # Responder attempts to reseed database -> 403
        res_seed = await client.post("/api/v1/admin/seed", headers=resp_headers)
        assert res_seed.status_code == 403


@pytest.mark.asyncio
async def test_authenticated_operator_authorized():
    """Verify that operator has access to privileged dispatch and triage endpoints."""
    await seed_all()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        op_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "operator@resqgrid.org", "password": "Emergency@2026"}
        )
        assert op_login.status_code == 200
        op_token = op_login.json()["access_token"]
        op_headers = {"Authorization": f"Bearer {op_token}"}

        # Operator can access analytics
        res_analytics = await client.get("/api/v1/analytics", headers=op_headers)
        assert res_analytics.status_code == 200

        # Operator can inspect worker status
        res_worker = await client.get("/api/v1/admin/worker/status", headers=op_headers)
        assert res_worker.status_code == 200
