from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.enums import TeamStatus, TeamType, UserRole
from app.models.team import ResponseTeam, TeamMember
from app.models.user import User
from app.schemas.team import TeamCreate, TeamResponse

router = APIRouter(prefix="/teams", tags=["Response Teams"])


@router.get("", response_model=List[TeamResponse])
async def list_teams(
    team_type: Optional[TeamType] = None,
    status_filter: Optional[TeamStatus] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List response teams with optional type and status filtering."""
    stmt = select(ResponseTeam).order_by(ResponseTeam.name)
    if team_type:
        stmt = stmt.where(ResponseTeam.team_type == team_type)
    if status_filter:
        stmt = stmt.where(ResponseTeam.status == status_filter)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_in: TeamCreate,
    db: AsyncSession = Depends(get_db),
    _operator: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN])),
):
    """Register a new emergency response team (Operators / Admins)."""
    # Check duplicate name
    existing = await db.execute(select(ResponseTeam).where(ResponseTeam.name == team_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A team with this name already exists.")

    team = ResponseTeam(
        name=team_in.name,
        team_type=team_in.team_type,
        status=TeamStatus.AVAILABLE,
        capacity=team_in.capacity,
        base_location_name=team_in.base_location_name,
        base_latitude=team_in.base_latitude,
        base_longitude=team_in.base_longitude,
        current_latitude=team_in.base_latitude,
        current_longitude=team_in.base_longitude,
        contact_phone=team_in.contact_phone,
        qualifications=team_in.qualifications,
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Retrieve response team details."""
    result = await db.execute(select(ResponseTeam).where(ResponseTeam.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Response team not found.")
    return team


@router.patch("/{team_id}/location", response_model=TeamResponse)
async def update_team_location(
    team_id: str,
    latitude: float,
    longitude: float,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.RESPONDER, UserRole.OPERATOR, UserRole.ADMIN])),
):
    """Simulate GPS telemetry update for a response team."""
    result = await db.execute(select(ResponseTeam).where(ResponseTeam.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Response team not found.")

    team.current_latitude = latitude
    team.current_longitude = longitude
    await db.commit()
    await db.refresh(team)
    return team

