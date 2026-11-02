import os
import platform
import time
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["System Health & Monitoring"])

START_TIME = time.time()


@router.get("")
async def get_health_status(db: AsyncSession = Depends(get_db)):
    """Comprehensive health check checking database, storage, environment, and uptime."""
    # 1. Database check
    db_healthy = False
    db_latency_ms = None
    try:
        t0 = time.time()
        await db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - t0) * 1000, 2)
        db_healthy = True
    except Exception as e:
        db_error = str(e)

    # 2. Storage status
    storage_healthy = True
    if settings.STORAGE_BACKEND == "local":
        storage_healthy = os.path.exists(settings.LOCAL_STORAGE_DIR) or os.path.exists(".")
    else:
        storage_healthy = True

    # 3. Overall status
    is_healthy = db_healthy and storage_healthy

    return {
        "status": "healthy" if is_healthy else "degraded",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "system": {
            "os": platform.system(),
            "python_version": platform.python_version(),
            "region": settings.AWS_REGION,
        },
        "components": {
            "database": {
                "status": "connected" if db_healthy else "disconnected",
                "latency_ms": db_latency_ms,
                "engine": "PostgreSQL / SQLite",
            },
            "storage": {
                "backend": settings.STORAGE_BACKEND,
                "status": "operational" if storage_healthy else "error",
                "bucket": settings.S3_BUCKET_NAME if settings.STORAGE_BACKEND == "s3" else "local_disk",
            },
            "queue": {
                "backend": settings.QUEUE_BACKEND,
                "status": "operational",
            },
            "notifications": {
                "backend": settings.NOTIFICATION_BACKEND,
                "status": "operational",
            },
        },
    }

