from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.enums import DepotType, ItemCategory, MovementType


class DepotResponse(BaseModel):
    id: str
    name: str
    location_name: str
    depot_type: DepotType
    latitude: float
    longitude: float
    contact_phone: Optional[str]
    manager_name: Optional[str]

    class Config:
        from_attributes = True


class ShelterResponse(BaseModel):
    id: str
    name: str
    location_name: str
    latitude: float
    longitude: float
    capacity_people: int
    current_occupancy: int
    status: str
    contact_person: Optional[str]
    contact_phone: Optional[str]

    class Config:
        from_attributes = True


class ItemResponse(BaseModel):
    id: str
    sku: str
    name: str
    category: ItemCategory
    unit: str
    description: Optional[str]

    class Config:
        from_attributes = True


class StockResponse(BaseModel):
    id: str
    depot_id: str
    item_id: str
    quantity_available: int
    quantity_reserved: int
    quantity_total: int
    minimum_threshold: int
    is_low_stock: bool = False
    item: Optional[ItemResponse] = None
    depot: Optional[DepotResponse] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class IntakeRequest(BaseModel):
    depot_id: str
    item_id: str
    quantity: int = Field(ge=1)
    notes: Optional[str] = "Simulated donation / stock replenishment"


class StockMovementResponse(BaseModel):
    id: str
    item_id: str
    from_depot_id: Optional[str]
    to_depot_id: Optional[str]
    assignment_id: Optional[str]
    quantity: int
    movement_type: MovementType
    actor_id: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

