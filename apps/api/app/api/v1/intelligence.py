from fastapi import APIRouter
from app.services.external_intel import external_intelligence_service

router = APIRouter(prefix="/intelligence", tags=["External Disaster Intelligence"])


@router.get("/mumbai-weather")
async def get_mumbai_weather():
    """Retrieve real-time Mumbai meteorological telemetry from Open-Meteo API.

    Clearly labeled as 'LIVE_EXTERNAL_METEOROLOGY' and distinguished from
    internal operational databases and synthetic disaster simulation datasets.
    """
    return await external_intelligence_service.get_mumbai_weather_telemetry()

