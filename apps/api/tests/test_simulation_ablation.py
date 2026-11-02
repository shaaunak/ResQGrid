import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from scripts.seed.seed_data import seed_all


@pytest.mark.asyncio
async def test_scenario_commander_ablation_strategies():
    """Verify that Scenario Commander executes all 4 ablation strategies correctly:

    - FIFO (baseline)
    - PRIORITY_ONLY
    - MATCHING_ONLY
    - FULL_INTELLIGENT (risk_aware_algorithm)
    Each strategy must produce explainable operational metrics.
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

        sim_payload = {
            "scenario_name": "Mumbai Urban Flood",
            "incident_count": 15,
            "team_count": 5,
            "run_monte_carlo": True,
            "monte_carlo_seeds_count": 10,
        }

        res = await client.post("/api/v1/simulations/compare", json=sim_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()

        # Check primary output
        assert data["scenario_name"] == "Mumbai Urban Flood"
        assert "baseline_fifo" in data
        assert "priority_only" in data
        assert "matching_only" in data
        assert "risk_aware_algorithm" in data

        fifo = data["baseline_fifo"]
        assert "avg_wait_time_seconds" in fifo
        assert "critical_wait_time_seconds" in fifo
        assert "resource_utilization_pct" in fifo

        full = data["risk_aware_algorithm"]
        assert "avg_wait_time_seconds" in full
        assert "critical_wait_time_seconds" in full

        # Check 4-way ablation dictionary
        assert "ablation_study" in data
        ablation = data["ablation_study"]
        assert "A_BASELINE_FIFO" in ablation
        assert "B_PRIORITY_ONLY" in ablation
        assert "C_MATCHING_ONLY" in ablation
        assert "D_FULL_INTELLIGENT" in ablation

        # Check Monte Carlo statistical confidence intervals
        assert "monte_carlo_summary" in data
        mc = data["monte_carlo_summary"]
        assert mc["seeds_evaluated"] == 10
        assert "baseline_fifo_critical_wait_mean_minutes" in mc
        assert "full_intelligent_critical_wait_mean_minutes" in mc
        assert "mean_critical_reduction_pct" in mc
        assert "statistical_significance" in mc
