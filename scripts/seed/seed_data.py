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
    AssignmentStatus,
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
        team_map = {}
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
                team_map[team.name] = team
            else:
                existing.status = t["status"]
                existing.active_assignments_count = 0
                created_teams.append(existing)
                team_map[existing.name] = existing

        # Link responder user to teams
        responder_user = created_users.get("responder@resqgrid.org")
        operator_user = created_users.get("operator@resqgrid.org")
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

        # 5. Seed Comprehensive Incidents Across Mumbai Wards
        now = datetime.now(timezone.utc)
        dispatcher_id = operator_user.id if operator_user else None

        incidents_dataset = [
            # Flagship Open Incidents (Immediate Action in Command Center)
            {
                "tracking_id": "INC-1042",
                "title": "Severe Waterlogging & 12 Citizens Stranded Near Mithi River",
                "description": "Flood water entering residential ground floor. 12 people stranded including 3 senior citizens and 2 infants. Immediate watercraft rescue needed.",
                "category": IncidentCategory.FLOOD,
                "severity": IncidentSeverity.CRITICAL,
                "status": IncidentStatus.REPORTED,
                "affected": 12,
                "lat": 19.0726,
                "lon": 72.8845,
                "address": "Near Kranti Nagar Bridge, Kurla West (Ward L)",
                "dt_mins": 25,
                "score": 77.2,
                "team": None,
                "resolved": False,
            },
            {
                "tracking_id": "INC-2041",
                "title": "Hindmata Flyover Traffic Inundation & Medical Emergency",
                "description": "Ambulance carrying patient trapped in 3.5ft water on Dr. Ambedkar Road. Driver requests towing and paramedic triage.",
                "category": IncidentCategory.MEDICAL,
                "severity": IncidentSeverity.CRITICAL,
                "status": IncidentStatus.REPORTED,
                "affected": 4,
                "lat": 19.0178,
                "lon": 72.8478,
                "address": "Hindmata Junction, Dadar East (Ward F/N)",
                "dt_mins": 40,
                "score": 80.6,
                "team": None,
                "resolved": False,
            },
            {
                "tracking_id": "INC-3088",
                "title": "Building Compound Wall Collapse Alert",
                "description": "Retaining wall near transit camp weakened by heavy monsoon downpour. Precautionary evacuation requested.",
                "category": IncidentCategory.COLLAPSE,
                "severity": IncidentSeverity.HIGH,
                "status": IncidentStatus.VERIFIED,
                "affected": 24,
                "lat": 19.0434,
                "lon": 72.8567,
                "address": "90 Feet Road, Dharavi Sector 5 (Ward G/N)",
                "dt_mins": 55,
                "score": 74.9,
                "team": None,
                "resolved": False,
            },
            {
                "tracking_id": "INC-4102",
                "title": "Drinking Water & Ration Shortage in Transit Shelter",
                "description": "Relief camp hosting 80 evacuated residents exhausted clean drinking water supplies. Urgent replenishment required.",
                "category": IncidentCategory.SUPPLIES,
                "severity": IncidentSeverity.HIGH,
                "status": IncidentStatus.REPORTED,
                "affected": 80,
                "lat": 19.0390,
                "lon": 72.8619,
                "address": "Municipal School Relief Camp, Sion Circle (Ward F/N)",
                "dt_mins": 70,
                "score": 77.3,
                "team": None,
                "resolved": False,
            },

            # In Progress / Active Dispatches
            {
                "tracking_id": "INC-3092",
                "title": "Mahim Causeway Slum Evacuation",
                "description": "High tide storm surge entering low-lying squatter settlement near Mahim creek.",
                "category": IncidentCategory.EVACUATION,
                "severity": IncidentSeverity.MEDIUM,
                "status": IncidentStatus.IN_PROGRESS,
                "affected": 35,
                "lat": 19.0480,
                "lon": 72.8420,
                "address": "Mahim Causeway Coastal Front (Ward G/N)",
                "dt_mins": 85,
                "score": 64.2,
                "team": "Bandra Water Rescue Alpha",
                "resolved": False,
                "resp_mins": 14.0,
            },
            {
                "tracking_id": "INC-5011",
                "title": "Kalanagar Slum Wall Structural Crack",
                "description": "Fissures appearing along foundation following continuous 120mm rainfall.",
                "category": IncidentCategory.COLLAPSE,
                "severity": IncidentSeverity.MEDIUM,
                "status": IncidentStatus.ACCEPTED,
                "affected": 12,
                "lat": 19.0580,
                "lon": 72.8510,
                "address": "Kalanagar, Bandra East (Ward H/E)",
                "dt_mins": 45,
                "score": 58.0,
                "team": "Kurla Rapid Evacuation Beta",
                "resolved": False,
                "resp_mins": 16.5,
            },

            # Historical Resolved Incidents with Full Audit Timestamps (Powers Real Histograms & KPIs)
            {
                "tracking_id": "INC-1050",
                "title": "Bail Bazaar Underpass Inundation",
                "category": IncidentCategory.FLOOD,
                "severity": IncidentSeverity.CRITICAL,
                "status": IncidentStatus.RESOLVED,
                "affected": 18,
                "lat": 19.0701,
                "lon": 72.8890,
                "address": "Bail Bazaar, Kurla West (Ward L)",
                "dt_mins": 180,
                "score": 86.4,
                "team": "Kurla Rapid Evacuation Beta",
                "resolved": True,
                "resp_mins": 14.2,
            },
            {
                "tracking_id": "INC-1051",
                "title": "Kamani Junction Waterlogging",
                "category": IncidentCategory.FLOOD,
                "severity": IncidentSeverity.HIGH,
                "status": IncidentStatus.RESOLVED,
                "affected": 8,
                "lat": 19.0750,
                "lon": 72.8820,
                "address": "Kamani Oil Mills, Kurla (Ward L)",
                "dt_mins": 240,
                "score": 72.1,
                "team": "Kurla Rapid Evacuation Beta",
                "resolved": True,
                "resp_mins": 19.5,
            },
            {
                "tracking_id": "INC-1052",
                "title": "Nehru Nagar Power Transformer Spark",
                "category": IncidentCategory.FIRE,
                "severity": IncidentSeverity.HIGH,
                "status": IncidentStatus.RESOLVED,
                "affected": 15,
                "lat": 19.0610,
                "lon": 72.8820,
                "address": "Nehru Nagar, Kurla East (Ward L)",
                "dt_mins": 300,
                "score": 68.3,
                "team": "Andheri Fire & Hazmat Team",
                "resolved": True,
                "resp_mins": 16.0,
            },
            {
                "tracking_id": "INC-2045",
                "title": "Five Gardens Fallen Tree Blocking Road",
                "category": IncidentCategory.COLLAPSE,
                "severity": IncidentSeverity.MEDIUM,
                "status": IncidentStatus.RESOLVED,
                "affected": 3,
                "lat": 19.0230,
                "lon": 72.8520,
                "address": "Five Gardens, Dadar (Ward F/N)",
                "dt_mins": 120,
                "score": 52.0,
                "team": "Dadar Trauma Medical Unit 1",
                "resolved": True,
                "resp_mins": 24.1,
            },
            {
                "tracking_id": "INC-2046",
                "title": "Gandhi Market Water Level 3ft",
                "category": IncidentCategory.FLOOD,
                "severity": IncidentSeverity.CRITICAL,
                "status": IncidentStatus.RESOLVED,
                "affected": 22,
                "lat": 19.0320,
                "lon": 72.8590,
                "address": "Gandhi Market, Kings Circle (Ward F/N)",
                "dt_mins": 360,
                "score": 88.5,
                "team": "Bandra Water Rescue Alpha",
                "resolved": True,
                "resp_mins": 12.8,
            },
            {
                "tracking_id": "INC-2047",
                "title": "Dadar Flower Market Crowd Surge",
                "category": IncidentCategory.MEDICAL,
                "severity": IncidentSeverity.HIGH,
                "status": IncidentStatus.RESOLVED,
                "affected": 14,
                "lat": 19.0190,
                "lon": 72.8430,
                "address": "Senapati Bapat Marg, Dadar West (Ward G/N)",
                "dt_mins": 400,
                "score": 76.0,
                "team": "Dadar Trauma Medical Unit 1",
                "resolved": True,
                "resp_mins": 15.3,
            },
            {
                "tracking_id": "INC-3091",
                "title": "Dharavi Kumbharwada Smoke Inhalation",
                "category": IncidentCategory.FIRE,
                "severity": IncidentSeverity.HIGH,
                "status": IncidentStatus.RESOLVED,
                "affected": 9,
                "lat": 19.0410,
                "lon": 72.8540,
                "address": "Kumbharwada, Dharavi (Ward G/N)",
                "dt_mins": 150,
                "score": 71.4,
                "team": "Andheri Fire & Hazmat Team",
                "resolved": True,
                "resp_mins": 17.6,
            },
            {
                "tracking_id": "INC-5010",
                "title": "BKC Diamond Bourse Basement Flooding",
                "category": IncidentCategory.FLOOD,
                "severity": IncidentSeverity.HIGH,
                "status": IncidentStatus.RESOLVED,
                "affected": 10,
                "lat": 19.0650,
                "lon": 72.8680,
                "address": "G Block, BKC (Ward H/E)",
                "dt_mins": 220,
                "score": 73.5,
                "team": "Bandra Water Rescue Alpha",
                "resolved": True,
                "resp_mins": 18.0,
            },
            {
                "tracking_id": "INC-6012",
                "title": "Saki Naka Metro Station Storm Drain Choke",
                "category": IncidentCategory.FLOOD,
                "severity": IncidentSeverity.MEDIUM,
                "status": IncidentStatus.RESOLVED,
                "affected": 16,
                "lat": 19.1020,
                "lon": 72.8870,
                "address": "Saki Naka Junction, Andheri East (Ward K/E)",
                "dt_mins": 310,
                "score": 61.2,
                "team": "Andheri Fire & Hazmat Team",
                "resolved": True,
                "resp_mins": 22.4,
            },
            {
                "tracking_id": "INC-6013",
                "title": "Marol Industrial Estate Chemical Spill",
                "category": IncidentCategory.FIRE,
                "severity": IncidentSeverity.CRITICAL,
                "status": IncidentStatus.RESOLVED,
                "affected": 7,
                "lat": 19.1180,
                "lon": 72.8830,
                "address": "Marol MIDC, Andheri East (Ward K/E)",
                "dt_mins": 450,
                "score": 89.1,
                "team": "Andheri Fire & Hazmat Team",
                "resolved": True,
                "resp_mins": 11.5,
            },
            {
                "tracking_id": "INC-7014",
                "title": "Sassoon Docks High Tide Inflow",
                "category": IncidentCategory.FLOOD,
                "severity": IncidentSeverity.LOW,
                "status": IncidentStatus.RESOLVED,
                "affected": 5,
                "lat": 18.9130,
                "lon": 72.8230,
                "address": "Sassoon Docks, Colaba (Ward A)",
                "dt_mins": 500,
                "score": 38.0,
                "team": "Colaba Coastal Distribution Squad",
                "resolved": True,
                "resp_mins": 28.0,
            },
            {
                "tracking_id": "INC-7015",
                "title": "Cuffe Parade Fisherman Community Relief",
                "category": IncidentCategory.SUPPLIES,
                "severity": IncidentSeverity.LOW,
                "status": IncidentStatus.RESOLVED,
                "affected": 40,
                "lat": 18.9100,
                "lon": 72.8180,
                "address": "Cuffe Parade Machhimar Nagar (Ward A)",
                "dt_mins": 540,
                "score": 44.5,
                "team": "Colaba Coastal Distribution Squad",
                "resolved": True,
                "resp_mins": 26.5,
            },
        ]

        for s in incidents_dataset:
            created_at = now - timedelta(minutes=s["dt_mins"])
            resp_mins = s.get("resp_mins")
            updated_at = created_at + timedelta(minutes=resp_mins or 15)

            p_breakdown = {"total_score": s["score"], "severity_weight": 0.4, "impact_weight": 0.3}

            inc = Incident(
                tracking_id=s["tracking_id"],
                title=s["title"],
                description=s.get("description", f"{s['title']} emergency operation handled by ResQGrid automated dispatch."),
                category=s["category"],
                severity=s["severity"],
                status=s["status"],
                affected_people=s["affected"],
                latitude=s["lat"],
                longitude=s["lon"],
                address=s["address"],
                priority_score=s["score"],
                priority_breakdown=p_breakdown,
                is_simulated=False,
                created_at=created_at,
                updated_at=updated_at,
            )
            db.add(inc)
            await db.flush()

            # Lifecycle audit trail
            db.add(IncidentEvent(incident_id=inc.id, new_status=IncidentStatus.REPORTED, created_at=created_at))
            if s["status"] != IncidentStatus.REPORTED:
                db.add(IncidentEvent(incident_id=inc.id, new_status=IncidentStatus.VERIFIED, created_at=created_at + timedelta(minutes=3)))
            if s["status"] in [IncidentStatus.ASSIGNED, IncidentStatus.ACCEPTED, IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED]:
                db.add(IncidentEvent(incident_id=inc.id, new_status=IncidentStatus.ASSIGNED, created_at=created_at + timedelta(minutes=6)))
            if s["status"] in [IncidentStatus.ACCEPTED, IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED]:
                db.add(IncidentEvent(incident_id=inc.id, new_status=IncidentStatus.ACCEPTED, created_at=created_at + timedelta(minutes=8)))
            if s["status"] in [IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED]:
                db.add(IncidentEvent(incident_id=inc.id, new_status=IncidentStatus.IN_PROGRESS, created_at=created_at + timedelta(minutes=10)))
            if s["status"] == IncidentStatus.RESOLVED:
                db.add(IncidentEvent(incident_id=inc.id, new_status=IncidentStatus.RESOLVED, created_at=updated_at + timedelta(minutes=30)))

            # Assignments
            team_obj = team_map.get(s.get("team"))
            if team_obj and dispatcher_id:
                asg_status = AssignmentStatus.COMPLETED if s["resolved"] else AssignmentStatus.EN_ROUTE
                asg = Assignment(
                    incident_id=inc.id,
                    team_id=team_obj.id,
                    assigned_by=dispatcher_id,
                    status=asg_status,
                    assigned_at=created_at + timedelta(minutes=6),
                    accepted_at=created_at + timedelta(minutes=8),
                    en_route_at=created_at + timedelta(minutes=10),
                    on_scene_at=created_at + timedelta(minutes=resp_mins or 15),
                    completed_at=(created_at + timedelta(minutes=(resp_mins or 15) + 30)) if s["resolved"] else None,
                    created_at=created_at + timedelta(minutes=6),
                )
                db.add(asg)

        await db.commit()
        print("ResQGrid seed data created successfully with full historical telemetry!")


if __name__ == "__main__":
    asyncio.run(seed_all())
