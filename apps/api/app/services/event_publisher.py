import json
import uuid
from typing import Any, Dict, Optional
import boto3
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.enums import OutboxStatus
from app.models.outbox import OutboxEvent


class EventPublisher:
    """Manages transactional outbox events and dispatches to AWS SQS."""

    def __init__(self):
        self.queue_backend = settings.QUEUE_BACKEND
        self.sqs_url = settings.SQS_QUEUE_URL
        self.region = settings.AWS_REGION
        self.sqs_client = None

        if self.queue_backend == "sqs" and self.sqs_url:
            try:
                self.sqs_client = boto3.client("sqs", region_name=self.region)
            except Exception as e:
                print(f"Warning: SQS client initialization failed ({e}). Using outbox table fallback.")

    async def stage_outbox_event(
        self,
        db: AsyncSession,
        event_type: str,
        payload: Dict[str, Any],
        idempotency_key: Optional[str] = None,
    ) -> OutboxEvent:
        """Stage an outbox event in PostgreSQL within the active transaction."""
        if not idempotency_key:
            idempotency_key = f"{event_type}_{uuid.uuid4().hex}"

        event = OutboxEvent(
            event_type=event_type,
            payload=payload,
            status=OutboxStatus.PENDING,
            idempotency_key=idempotency_key,
        )
        db.add(event)
        return event

    def publish_to_sqs_sync(self, event_type: str, payload: Dict[str, Any], idempotency_key: str) -> bool:
        """Publish directly to Amazon SQS."""
        if not self.sqs_client or not self.sqs_url:
            return False

        try:
            message_body = json.dumps({
                "event_type": event_type,
                "payload": payload,
                "idempotency_key": idempotency_key,
            })
            self.sqs_client.send_message(
                QueueUrl=self.sqs_url,
                MessageBody=message_body,
                MessageAttributes={
                    "EventType": {
                        "DataType": "String",
                        "StringValue": event_type,
                    }
                }
            )
            return True
        except Exception as e:
            print(f"Error publishing to SQS ({e}). Message remains in transactional outbox.")
            return False


event_publisher = EventPublisher()

