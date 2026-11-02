import io
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.enums import IncidentSeverity, IncidentStatus, TeamStatus, UserRole
from app.models.incident import Incident
from app.models.inventory import Depot, InventoryItem, InventoryStock
from app.models.team import ResponseTeam
from app.models.user import User
from app.schemas.intelligence import AuditLogResponse, DisasterPackTemplate, SituationBriefResponse
from app.services.external_intel import external_intelligence_service
from app.services.storage import storage_service

router = APIRouter(prefix="/intelligence", tags=["Intelligence, Briefs & Audit Logs"])

# Predefined Disaster Packs that alter incident types, required equipment and templates
DISASTER_PACKS: Dict[str, DisasterPackTemplate] = {
    "flood": DisasterPackTemplate(
        id="flood",
        name="Urban Flood Pack (Monsoon Inundation)",
        description="Optimized for severe flash flooding, Mithi River overflow, and residential watercraft evacuations.",
        incident_types=["WATERLOGGING", "STRANDED_CITIZENS", "DRAIN_OVERFLOW", "BASEMENT_SUBMERSION", "ELECTRICAL_SHORT_CIRCUIT"],
        required_equipment=["Inflatable Rescue Boats", "Lifejackets & Harnesses", "Submersible De-Watering Pumps", "Trauma First Aid Kits"],
        default_templates=[
            {"code": "FL-01", "title": "Severe Waterlogging / Residential Trap", "severity": "CRITICAL", "supplies": "Inflatable Rescue Boats, Lifejackets"},
            {"code": "FL-02", "title": "Subway Traffic Flash Flood Blockage", "severity": "HIGH", "supplies": "High-Volume Water Pump, Tow Cables"},
            {"code": "FL-03", "title": "Creek Inundation & Slum Evacuation", "severity": "HIGH", "supplies": "Lifejackets, Rations, Blankets"},
        ],
        priority_weight_adjustments={"severity": 0.40, "impact": 0.30, "waiting_time": 0.20, "vulnerability": 0.10},
    ),
    "earthquake": DisasterPackTemplate(
        id="earthquake",
        name="Earthquake / Structural Collapse Pack",
        description="Tailored for seismic damage, building collapses, heavy extrication, and transit shelter coordination.",
        incident_types=["BUILDING_COLLAPSE", "STRUCTURAL_CRACK", "VICTIM_ENTRAPMENT", "GAS_LEAK", "ROAD_FISSURE"],
        required_equipment=["Hydraulic Cutters & Spreaders", "Acoustic Listening Sensors", "Thermal Blankets", "Field Surgical Trauma Kits"],
        default_templates=[
            {"code": "EQ-01", "title": "Multi-Story Structure Collapse with Trapped Victims", "severity": "CRITICAL", "supplies": "Hydraulic Extrication Tools, Paramedic Trauma Caches"},
            {"code": "EQ-02", "title": "Compromised Foundation / Transit Camp Evacuation", "severity": "HIGH", "supplies": "Emergency Blankets, Structural Shoring Jacks"},
            {"code": "EQ-03", "title": "Ruptured Gas Line & Building Evacuation", "severity": "CRITICAL", "supplies": "Hazmat Respirators, Gas Detection Meters"},
        ],
        priority_weight_adjustments={"severity": 0.45, "impact": 0.35, "waiting_time": 0.15, "vulnerability": 0.05},
    ),
    "cyclone": DisasterPackTemplate(
        id="cyclone",
        name="Coastal Cyclone & Gale Storm Pack",
        description="Configured for severe gale-force winds, tree falls, storm surges, and coastal fisherman settlements.",
        incident_types=["STORM_SURGE_INFLOW", "UPROOTED_TREES_ROAD_BLOCK", "ROOF_DISLODGEMENT", "COASTAL_FISHERMAN_STRANDING", "POWER_GRID_FAILURE"],
        required_equipment=["Heavy Duty Chainsaws", "Portable 5kW Generators", "Emergency Rations & Potable Water", "Amphibious Vehicles"],
        default_templates=[
            {"code": "CY-01", "title": "Storm Surge Inundation in Coastal Fisherman Hamlet", "severity": "CRITICAL", "supplies": "Amphibious Transports, 20L Water Jerrycans"},
            {"code": "CY-02", "title": "Arterial Highway Blocked by Fallen Trees & Wires", "severity": "HIGH", "supplies": "Industrial Chainsaws, Heavy Towing Cables"},
            {"code": "CY-03", "title": "Shelter Power Blackout with Medical Equipment", "severity": "HIGH", "supplies": "Portable 5kW Power Generators"},
        ],
        priority_weight_adjustments={"severity": 0.35, "impact": 0.35, "waiting_time": 0.20, "vulnerability": 0.10},
    ),
    "fire": DisasterPackTemplate(
        id="fire",
        name="Industrial Fire & Hazmat Emergency Pack",
        description="Engineered for chemical spills, commercial high-rise blazes, and dense slum smoke inhalation triage.",
        incident_types=["CHEMICAL_FACTORY_FIRE", "SLUM_CLUSTER_INFERNO", "TOXIC_SMOKE_INHALATION", "TRANSFORMER_EXPLOSION", "LPG_CYLINDER_BLAST"],
        required_equipment=["Self-Contained Breathing Apparatus (SCBA)", "AFFF Foam Extinguishers", "Burn Trauma Kits", "Evacuation Megaphones"],
        default_templates=[
            {"code": "FR-01", "title": "Industrial MIDC Chemical Factory Blaze", "severity": "CRITICAL", "supplies": "AFFF Foam Concentrates, SCBA Packs, Burn Dressings"},
            {"code": "FR-02", "title": "Dense Slum Cluster Fire & Rapid Smoke Spread", "severity": "CRITICAL", "supplies": "Thermal Protective Gear, Oxygen Inhalers"},
            {"code": "FR-03", "title": "Electrical Transformer Explosion in Market Junction", "severity": "HIGH", "supplies": "Dry Chemical Extinguishers, Crowd Barriers"},
        ],
        priority_weight_adjustments={"severity": 0.50, "impact": 0.30, "waiting_time": 0.10, "vulnerability": 0.10},
    ),
}


@router.get("/mumbai-weather")
async def get_mumbai_weather():
    """Retrieve live meteorological intelligence for Mumbai study area."""
    return await external_intelligence_service.get_mumbai_weather_telemetry()


@router.get("/disaster-packs", response_model=List[DisasterPackTemplate])
async def list_disaster_packs():
    """List operational disaster response packs and configurations."""
    return list(DISASTER_PACKS.values())


@router.get("/disaster-packs/{pack_id}", response_model=DisasterPackTemplate)
async def get_disaster_pack(pack_id: str):
    """Retrieve detailed disaster pack specifications and incident templates."""
    pack = DISASTER_PACKS.get(pack_id.lower())
    if not pack:
        raise HTTPException(status_code=404, detail=f"Disaster pack '{pack_id}' not found.")
    return pack


@router.get("/situation-brief", response_model=SituationBriefResponse)
async def generate_situation_brief(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Generate instantaneous, one-click executive situation brief synthesized from live database records.

    Includes open incidents by severity, free rescue units, inventory at risk, top 3 tactical actions,
    and generates an exportable executive brief document with a presigned URL.
    """
    now = datetime.now(timezone.utc)
    brief_id = f"BRIEF-{uuid.uuid4().hex[:8].upper()}"

    active_statuses = [
        IncidentStatus.REPORTED,
        IncidentStatus.VERIFIED,
        IncidentStatus.PRIORITIZED,
        IncidentStatus.ASSIGNED,
        IncidentStatus.ACCEPTED,
        IncidentStatus.IN_PROGRESS,
    ]

    # 1. Open incidents by severity
    sev_q = (
        select(Incident.severity, func.count(Incident.id))
        .where(Incident.status.in_(active_statuses))
        .group_by(Incident.severity)
    )
    sev_rows = (await db.execute(sev_q)).all()
    open_incidents_by_severity = {
        IncidentSeverity.CRITICAL.value: 0,
        IncidentSeverity.HIGH.value: 0,
        IncidentSeverity.MEDIUM.value: 0,
        IncidentSeverity.LOW.value: 0,
    }
    for row in sev_rows:
        open_incidents_by_severity[row[0].value] = row[1]

    total_active = sum(open_incidents_by_severity.values())

    # 2. Units Free vs Total
    teams_all = (await db.execute(select(ResponseTeam))).scalars().all()
    free_teams = [t for t in teams_all if t.status == TeamStatus.AVAILABLE and t.active_assignments_count == 0]
    units_free_details = [f"{t.name} ({t.base_location_name})" for t in free_teams]

    # 3. Stock at Risk (available <= minimum threshold)
    stock_risk_q = (
        select(InventoryStock, Depot.name, InventoryItem.name)
        .join(Depot, InventoryStock.depot_id == Depot.id)
        .join(InventoryItem, InventoryStock.item_id == InventoryItem.id)
        .where(InventoryStock.quantity_available <= InventoryStock.minimum_threshold)
    )
    stock_risk_rows = (await db.execute(stock_risk_q)).all()
    stock_at_risk = [
        {
            "depot_name": d_name,
            "item_name": item_name,
            "available": stock.quantity_available,
            "threshold": stock.minimum_threshold,
            "alert_level": "CRITICAL_SHORTAGE" if stock.quantity_available == 0 else "LOW_STOCK",
        }
        for stock, d_name, item_name in stock_risk_rows
    ]

    # 4. Top 3 Actions Recommended
    top_incidents_q = (
        select(Incident)
        .where(Incident.status.in_([IncidentStatus.REPORTED, IncidentStatus.VERIFIED]))
        .order_by(Incident.priority_score.desc())
        .limit(3)
    )
    top_incidents = (await db.execute(top_incidents_q)).scalars().all()
    top_actions = []
    for idx, inc in enumerate(top_incidents, start=1):
        top_actions.append({
            "action_rank": idx,
            "incident_tracking_id": inc.tracking_id,
            "title": inc.title,
            "severity": inc.severity.value,
            "priority_score": round(inc.priority_score, 1),
            "recommended_action": f"Immediate dispatch recommendation: Deploy nearest qualified squad to {inc.address}.",
        })

    if not top_actions:
        top_actions.append({
            "action_rank": 1,
            "incident_tracking_id": "STANDBY",
            "title": "All open emergency incidents currently assigned or under active triage",
            "severity": "NORMAL",
            "priority_score": 0.0,
            "recommended_action": "Maintain standby monitoring on Mithi River flood basin sensors.",
        })

    # 5. Generate and store PDF/Text summary into S3 / Evidence Vault
    brief_content = f"""RESQGRID DISASTER RESPONSE — EXECUTIVE SITUATION BRIEF
Document ID: {brief_id}
Generated: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}
Operational Region: Mumbai Metropolitan Area (ap-south-1)

1. ACTIVE EMERGENCIES SUMMARY:
- Total Active: {total_active}
- Critical Life-Safety: {open_incidents_by_severity.get('CRITICAL', 0)}
- High Urgency: {open_incidents_by_severity.get('HIGH', 0)}
- Medium Urgency: {open_incidents_by_severity.get('MEDIUM', 0)}

2. TACTICAL UNITS READINESS:
- Available Response Units: {len(free_teams)} / {len(teams_all)}
- Active Free Squads: {', '.join(units_free_details) if units_free_details else 'All units dispatched'}

3. INVENTORY AT RISK:
- Alert Count: {len(stock_at_risk)}
{chr(10).join(f"- {s['depot_name']}: {s['item_name']} (Avail: {s['available']}, Min: {s['threshold']})" for s in stock_at_risk)}

4. TOP PRIORITY ACTIONS:
{chr(10).join(f"[{a['action_rank']}] ({a['incident_tracking_id']}) {a['title']} - Priority {a['priority_score']}: {a['recommended_action']}" for a in top_actions)}
"""
    file_bytes = brief_content.encode("utf-8")
    s3_key = f"briefs/{brief_id}.txt"
    storage_service.save_local_file(s3_key, file_bytes)
    download_url = storage_service.generate_download_url(s3_key)

    return SituationBriefResponse(
        brief_id=brief_id,
        timestamp=now.isoformat(),
        disaster_scenario="Mumbai Urban Flood & Multi-Hazard Coordination",
        open_incidents_by_severity=open_incidents_by_severity,
        total_active_incidents=total_active,
        units_free_count=len(free_teams),
        units_total_count=len(teams_all),
        units_free_details=units_free_details,
        stock_at_risk_alerts=stock_at_risk,
        top_actions_recommended=top_actions,
        pdf_presigned_download_url=download_url,
        academic_disclosure="Executive situation brief generated from ACID relational audit records.",
    )


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    resource_type: Optional[str] = Query(None, description="Filter by resource type e.g. incident, assignment, user"),
    actor_id: Optional[str] = Query(None, description="Filter by user / actor ID"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.OPERATOR, UserRole.ADMIN, UserRole.COORDINATOR])),
):
    """Retrieve audit logs for state changes, dispatches, and administrative actions.

    Filterable by user and entity type.
    """
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
    if resource_type:
        stmt = stmt.where(AuditLog.resource_type == resource_type)
    if actor_id:
        stmt = stmt.where(AuditLog.actor_id == actor_id)

    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return rows
