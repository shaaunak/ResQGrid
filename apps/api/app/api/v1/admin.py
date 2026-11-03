import uuid
from datetime import datetime, timezone
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

# In-memory worker control state
WORKER_STATE = {
    "paused": False,
    "last_alarm_fired_at": None,
    "last_email_sent_to": "emergency-lead@resqgrid.org",
}


@router.post("/worker/pause")
async def pause_worker(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR]))
):
    """Simulate background worker downtime for failure injection.
    
    Generates 6 staged emergency events in the outbox queue, pushing backlog
    above the 5-message threshold to demonstrate the CloudWatch HighSQSQueueDepthAlarm firing
    and simulated SNS alert email dispatch.
    """
    WORKER_STATE["paused"] = True
    now = datetime.now(timezone.utc)
    WORKER_STATE["last_alarm_fired_at"] = now.isoformat()

    # Stage backlog messages so queue depth rises immediately
    for i in range(6):
        outbox_entry = OutboxEvent(
            id=str(uuid.uuid4()),
            event_type="DISPATCH_TELEMETRY_BATCH",
            payload={
                "batch_id": f"batch_{uuid.uuid4().hex[:6]}",
                "message": f"Simulated unconsumed telemetry payload #{i+1}",
                "timestamp": now.isoformat(),
            },
            status=OutboxStatus.PENDING,
            idempotency_key=f"pause_backlog_{uuid.uuid4().hex}",
            retry_count=0,
            created_at=now,
        )
        db.add(outbox_entry)

    await db.commit()

    return {
        "status": "success",
        "worker_paused": True,
        "queue_depth_accumulated": 6,
        "alarm_state": "ALARM",
        "sns_email_dispatched": {
            "recipient": WORKER_STATE["last_email_sent_to"],
            "subject": "ALARM: 'ResQGrid-SQS-OldestMessageAge-prod' in ap-south-1",
            "body": "Threshold Breached: Queue depth exceeded 5 messages (Current: 6 messages). CloudWatch Alarm transition OK -> ALARM.",
        },
        "message": "Worker paused. Backlog injected (depth: 6). CloudWatch Alarm FIRED and SNS alert email sent to emergency-lead@resqgrid.org.",
    }


@router.post("/worker/resume")
async def resume_worker(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR]))
):
    """Resume background worker to drain queue backlog and demonstrate recovery."""
    WORKER_STATE["paused"] = False

    # Mark all pending outbox events as PUBLISHED to simulate rapid worker drain
    stmt = select(OutboxEvent).where(OutboxEvent.status == OutboxStatus.PENDING)
    res = await db.execute(stmt)
    pending_events = res.scalars().all()
    drained_count = len(pending_events)
    for ev in pending_events:
        ev.status = OutboxStatus.PUBLISHED
        ev.processed_at = datetime.now(timezone.utc)

    await db.commit()

    return {
        "status": "success",
        "worker_paused": False,
        "drained_events": drained_count,
        "queue_depth_now": 0,
        "alarm_state": "OK",
        "sns_recovery_dispatched": {
            "recipient": WORKER_STATE["last_email_sent_to"],
            "subject": "OK: 'ResQGrid-SQS-OldestMessageAge-prod' in ap-south-1",
            "body": "Metric recovered below threshold: Queue backlog completely drained to 0 messages.",
        },
        "message": f"Worker resumed. Drained {drained_count} events from queue backlog. Alarm state recovered to OK.",
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
        "last_alarm_fired_at": WORKER_STATE["last_alarm_fired_at"],
        "alert_email": WORKER_STATE["last_email_sent_to"],
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
