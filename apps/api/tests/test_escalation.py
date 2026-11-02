import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from scripts.seed.seed_data import seed_all


@pytest.mark.asyncio
async def test_independent_incident_escalation_lifecycle():
    """Verify that escalation is independent of incident lifecycle state.

    An incident can be VERIFIED and escalated, ASSIGNED and escalated, and de-escalated.
    """
    await seed_all()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        op_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "operator@resqgrid.org", "password": "Emergency@2026"},
        )
        assert op_login.status_code == 200
        headers = {"Authorization": f"Bearer {op_login.json()['access_token']}"}

        # 1. Fetch incident INC-1042 and verify
        incidents = (await client.get("/api/v1/incidents", headers=headers)).json()
        inc = next(i for i in incidents if i["tracking_id"] == "INC-1042")
        await client.post(f"/api/v1/incidents/{inc['id']}/verify", json={"approved": True}, headers=headers)

        # 2. Escalate incident in VERIFIED state
        esc_res = await client.post(
            f"/api/v1/incidents/{inc['id']}/escalate",
            json={
                "reason": "Water levels surging past 4 feet near Mithi River; immediate life threat.",
                "notes": "Requested NDRF secondary assistance",
            },
            headers=headers,
        )
        assert esc_res.status_code == 200
        esc_data = esc_res.json()
        assert esc_data["is_escalated"] is True
        assert "Water levels surging" in esc_data["escalation_reason"]
        assert esc_data["escalated_at"] is not None
        assert esc_data["status"] == "VERIFIED"  # Status remains VERIFIED!

        # 3. Attempting to escalate an already escalated incident returns 400
        dup_esc = await client.post(
            f"/api/v1/incidents/{inc['id']}/escalate",
            json={"reason": "Duplicate escalation attempt"},
            headers=headers,
        )
        assert dup_esc.status_code == 400
        assert "already marked as escalated" in dup_esc.json()["detail"]

        # 4. De-escalate incident
        de_esc_res = await client.post(
            f"/api/v1/incidents/{inc['id']}/de-escalate",
            json={"notes": "Floodwaters stabilized. Evacuation under control."},
            headers=headers,
        )
        assert de_esc_res.status_code == 200
        de_esc_data = de_esc_res.json()
        assert de_esc_data["is_escalated"] is False
        assert de_esc_data["escalation_resolved_at"] is not None
