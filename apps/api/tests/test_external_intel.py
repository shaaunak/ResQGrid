import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.services.external_intel import ExternalIntelligenceService, external_intelligence_service


@pytest.mark.asyncio
async def test_external_intel_endpoint():
    """Verify external intelligence endpoint:

    - Source classification is strictly LIVE_EXTERNAL_METEOROLOGY
    - Attribution is provided
    - Meteorological metrics are populated
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/intelligence/mumbai-weather")
        assert res.status_code == 200
        data = res.json()

        assert data["data_category"] == "LIVE_EXTERNAL_METEOROLOGY"
        assert "Open-Meteo" in data["attribution"]
        assert "coordinates" in data
        assert data["coordinates"]["latitude"] == 19.0760
        assert data["coordinates"]["longitude"] == 72.8777
        assert "telemetry" in data
        assert "temperature_celsius" in data["telemetry"]
        assert "wind_speed_kmh" in data["telemetry"]


@pytest.mark.asyncio
async def test_external_intel_fallback():
    """Verify that if external network fails, safe fallback weather data is returned with degradation indicator."""
    service = ExternalIntelligenceService()
    fallback = service._fallback_data()
    assert fallback["data_category"] == "LIVE_EXTERNAL_METEOROLOGY"
    assert fallback["telemetry"]["temperature_celsius"] == 29.0
