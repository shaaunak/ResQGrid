from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_roles
from app.core.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
async def list_users(
    role: Optional[UserRole] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN])),
):
    """List registered users with optional role filtering (Operators and Admins only)."""
    stmt = select(User)
    if role:
        stmt = stmt.where(User.role == role)
    stmt = stmt.offset(offset).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

