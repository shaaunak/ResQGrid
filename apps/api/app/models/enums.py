import enum


class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    OPERATOR = "OPERATOR"
    RESPONDER = "RESPONDER"
    COORDINATOR = "COORDINATOR"
    ADMIN = "ADMIN"


class IncidentCategory(str, enum.Enum):
    FLOOD = "FLOOD"
    MEDICAL = "MEDICAL"
    FIRE = "FIRE"
    COLLAPSE = "COLLAPSE"
    EVACUATION = "EVACUATION"
    SUPPLIES = "SUPPLIES"
    CYCLONE = "CYCLONE"
    OTHER = "OTHER"


class IncidentSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class IncidentStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    VERIFIED = "VERIFIED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    # Legacy compatibility aliases
    PRIORITIZED = "VERIFIED"
    ACCEPTED = "ASSIGNED"


class TeamStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    DISPATCHED = "DISPATCHED"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"


class TeamType(str, enum.Enum):
    WATER_RESCUE = "WATER_RESCUE"
    MEDICAL = "MEDICAL"
    FIREFIGHTING = "FIREFIGHTING"
    GENERAL_EVACUATION = "GENERAL_EVACUATION"
    RELIEF_DISTRIBUTION = "RELIEF_DISTRIBUTION"


class AssignmentStatus(str, enum.Enum):
    OFFERED = "OFFERED"
    PENDING = "PENDING"  # Alias for backward compatibility
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    EN_ROUTE = "EN_ROUTE"
    ON_SCENE = "ON_SCENE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REASSIGNED = "REASSIGNED"


class DepotType(str, enum.Enum):
    CENTRAL_DEPOT = "CENTRAL_DEPOT"
    RELIEF_SHELTER = "RELIEF_SHELTER"
    MOBILE_HUB = "MOBILE_HUB"


class ItemCategory(str, enum.Enum):
    WATER = "WATER"
    FOOD_RATION = "FOOD_RATION"
    MEDICAL_KIT = "MEDICAL_KIT"
    RESCUE_GEAR = "RESCUE_GEAR"
    BLANKET = "BLANKET"
    POWER_GENERATOR = "POWER_GENERATOR"


class ReservationStatus(str, enum.Enum):
    RESERVED = "RESERVED"
    CONSUMED = "CONSUMED"
    RELEASED = "RELEASED"


class MovementType(str, enum.Enum):
    INTAKE = "INTAKE"
    RESERVATION = "RESERVATION"
    DISPATCH = "DISPATCH"
    RETURN = "RETURN"
    ADJUSTMENT = "ADJUSTMENT"


class OutboxStatus(str, enum.Enum):
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"

