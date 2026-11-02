import json
from typing import Any, Dict, Optional
import boto3
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.notification import Notification


class NotificationService:
    """Delivers in-app notifications and external Amazon SNS alerts."""

    def __init__(self):
        self.backend = settings.NOTIFICATION_BACKEND
        self.region = settings.AWS_REGION
        self.escalation_topic = settings.SNS_INCIDENT_ESCALATION_TOPIC_ARN
        self.shortage_topic = settings.SNS_RESOURCE_SHORTAGE_TOPIC_ARN
        self.sns_client = None

        if self.backend == "sns":
            try:
                self.sns_client = boto3.client("sns", region_name=self.region)
            except Exception as e:
                print(f"Warning: SNS client initialization failed ({e}). Defaulting to database alerts.")

    async def send_in_app(
        self,
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "INFO",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Notification:
        """Create an in-app notification record in the database."""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            channel="IN_APP",
            metadata_json=metadata or {},
        )
        db.add(notification)
        return notification

    def publish_sns_escalation(self, incident_title: str, message: str, details: Optional[Dict[str, Any]] = None) -> bool:
        """Publish high-priority incident escalation message to Amazon SNS."""
        if not self.sns_client or not self.escalation_topic:
            return False

        try:
            subject = f"[ResQGrid Alert] Escalation: {incident_title[:50]}"
            body = f"{message}\n\nDetails:\n{json.dumps(details or {}, indent=2)}"
            self.sns_client.publish(
                TopicArn=self.escalation_topic,
                Subject=subject,
                Message=body,
            )
            return True
        except Exception as e:
            print(f"Failed to publish to SNS escalation topic: {e}")
            return False

    def publish_sns_resource_shortage(self, depot_name: str, item_name: str, remaining: int) -> bool:
        """Publish resource deficit warning to Amazon SNS."""
        if not self.sns_client or not self.shortage_topic:
            return False

        try:
            subject = f"[ResQGrid Alert] Low Stock: {item_name} at {depot_name}"
            body = f"WARNING: Stock for {item_name} at depot '{depot_name}' has fallen to {remaining} units."
            self.sns_client.publish(
                TopicArn=self.shortage_topic,
                Subject=subject,
                Message=body,
            )
            return True
        except Exception as e:
            print(f"Failed to publish to SNS shortage topic: {e}")
            return False


notification_service = NotificationService()

