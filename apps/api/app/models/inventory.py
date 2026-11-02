import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import DepotType, ItemCategory, MovementType, ReservationStatus


class Depot(Base):
    __tablename__ = "depots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    location_name = Column(String(255), nullable=False)
    depot_type = Column(SQLEnum(DepotType), default=DepotType.CENTRAL_DEPOT, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_phone = Column(String(50), nullable=True)
    manager_name = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    stocks = relationship("InventoryStock", back_populates="depot", cascade="all, delete-orphan")


class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_people = Column(Integer, nullable=False, default=100)
    current_occupancy = Column(Integer, nullable=False, default=0)
    status = Column(String(50), default="OPERATIONAL", nullable=False)  # OPERATIONAL, NEAR_CAPACITY, FULL
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(SQLEnum(ItemCategory), nullable=False, index=True)
    unit = Column(String(50), default="units", nullable=False)  # boxes, liters, kits, units
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    stocks = relationship("InventoryStock", back_populates="item", cascade="all, delete-orphan")


class InventoryStock(Base):
    __tablename__ = "inventory_stock"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    depot_id = Column(String(36), ForeignKey("depots.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id = Column(String(36), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False, index=True)
    
    quantity_available = Column(Integer, default=0, nullable=False)
    quantity_reserved = Column(Integer, default=0, nullable=False)
    quantity_total = Column(Integer, default=0, nullable=False)
    minimum_threshold = Column(Integer, default=10, nullable=False)
    
    last_replenished_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("depot_id", "item_id", name="uq_depot_item"),
        CheckConstraint("quantity_available >= 0", name="chk_stock_available_non_negative"),
        CheckConstraint("quantity_reserved >= 0", name="chk_stock_reserved_non_negative"),
    )

    depot = relationship("Depot", back_populates="stocks")
    item = relationship("InventoryItem", back_populates="stocks")


class StockReservation(Base):
    __tablename__ = "stock_reservations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    depot_id = Column(String(36), ForeignKey("depots.id", ondelete="RESTRICT"), nullable=False, index=True)
    item_id = Column(String(36), ForeignKey("inventory_items.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    quantity_reserved = Column(Integer, nullable=False)
    quantity_consumed = Column(Integer, default=0, nullable=False)
    status = Column(SQLEnum(ReservationStatus), default=ReservationStatus.RESERVED, nullable=False, index=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    assignment = relationship("Assignment", back_populates="stock_reservations")
    depot = relationship("Depot")
    item = relationship("InventoryItem")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String(36), ForeignKey("inventory_items.id", ondelete="RESTRICT"), nullable=False, index=True)
    from_depot_id = Column(String(36), ForeignKey("depots.id", ondelete="RESTRICT"), nullable=True)
    to_depot_id = Column(String(36), ForeignKey("depots.id", ondelete="RESTRICT"), nullable=True)
    assignment_id = Column(String(36), ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True)
    
    quantity = Column(Integer, nullable=False)
    movement_type = Column(SQLEnum(MovementType), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    item = relationship("InventoryItem")
    from_depot = relationship("Depot", foreign_keys=[from_depot_id])
    to_depot = relationship("Depot", foreign_keys=[to_depot_id])
    actor = relationship("User", foreign_keys=[actor_id])

