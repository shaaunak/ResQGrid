from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    channel: str
    is_read: bool
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

