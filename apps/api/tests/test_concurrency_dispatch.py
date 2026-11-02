import asyncio
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from scripts.seed.seed_data import seed_all


@pytest.mark.asyncio
async def test_concurrent_dispatch_capacity_limit():
    """Concurrency integration test:

    20 concurrent dispatch attempts against a single response team with max_concurrent_assignments=1.
    Strictly verifies that exactly 1 request succeeds (200 OK) and the remaining 19 fail (409 Conflict),
    preventing any over-dispatch race conditions.
    """
    await seed_all()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Operator login
        op_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "operator@resqgrid.org", "password": "Emergency@2026"},
        )
        assert op_login.status_code == 200
        headers = {"Authorization": f"Bearer {op_login.json()['access_token']}"}

        # Fetch incident INC-1042 and verify it
        incidents = (await client.get("/api/v1/incidents", headers=headers)).json()
        inc = next(i for i in incidents if i["tracking_id"] == "INC-1042")
        await client.post(f"/api/v1/incidents/{inc['id']}/verify", json={"approved": True}, headers=headers)

        # Fetch team
        teams = (await client.get("/api/v1/teams", headers=headers)).json()
        target_team = next(t for t in teams if t["status"] == "AVAILABLE")

        dispatch_payload = {
            "incident_id": inc["id"],
            "team_id": target_team["id"],
            "operator_notes": "Stress-test concurrent dispatch batch",
            "override_reason": "Testing concurrent dispatch saturation under load",
        }

        # Launch 20 concurrent dispatch tasks
        async def attempt_dispatch():
            return await client.post(
                f"/api/v1/incidents/{inc['id']}/assign",
                json=dispatch_payload,
                headers=headers,
            )

        tasks = [attempt_dispatch() for _ in range(20)]
        responses = await asyncio.gather(*tasks)

        status_codes = [r.status_code for r in responses]
        successes = status_codes.count(200)
        conflicts = status_codes.count(409)

        # Exactly 1 dispatch must succeed; all others must be rejected with 409
        assert successes == 1, f"Expected exactly 1 success, got {successes}. Status codes: {status_codes}"
        assert conflicts == 19, f"Expected 19 conflicts, got {conflicts}"


@pytest.mark.asyncio
async def test_optimistic_concurrency_version_conflict():
    """Verify that attempting to assign an incident with a stale expected_version returns 409 Conflict."""
    await seed_all()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        op_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "operator@resqgrid.org", "password": "Emergency@2026"},
        )
        headers = {"Authorization": f"Bearer {op_login.json()['access_token']}"}

        incidents = (await client.get("/api/v1/incidents", headers=headers)).json()
        inc = next(i for i in incidents if i["tracking_id"] == "INC-2041")
        await client.post(f"/api/v1/incidents/{inc['id']}/verify", json={"approved": True}, headers=headers)

        teams = (await client.get("/api/v1/teams", headers=headers)).json()
        target_team = next(t for t in teams if t["status"] == "AVAILABLE")

        # Intentionally pass an incorrect/stale version (e.g. 999)
        stale_payload = {
            "incident_id": inc["id"],
            "team_id": target_team["id"],
            "operator_notes": "Optimistic concurrency test",
            "override_reason": "Testing stale expected version",
            "expected_version": 999,
        }

        res = await client.post(
            f"/api/v1/incidents/{inc['id']}/assign",
            json=stale_payload,
            headers=headers,
        )
        assert res.status_code == 409
        assert "Stale incident record" in res.json()["detail"]
