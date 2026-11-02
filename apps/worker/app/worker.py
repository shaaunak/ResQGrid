import asyncio
import json
import logging
import os
import signal
import sys
from datetime import datetime, timezone
import boto3
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

# Add apps/api to sys.path so worker can share models and database configuration
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../api")))

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.enums import OutboxStatus
from app.models.outbox import OutboxEvent
from app.services.notification_service import notification_service

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [ResQGrid-Worker] %(message)s",
)
logger = logging.getLogger("worker")

MAX_RETRIES = 3


class EventWorker:
    def __init__(self):
        self.is_running = True
        self.is_paused = False  # For failure injection & CloudWatch alarm demonstration
        self.queue_backend = settings.QUEUE_BACKEND
        self.sqs_url = settings.SQS_QUEUE_URL
        self.sqs_dlq_url = settings.SQS_DLQ_URL
        self.sqs_client = None

        if self.queue_backend == "sqs" and self.sqs_url:
            try:
                self.sqs_client = boto3.client("sqs", region_name=settings.AWS_REGION)
                logger.info("Connected to Amazon SQS at %s", self.sqs_url)
            except Exception as e:
                logger.warning("Could not connect to SQS (%s), falling back to PostgreSQL outbox polling.", e)

    def pause(self):
        """Pause worker processing to simulate worker downtime and trigger CloudWatch alarm."""
        self.is_paused = True
        logger.warning("WORKER PAUSED: Inbound messages will accumulate in queue (Simulating downtime).")

    def resume(self):
        """Resume worker processing after failure simulation."""
        self.is_paused = False
        logger.info("WORKER RESUMED: Processing accumulated queue backlog.")

    def stop(self):
        self.is_running = False
        logger.info("Worker shutting down gracefully...")

    async def process_event(self, event_type: str, payload: dict, idempotency_key: str) -> bool:
        """Process business logic for an event with idempotent execution."""
        logger.info("Processing event [%s] with key [%s]", event_type, idempotency_key)

        try:
            if event_type == "INCIDENT_REPORTED":
                incident_id = payload.get("incident_id")
                tracking_id = payload.get("tracking_id")
                logger.info("Incident %s (%s) registered. Awaiting operator verification.", tracking_id, incident_id)

            elif event_type == "INCIDENT_VERIFIED":
                incident_id = payload.get("incident_id")
                priority = payload.get("priority_score")
                logger.info("Incident %s verified with priority %s. Eligible for dispatch.", incident_id, priority)

            elif event_type == "ASSIGNMENT_DISPATCHED":
                team_name = payload.get("team_name")
                tracking_id = payload.get("tracking_id")
                logger.info("Dispatch alert: Team %s mobilized for emergency %s.", team_name, tracking_id)

            elif event_type == "INCIDENT_RESOLVED":
                tracking_id = payload.get("tracking_id")
                logger.info("Incident %s successfully resolved. Mission archived.", tracking_id)

            elif event_type == "INCIDENT_ESCALATED":
                incident_title = payload.get("title", "High-Risk Incident")
                notification_service.publish_sns_escalation(
                    incident_title=incident_title,
                    message=f"Incident {payload.get('tracking_id')} escalated due to critical response delay.",
                    details=payload,
                )
                logger.warning("CRITICAL ESCALATION broadcast via SNS topic for %s", payload.get("tracking_id"))

            elif event_type == "RESOURCE_SHORTAGE":
                depot = payload.get("depot_name", "Depot")
                item = payload.get("item_name", "Supplies")
                remaining = payload.get("remaining", 0)
                notification_service.publish_sns_resource_shortage(depot, item, remaining)
                logger.warning("RESOURCE DEFICIT broadcast via SNS for %s at %s", item, depot)

            return True

        except Exception as e:
            logger.error("Error processing event %s: %s", event_type, e, exc_info=True)
            return False

    async def poll_sqs(self):
        """Poll Amazon SQS using long-polling."""
        if not self.sqs_client or not self.sqs_url:
            return

        while self.is_running:
            if self.is_paused:
                await asyncio.sleep(2)
                continue

            try:
                response = self.sqs_client.receive_message(
                    QueueUrl=self.sqs_url,
                    MaxNumberOfMessages=settings.SQS_MAX_MESSAGES,
                    WaitTimeSeconds=settings.SQS_WAIT_TIME_SECONDS,
                    AttributeNames=["All"],
                )
                messages = response.get("Messages", [])
                for msg in messages:
                    receipt_handle = msg["ReceiptHandle"]
                    body = json.loads(msg["Body"])
                    event_type = body.get("event_type", "UNKNOWN")
                    payload = body.get("payload", {})
                    idempotency_key = body.get("idempotency_key", msg["MessageId"])

                    success = await self.process_event(event_type, payload, idempotency_key)
                    if success:
                        self.sqs_client.delete_message(QueueUrl=self.sqs_url, ReceiptHandle=receipt_handle)
                    else:
                        logger.warning("Message processing failed. SQS visibility timeout will trigger retry.")

            except Exception as e:
                logger.error("SQS polling error: %s", e)
                await asyncio.sleep(5)

    async def poll_outbox(self):
        """Poll PostgreSQL transactional outbox table for pending events."""
        while self.is_running:
            if self.is_paused:
                await asyncio.sleep(2)
                continue

            async with AsyncSessionLocal() as db:
                try:
                    stmt = (
                        select(OutboxEvent)
                        .where(OutboxEvent.status == OutboxStatus.PENDING)
                        .order_by(OutboxEvent.created_at.asc())
                        .limit(10)
                    )
                    result = await db.execute(stmt)
                    events = result.scalars().all()

                    for event in events:
                        # Process event
                        success = await self.process_event(
                            event_type=event.event_type,
                            payload=event.payload,
                            idempotency_key=event.idempotency_key,
                        )

                        if success:
                            event.status = OutboxStatus.PUBLISHED
                            event.processed_at = datetime.now(timezone.utc)
                        else:
                            event.retry_count += 1
                            if event.retry_count >= MAX_RETRIES:
                                event.status = OutboxStatus.FAILED
                                logger.error("Event %s failed after %d retries. Moved to DLQ state.", event.id, MAX_RETRIES)
                            else:
                                logger.warning("Event %s retry %d of %d.", event.id, event.retry_count, MAX_RETRIES)

                    if events:
                        await db.commit()

                except Exception as e:
                    logger.error("Outbox polling error: %s", e)
                    await db.rollback()

            await asyncio.sleep(1.5)

    async def run(self):
        logger.info("ResQGrid Event Worker initialized (backend: %s)", self.queue_backend)
        if self.queue_backend == "sqs" and self.sqs_client:
            await self.poll_sqs()
        else:
            await self.poll_outbox()


worker_instance = EventWorker()


async def main():
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, worker_instance.stop)
    await worker_instance.run()


if __name__ == "__main__":
    asyncio.run(main())

