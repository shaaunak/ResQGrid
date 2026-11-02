from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog


class AuditService:
    """Records audit logs for sensitive operations."""

    @staticmethod
    async def log_action(
        db: AsyncSession,
        action: str,
        resource_type: str,
        resource_id: str,
        actor_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        audit_entry = AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details_json=details or {},
            ip_address=ip_address,
        )
        db.add(audit_entry)
        return audit_entry


audit_service = AuditService()

