from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_roles
from app.core.database import get_db
from app.models.enums import OutboxStatus, UserRole
from app.models.outbox import OutboxEvent
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Administration & Worker Control"])

# In-memory worker control state (shared via process or API)
WORKER_STATE = {
    "paused": False,
}


@router.post("/worker/pause")
async def pause_worker(_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR]))):
    """Simulate background worker downtime for failure injection and CloudWatch alarm testing."""
    WORKER_STATE["paused"] = True
    return {
        "status": "success",
        "worker_paused": True,
        "message": "Worker paused. Messages will accumulate in the queue to trigger CloudWatch alarm demo.",
    }


@router.post("/worker/resume")
async def resume_worker(_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR]))):
    """Resume background worker to drain queue backlog and demonstrate recovery."""
    WORKER_STATE["paused"] = False
    return {
        "status": "success",
        "worker_paused": False,
        "message": "Worker resumed. Processing pending queue events.",
    }


@router.get("/worker/status")
async def get_worker_status(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR])),
):
    """Check background worker running status, queue depth, and outbox backlogs."""
    pending_count = (
        await db.execute(
            select(func.count(OutboxEvent.id)).where(OutboxEvent.status == OutboxStatus.PENDING)
        )
    ).scalar() or 0

    published_count = (
        await db.execute(
            select(func.count(OutboxEvent.id)).where(OutboxEvent.status == OutboxStatus.PUBLISHED)
        )
    ).scalar() or 0

    failed_count = (
        await db.execute(
            select(func.count(OutboxEvent.id)).where(OutboxEvent.status == OutboxStatus.FAILED)
        )
    ).scalar() or 0

    return {
        "worker_paused": WORKER_STATE["paused"],
        "queue_depth": pending_count,
        "processed_events": published_count,
        "failed_dlq_events": failed_count,
    }


@router.get("/outbox")
async def list_outbox_events(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR])),
):
    """Inspect transactional outbox events to verify message staging and delivery status."""
    stmt = select(OutboxEvent).order_by(OutboxEvent.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    events = result.scalars().all()
    return events


@router.post("/seed")
async def trigger_reseed(_user: User = Depends(require_roles([UserRole.ADMIN]))):
    """Trigger clean re-seed of Mumbai emergency demonstration dataset."""
    from scripts.seed.seed_data import seed_all
    await seed_all()
    return {"status": "success", "message": "Demo data reseeded successfully."}

