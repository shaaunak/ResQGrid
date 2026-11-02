from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user, get_optional_current_user, require_roles
from app.core.database import get_db
from app.models.enums import ItemCategory, MovementType, UserRole
from app.models.inventory import (
    Depot,
    InventoryItem,
    InventoryStock,
    Shelter,
    StockMovement,
)
from app.models.user import User
from app.schemas.inventory import (
    DepotResponse,
    IntakeRequest,
    ItemResponse,
    ShelterResponse,
    StockMovementResponse,
    StockResponse,
)
from app.services.audit_service import audit_service
from app.services.event_publisher import event_publisher

router = APIRouter(prefix="/inventory", tags=["Relief Inventory & Depots"])


@router.get("/depots", response_model=List[DepotResponse])
async def list_depots(db: AsyncSession = Depends(get_db), _user: Optional[User] = Depends(get_optional_current_user)):
    """List all distribution depots and relief shelters."""
    result = await db.execute(select(Depot).order_by(Depot.name))
    return result.scalars().all()


@router.get("/shelters", response_model=List[ShelterResponse])
async def list_shelters(db: AsyncSession = Depends(get_db), _user: Optional[User] = Depends(get_optional_current_user)):
    """List all emergency shelters and occupancy stats."""
    result = await db.execute(select(Shelter).order_by(Shelter.name))
    return result.scalars().all()


@router.get("/items", response_model=List[ItemResponse])
async def list_items(
    category: Optional[ItemCategory] = None,
    db: AsyncSession = Depends(get_db),
    _user: Optional[User] = Depends(get_optional_current_user),
):
    """List catalog of relief supply inventory items."""
    stmt = select(InventoryItem).order_by(InventoryItem.name)
    if category:
        stmt = stmt.where(InventoryItem.category == category)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/stocks", response_model=List[StockResponse])
async def list_stocks(
    depot_id: Optional[str] = None,
    item_id: Optional[str] = None,
    low_stock_only: bool = False,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List inventory stock levels per depot with available/reserved breakdowns and low-stock indicators."""
    stmt = (
        select(InventoryStock)
        .options(selectinload(InventoryStock.item), selectinload(InventoryStock.depot))
        .order_by(InventoryStock.quantity_available.asc())
    )
    if depot_id:
        stmt = stmt.where(InventoryStock.depot_id == depot_id)
    if item_id:
        stmt = stmt.where(InventoryStock.item_id == item_id)

    result = await db.execute(stmt)
    stocks = result.scalars().all()

    stock_responses = []
    for s in stocks:
        is_low = s.quantity_available <= s.minimum_threshold
        if low_stock_only and not is_low:
            continue
        stock_responses.append(
            StockResponse(
                id=s.id,
                depot_id=s.depot_id,
                item_id=s.item_id,
                quantity_available=s.quantity_available,
                quantity_reserved=s.quantity_reserved,
                quantity_total=s.quantity_total,
                minimum_threshold=s.minimum_threshold,
                is_low_stock=is_low,
                item=ItemResponse.model_validate(s.item) if s.item else None,
                depot=DepotResponse.model_validate(s.depot) if s.depot else None,
                updated_at=s.updated_at,
            )
        )
    return stock_responses


@router.post("/intake", response_model=StockResponse)
async def intake_stock(
    intake_in: IntakeRequest,
    db: AsyncSession = Depends(get_db),
    coordinator: User = Depends(require_roles([UserRole.COORDINATOR, UserRole.ADMIN, UserRole.OPERATOR])),
):
    """Log incoming relief supply donation or replenishment.

    Increases available and total quantity safely within a database transaction.
    """
    stock_res = await db.execute(
        select(InventoryStock)
        .options(selectinload(InventoryStock.item), selectinload(InventoryStock.depot))
        .where(
            InventoryStock.depot_id == intake_in.depot_id,
            InventoryStock.item_id == intake_in.item_id,
        )
        .with_for_update()
    )
    stock = stock_res.scalar_one_or_none()

    if not stock:
        # Check depot and item exist
        depot = (await db.execute(select(Depot).where(Depot.id == intake_in.depot_id))).scalar_one_or_none()
        item = (await db.execute(select(InventoryItem).where(InventoryItem.id == intake_in.item_id))).scalar_one_or_none()
        if not depot or not item:
            raise HTTPException(status_code=404, detail="Depot or Inventory Item not found.")

        stock = InventoryStock(
            depot_id=intake_in.depot_id,
            item_id=intake_in.item_id,
            quantity_available=intake_in.quantity,
            quantity_reserved=0,
            quantity_total=intake_in.quantity,
            minimum_threshold=10,
        )
        db.add(stock)
        await db.flush()
    else:
        stock.quantity_available += intake_in.quantity
        stock.quantity_total += intake_in.quantity

    # Record stock movement
    movement = StockMovement(
        item_id=intake_in.item_id,
        to_depot_id=intake_in.depot_id,
        quantity=intake_in.quantity,
        movement_type=MovementType.INTAKE,
        actor_id=coordinator.id,
        notes=intake_in.notes,
    )
    db.add(movement)

    # Audit log
    await audit_service.log_action(
        db=db,
        action="INVENTORY_INTAKE",
        resource_type="inventory_stock",
        resource_id=stock.id,
        actor_id=coordinator.id,
        details={"quantity_added": intake_in.quantity, "new_total": stock.quantity_total},
    )

    await db.commit()
    await db.refresh(stock)

    # Reload with item and depot
    final_res = await db.execute(
        select(InventoryStock)
        .options(selectinload(InventoryStock.item), selectinload(InventoryStock.depot))
        .where(InventoryStock.id == stock.id)
    )
    final_stock = final_res.scalar_one()

    return StockResponse(
        id=final_stock.id,
        depot_id=final_stock.depot_id,
        item_id=final_stock.item_id,
        quantity_available=final_stock.quantity_available,
        quantity_reserved=final_stock.quantity_reserved,
        quantity_total=final_stock.quantity_total,
        minimum_threshold=final_stock.minimum_threshold,
        is_low_stock=final_stock.quantity_available <= final_stock.minimum_threshold,
        item=ItemResponse.model_validate(final_stock.item),
        depot=DepotResponse.model_validate(final_stock.depot),
        updated_at=final_stock.updated_at,
    )


@router.get("/movements", response_model=List[StockMovementResponse])
async def list_stock_movements(
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _coordinator: User = Depends(require_roles([UserRole.COORDINATOR, UserRole.ADMIN, UserRole.OPERATOR])),
):
    """Retrieve full audit history of stock movements (Intake, Reservations, Dispatches)."""
    stmt = (
        select(StockMovement)
        .order_by(StockMovement.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

