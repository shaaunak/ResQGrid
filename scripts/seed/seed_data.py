import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure apps/api is in pythonpath
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../apps/api")))

from sqlalchemy import select, delete
from app.algorithms.priority_engine import calculate_priority_score
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import hash_password
from app.models.assignment import Assignment
from app.models.enums import (
    DepotType,
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
    ItemCategory,
    TeamStatus,
    TeamType,
    UserRole,
)
from app.models.incident import Incident, IncidentEvent
from app.models.inventory import Depot, InventoryItem, InventoryStock, Shelter, StockReservation, StockMovement
from app.models.outbox import OutboxEvent
from app.models.team import ResponseTeam, TeamMember
from app.models.user import User


async def seed_all():
    print("Beginning ResQGrid seed script for Mumbai Emergency Coordination...")

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Reset transient missions, incidents and stock reservations for clean demo baseline
        await db.execute(delete(StockReservation))
        await db.execute(delete(StockMovement))
        await db.execute(delete(Assignment))
        await db.execute(delete(OutboxEvent))
        await db.execute(delete(IncidentEvent))
        await db.execute(delete(Incident))

        # 1. Seed Users for each role
        users_data = [
            {"email": "citizen@resqgrid.org", "name": "Aarav Sharma", "role": UserRole.CITIZEN, "phone": "+91 98200 11223"},
            {"email": "operator@resqgrid.org", "name": "Priya Deshmukh (Command)", "role": UserRole.OPERATOR, "phone": "+91 98200 44556"},
            {"email": "responder@resqgrid.org", "name": "Captain Vikram Patil", "role": UserRole.RESPONDER, "phone": "+91 98200 77889"},
            {"email": "coordinator@resqgrid.org", "name": "Dr. Sunita Rao (Relief)", "role": UserRole.COORDINATOR, "phone": "+91 98200 99001"},
            {"email": "admin@resqgrid.org", "name": "ResQGrid System Admin", "role": UserRole.ADMIN, "phone": "+91 98200 00000"},
        ]

        created_users = {}
        for u in users_data:
            existing = (await db.execute(select(User).where(User.email == u["email"]))).scalar_one_or_none()
            if not existing:
                user = User(
                    email=u["email"],
                    password_hash=hash_password("Emergency@2026"),
                    full_name=u["name"],
                    role=u["role"],
                    phone=u["phone"],
                    is_active=True,
                )
                db.add(user)
                await db.flush()
                created_users[u["email"]] = user
            else:
                created_users[u["email"]] = existing

        # 2. Seed Response Teams across Mumbai
        teams_data = [
            {
                "name": "Bandra Water Rescue Alpha",
                "team_type": TeamType.WATER_RESCUE,
                "status": TeamStatus.AVAILABLE,
                "capacity": 12,
                "base_location_name": "Bandra West Coastal Post",
                "lat": 19.0596,
                "lon": 72.8402,
                "phone": "+91 22 2640 1111",
                "qualifications": ["WATER_RESCUE", "BOAT_OPERATOR", "SWIFT_WATER"],
            },
            {
                "name": "Kurla Rapid Evacuation Beta",
                "team_type": TeamType.GENERAL_EVACUATION,
                "status": TeamStatus.AVAILABLE,
                "capacity": 15,
                "base_location_name": "Kurla Depot Station",
                "lat": 19.0726,
                "lon": 72.8845,
                "phone": "+91 22 2650 2222",
                "qualifications": ["EVACUATION", "HEAVY_RESCUE", "LOGISTICS"],
            },
            {
                "name": "Dadar Trauma Medical Unit 1",
                "team_type": TeamType.MEDICAL,
                "status": TeamStatus.AVAILABLE,
                "capacity": 8,
                "base_location_name": "Dadar Emergency Medical Center",
                "lat": 19.0178,
                "lon": 72.8478,
                "phone": "+91 22 2410 3333",
                "qualifications": ["PARAMEDIC", "TRAUMA_CARE", "FIRST_AID"],
            },
            {
                "name": "Andheri Fire & Hazmat Team",
                "team_type": TeamType.FIREFIGHTING,
                "status": TeamStatus.AVAILABLE,
                "capacity": 10,
                "base_location_name": "Andheri East Fire Station",
                "lat": 19.1136,
                "lon": 72.8697,
                "phone": "+91 22 2830 4444",
                "qualifications": ["FIRE_SUPPRESSION", "HAZMAT", "EXTRICATION"],
            },
            {
                "name": "Colaba Coastal Distribution Squad",
                "team_type": TeamType.RELIEF_DISTRIBUTION,
                "status": TeamStatus.AVAILABLE,
                "capacity": 20,
                "base_location_name": "Colaba Municipal Warehouse",
                "lat": 18.9067,
                "lon": 72.8147,
                "phone": "+91 22 2210 5555",
                "qualifications": ["LOGISTICS", "FOOD_SAFETY", "DISTRIBUTION"],
            },
        ]

        created_teams = []
        for t in teams_data:
            existing = (await db.execute(select(ResponseTeam).where(ResponseTeam.name == t["name"]))).scalar_one_or_none()
            if not existing:
                team = ResponseTeam(
                    name=t["name"],
                    team_type=t["team_type"],
                    status=t["status"],
                    capacity=t["capacity"],
                    base_location_name=t["base_location_name"],
                    base_latitude=t["lat"],
                    base_longitude=t["lon"],
                    current_latitude=t["lat"],
                    current_longitude=t["lon"],
                    contact_phone=t["phone"],
                    qualifications=t["qualifications"],
                )
                db.add(team)
                await db.flush()
                created_teams.append(team)
            else:
                existing.status = t["status"]
                existing.active_assignments_count = 0
                created_teams.append(existing)

        # Link responder user to teams
        responder_user = created_users.get("responder@resqgrid.org")
        if responder_user and created_teams:
            for team in created_teams:
                team_member_existing = (
                    await db.execute(
                        select(TeamMember).where(
                            TeamMember.team_id == team.id,
                            TeamMember.user_id == responder_user.id,
                        )
                    )
                ).scalar_one_or_none()
                if not team_member_existing:
                    db.add(
                        TeamMember(
                            team_id=team.id,
                            user_id=responder_user.id,
                            role_in_team="LEADER",
                        )
                    )

        # 3. Seed Depots and Shelters
        depots_data = [
            {"name": "Dadar Central Relief Hub", "loc": "Dadar Central", "lat": 19.0178, "lon": 72.8478, "type": DepotType.CENTRAL_DEPOT},
            {"name": "Kurla West Rapid Supply Depot", "loc": "Kurla West", "lat": 19.0726, "lon": 72.8845, "type": DepotType.MOBILE_HUB},
            {"name": "Andheri Disaster Logistics Center", "loc": "Andheri West", "lat": 19.1136, "lon": 72.8697, "type": DepotType.CENTRAL_DEPOT},
        ]
        created_depots = []
        for d in depots_data:
            existing = (await db.execute(select(Depot).where(Depot.name == d["name"]))).scalar_one_or_none()
            if not existing:
                depot = Depot(
                    name=d["name"],
                    location_name=d["loc"],
                    depot_type=d["type"],
                    latitude=d["lat"],
                    longitude=d["lon"],
                    manager_name="Municipal Coordination Cell",
                )
                db.add(depot)
                await db.flush()
                created_depots.append(depot)
            else:
                created_depots.append(existing)

        shelters_data = [
            {"name": "Dharavi Municipal Relief Shelter", "loc": "Dharavi Sector 5", "lat": 19.0434, "lon": 72.8567, "cap": 250, "occ": 65},
            {"name": "Sion Community Emergency Shelter", "loc": "Sion East", "lat": 19.0390, "lon": 72.8619, "cap": 180, "occ": 42},
            {"name": "Parel Hospital Transit Shelter", "loc": "Parel", "lat": 19.0028, "lon": 72.8423, "cap": 120, "occ": 95},
        ]
        for s in shelters_data:
            existing = (await db.execute(select(Shelter).where(Shelter.name == s["name"]))).scalar_one_or_none()
            if not existing:
                db.add(
                    Shelter(
                        name=s["name"],
                        location_name=s["loc"],
                        latitude=s["lat"],
                        longitude=s["lon"],
                        capacity_people=s["cap"],
                        current_occupancy=s["occ"],
                        status="OPERATIONAL",
                        contact_person="Civic Shelter Supervisor",
                    )
                )

        # 4. Seed Inventory Catalog & Depot Stock
        items_data = [
            {"sku": "WAT-500", "name": "Bottled Mineral Water (20L Jerrycan)", "cat": ItemCategory.WATER, "unit": "cans"},
            {"sku": "RAT-MRE", "name": "High-Calorie Ready-to-Eat Meal Rations", "cat": ItemCategory.FOOD_RATION, "unit": "packs"},
            {"sku": "MED-KIT", "name": "Emergency Trauma First Aid Kit", "cat": ItemCategory.MEDICAL_KIT, "unit": "kits"},
            {"sku": "RES-VAK", "name": "Swiftwater Lifejacket & Harness", "cat": ItemCategory.RESCUE_GEAR, "unit": "vests"},
            {"sku": "BLK-THM", "name": "Thermal Emergency Blankets", "cat": ItemCategory.BLANKET, "unit": "units"},
            {"sku": "GEN-5KW", "name": "Portable Gas Power Generator (5kW)", "cat": ItemCategory.POWER_GENERATOR, "unit": "units"},
        ]
        created_items = []
        for i in items_data:
            existing = (await db.execute(select(InventoryItem).where(InventoryItem.sku == i["sku"]))).scalar_one_or_none()
            if not existing:
                item = InventoryItem(
                    sku=i["sku"],
                    name=i["name"],
                    category=i["cat"],
                    unit=i["unit"],
                    description="Standard emergency response resource",
                )
                db.add(item)
                await db.flush()
                created_items.append(item)
            else:
                created_items.append(existing)

        # Populate varied stocks across depots with realistic differences, reservations, and low-stock alerts
        # Stock distribution plan:
        # - Dadar Central Relief Hub (Primary hub): high stock levels, some reserved for active logistics
        # - Kurla West Rapid Supply Depot (Mithi River frontline): high water/rescue gear, low blankets/generators (triggering alert)
        # - Andheri Disaster Logistics Center (Western Suburbs): moderate stock levels, active medical cache
        depot_stock_profiles = {
            "Dadar Central Relief Hub": {
                "WAT-500": {"avail": 420, "res": 80, "min": 50},
                "RAT-MRE": {"avail": 310, "res": 40, "min": 50},
                "MED-KIT": {"avail": 65, "res": 15, "min": 20},
                "RES-VAK": {"avail": 52, "res": 18, "min": 20},
                "BLK-THM": {"avail": 180, "res": 20, "min": 30},
                "GEN-5KW": {"avail": 14, "res": 2, "min": 5},
            },
            "Kurla West Rapid Supply Depot": {
                "WAT-500": {"avail": 140, "res": 60, "min": 40},
                "RAT-MRE": {"avail": 95, "res": 25, "min": 30},
                "MED-KIT": {"avail": 28, "res": 12, "min": 15},
                "RES-VAK": {"avail": 48, "res": 22, "min": 20},
                "BLK-THM": {"avail": 12, "res": 0, "min": 25},   # LOW STOCK ALERT (< min threshold 25)
                "GEN-5KW": {"avail": 6, "res": 1, "min": 5},      # Available >= 5 for assignment, close to min threshold
            },
            "Andheri Disaster Logistics Center": {
                "WAT-500": {"avail": 260, "res": 40, "min": 40},
                "RAT-MRE": {"avail": 180, "res": 20, "min": 30},
                "MED-KIT": {"avail": 45, "res": 10, "min": 15},
                "RES-VAK": {"avail": 35, "res": 5, "min": 15},
                "BLK-THM": {"avail": 90, "res": 10, "min": 25},
                "GEN-5KW": {"avail": 8, "res": 2, "min": 4},
            },
        }

        for depot in created_depots:
            profile = depot_stock_profiles.get(depot.name, {})
            for item in created_items:
                item_spec = profile.get(item.sku, {"avail": 50, "res": 0, "min": 15})
                avail_qty = item_spec["avail"]
                res_qty = item_spec["res"]
                min_thresh = item_spec["min"]
                tot_qty = avail_qty + res_qty

                stock_existing = (
                    await db.execute(
                        select(InventoryStock).where(
                            InventoryStock.depot_id == depot.id,
                            InventoryStock.item_id == item.id,
                        )
                    )
                ).scalar_one_or_none()
                if not stock_existing:
                    db.add(
                        InventoryStock(
                            depot_id=depot.id,
                            item_id=item.id,
                            quantity_available=avail_qty,
                            quantity_reserved=res_qty,
                            quantity_total=tot_qty,
                            minimum_threshold=min_thresh,
                        )
                    )
                else:
                    stock_existing.quantity_available = avail_qty
                    stock_existing.quantity_reserved = res_qty
                    stock_existing.quantity_total = tot_qty
                    stock_existing.minimum_threshold = min_thresh

        # 5. Seed Flagship Demonstration Incident (Mumbai Urban Flood Rescue #INC-1042)
        flagship_existing = (await db.execute(select(Incident).where(Incident.tracking_id == "INC-1042"))).scalar_one_or_none()
        if not flagship_existing:
            citizen = created_users.get("citizen@resqgrid.org")
            p_data = calculate_priority_score(
                severity=IncidentSeverity.CRITICAL,
                affected_people=12,
                category=IncidentCategory.FLOOD,
                created_at=datetime.now(timezone.utc) - timedelta(minutes=25),
            )
            flagship = Incident(
                tracking_id="INC-1042",
                title="Severe Waterlogging & 12 Citizens Stranded Near Mithi River",
                description="Flood water entering residential ground floor. 12 people stranded including 3 senior citizens and 2 infants. Immediate watercraft rescue needed.",
                category=IncidentCategory.FLOOD,
                severity=IncidentSeverity.CRITICAL,
                status=IncidentStatus.REPORTED,
                affected_people=12,
                latitude=19.0726,
                longitude=72.8845,
                address="Near Kranti Nagar Bridge, Kurla West, Mumbai 400070",
                reporter_id=citizen.id if citizen else None,
                reporter_phone="+91 98200 11223",
                is_simulated=True,
                priority_score=p_data["total_score"],
                priority_breakdown=p_data,
            )
            db.add(flagship)
            await db.flush()

            db.add(
                IncidentEvent(
                    incident_id=flagship.id,
                    previous_status=None,
                    new_status=IncidentStatus.REPORTED,
                    actor_id=citizen.id if citizen else None,
                    comment="Simulated citizen incident reported from Kurla flood zone.",
                )
            )
        else:
            flagship_existing.status = IncidentStatus.REPORTED
            flagship_existing.is_escalated = False
            flagship_existing.escalation_reason = None
            flagship_existing.escalated_at = None
            flagship_existing.escalation_resolved_at = None

        # 6. Additional diverse incidents across Mumbai
        additional_incidents = [
            {
                "tracking_id": "INC-2041",
                "title": "Hindmata Flyover Traffic Inundation & Medical Emergency",
                "description": "Ambulance carrying patient trapped in 3.5ft water on Dr. Ambedkar Road. Driver requests towing and paramedic triage.",
                "category": IncidentCategory.MEDICAL,
                "severity": IncidentSeverity.CRITICAL,
                "affected": 4,
                "lat": 19.0178,
                "lon": 72.8478,
                "address": "Hindmata Junction, Dadar East, Mumbai",
            },
            {
                "tracking_id": "INC-3088",
                "title": "Building Compound Wall Collapse Alert",
                "description": "Retaining wall near transit camp weakened by heavy monsoon downpour. Precautionary evacuation requested.",
                "category": IncidentCategory.COLLAPSE,
                "severity": IncidentSeverity.HIGH,
                "affected": 24,
                "lat": 19.0434,
                "lon": 72.8567,
                "address": "90 Feet Road, Dharavi Sector 5, Mumbai",
            },
            {
                "tracking_id": "INC-4102",
                "title": "Drinking Water & Ration Shortage in Transit Shelter",
                "description": "Relief camp hosting 80 evacuated residents exhausted clean drinking water supplies. Urgent replenishment required.",
                "category": IncidentCategory.SUPPLIES,
                "severity": IncidentSeverity.HIGH,
                "affected": 80,
                "lat": 19.0390,
                "lon": 72.8619,
                "address": "Municipal School Relief Camp, Sion Circle, Mumbai",
            },
        ]
        for inc_info in additional_incidents:
            existing_inc = (await db.execute(select(Incident).where(Incident.tracking_id == inc_info["tracking_id"]))).scalar_one_or_none()
            if not existing_inc:
                p_info = calculate_priority_score(
                    severity=inc_info["severity"],
                    affected_people=inc_info["affected"],
                    category=inc_info["category"],
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=40),
                )
                inc_obj = Incident(
                    tracking_id=inc_info["tracking_id"],
                    title=inc_info["title"],
                    description=inc_info["description"],
                    category=inc_info["category"],
                    severity=inc_info["severity"],
                    status=IncidentStatus.REPORTED,
                    affected_people=inc_info["affected"],
                    latitude=inc_info["lat"],
                    longitude=inc_info["lon"],
                    address=inc_info["address"],
                    is_simulated=True,
                    priority_score=p_info["total_score"],
                    priority_breakdown=p_info,
                )
                db.add(inc_obj)
                await db.flush()
                db.add(
                    IncidentEvent(
                        incident_id=inc_obj.id,
                        new_status=IncidentStatus.REPORTED,
                        comment="Initial simulation report generated.",
                    )
                )
            else:
                existing_inc.status = IncidentStatus.REPORTED
                existing_inc.is_escalated = False
                existing_inc.escalation_reason = None
                existing_inc.escalated_at = None
                existing_inc.escalation_resolved_at = None

        await db.commit()
        print("ResQGrid seed data created successfully!")


if __name__ == "__main__":
    asyncio.run(seed_all())

