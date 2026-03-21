"""
seed.py — run once to populate the database with:
  - 5 campus blocks
  - appliance data per block
  - energy readings from the CSV dataset (Jan 06–12 2025)
  - initial admin user from .env

Usage:
    python seed.py
"""

import os
from datetime import date
from sqlmodel import Session, select
from database import engine, create_db_and_tables, get_settings
from models import User, Block, Appliance, EnergyReading, BillingRecord
from auth import hash_password

settings = get_settings()

# ── Block definitions (matches WW.blocks in shared.js) ────
BLOCKS = [
    {"code": "G-H",   "label": "Girls Hostel",   "icon": "fa-venus",            "rate_per_kwh": 8.5},
    {"code": "B-H",   "label": "Boys Hostel",     "icon": "fa-mars",             "rate_per_kwh": 8.5},
    {"code": "AB1",   "label": "Academic Blk 1",  "icon": "fa-building-columns", "rate_per_kwh": 8.5},
    {"code": "AB2",   "label": "Academic Blk 2",  "icon": "fa-building",         "rate_per_kwh": 8.5},
    {"code": "ADMIN", "label": "Admin Block",     "icon": "fa-landmark",         "rate_per_kwh": 8.5},
]

# ── Appliances per block ───────────────────────────────────
APPLIANCES = {
    "G-H": [
        ("AC",           2000, 9.0,  18.0),
        ("Geyser",       2000, 9.0,  18.0),
        ("Power Socket", 500,  9.0,  4.5),
        ("Sockets",      150,  9.0,  1.35),
        ("Fan",          50,   9.0,  0.45),
        ("Tubelights",   40,   9.0,  0.36),
        ("Bulbs",        16,   9.0,  0.16),
    ],
    "B-H": [
        ("AC",           2000, 9.0,  18.0),
        ("Geyser",       2000, 9.0,  18.0),
        ("Power Socket", 500,  9.0,  4.5),
        ("Sockets",      150,  9.0,  1.35),
        ("Fan",          50,   9.0,  0.45),
        ("Tubelights",   40,   9.0,  0.36),
        ("Bulbs",        16,   9.0,  0.16),
    ],
    "AB1": [
        ("PCs",          500,  7.5,  3.75),
        ("ACs",          2000, 7.5,  15.0),
        ("AC",           1800, 7.5,  13.5),
        ("Fans",         50,   7.5,  0.375),
        ("Tube lights",  40,   7.5,  0.3),
        ("Smart board",  150,  7.5,  1.125),
        ("Sockets",      200,  7.5,  1.5),
        ("Smartboard",   120,  7.5,  0.9),
    ],
    "AB2": [
        ("PCs",          500,  7.5,  3.75),
        ("ACs",          2000, 7.5,  15.0),
        ("AC",           1800, 7.5,  13.5),
        ("Smartboards",  150,  7.5,  1.125),
        ("Smartboard",   120,  7.5,  0.9),
        ("Sockets",      200,  7.5,  1.5),
        ("Fans",         50,   7.5,  0.375),
    ],
    "ADMIN": [
        ("ACs",          2000, 9.2,  18.4),
        ("AC",           1800, 9.2,  16.56),
        ("PCs",          500,  9.2,  4.6),
        ("PC",           500,  9.2,  4.6),
        ("Sockets",      200,  9.2,  1.84),
        ("Smartboards",  150,  9.2,  1.38),
        ("Projector",    300,  9.2,  2.76),
        ("Fan",          50,   9.2,  0.46),
        ("LED TV",       120,  9.2,  1.104),
        ("Projector Screen", 30, 9.2, 0.276),
        ("Mic Stand",    15,   9.2,  0.138),
    ],
}

# ── Energy readings Jan 06–12 2025 ────────────────────────
READINGS = {
    "G-H":   [85.64, 85.64, 85.64, 85.64, 85.64, 85.64, 85.64],
    "B-H":   [85.64, 85.64, 85.64, 85.64, 85.64, 85.64, 85.64],
    "AB1":   [177.3,  45.0, 177.3,  45.0, 177.3,   0.0,   0.0],
    "AB2":   [396.0,  23.4, 396.0,  23.4, 396.0,   0.0,   0.0],
    "ADMIN": [322.47, 91.62, 322.47, 91.62, 322.47, 0.0,  0.0],
}

DATES = [
    (date(2025, 1, 6),  "Monday",    False),
    (date(2025, 1, 7),  "Tuesday",   False),
    (date(2025, 1, 8),  "Wednesday", False),
    (date(2025, 1, 9),  "Thursday",  False),
    (date(2025, 1, 10), "Friday",    False),
    (date(2025, 1, 11), "Saturday",  True),
    (date(2025, 1, 12), "Sunday",    True),
]


def seed():
    print("Creating tables...")
    create_db_and_tables()

    with Session(engine) as session:

        # ── Admin user ─────────────────────────────────────
        admin_username = settings.ADMIN_USERNAME.lower()
        existing_admin = session.exec(
            select(User).where(User.username == admin_username)
        ).first()

        if not existing_admin:
            admin = User(
                username=admin_username,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role="admin",
            )
            session.add(admin)
            session.commit()
            print(f"Created admin user: {admin_username}")
        else:
            print(f"Admin user already exists: {admin_username}")

        # ── Blocks ─────────────────────────────────────────
        block_map: dict[str, Block] = {}

        for b in BLOCKS:
            existing = session.exec(
                select(Block).where(Block.code == b["code"])
            ).first()
            if not existing:
                block = Block(**b)
                session.add(block)
                session.commit()
                session.refresh(block)
                block_map[b["code"]] = block
                print(f"Created block: {b['code']}")
            else:
                block_map[b["code"]] = existing
                print(f"Block already exists: {b['code']}")

        # ── Appliances ─────────────────────────────────────
        for code, apps in APPLIANCES.items():
            block = block_map[code]
            existing_apps = session.exec(
                select(Appliance).where(Appliance.block_id == block.id)
            ).all()
            if existing_apps:
                print(f"Appliances already seeded for {code}")
                continue
            for name, watts, hours, kwh in apps:
                session.add(Appliance(
                    block_id=block.id,
                    name=name,
                    power_watts=watts,
                    duration_hours=hours,
                    energy_kwh=kwh,
                ))
            session.commit()
            print(f"Seeded appliances for {code}")

        # ── Energy readings ─────────────────────────────────
        for code, daily_values in READINGS.items():
            block = block_map[code]
            for i, (reading_date, day_of_week, is_weekend) in enumerate(DATES):
                existing = session.exec(
                    select(EnergyReading).where(
                        EnergyReading.block_id == block.id,
                        EnergyReading.reading_date == reading_date,
                    )
                ).first()
                if existing:
                    continue
                session.add(EnergyReading(
                    block_id=block.id,
                    reading_date=reading_date,
                    day_of_week=day_of_week,
                    is_weekend=is_weekend,
                    total_kwh=daily_values[i],
                ))
            session.commit()
            print(f"Seeded readings for {code}")

        # ── Billing records ────────────────────────────────
        period_start = date(2025, 1, 6)
        period_end   = date(2025, 1, 12)

        for code, daily_values in READINGS.items():
            block = block_map[code]
            existing_bill = session.exec(
                select(BillingRecord).where(
                    BillingRecord.block_id == block.id,
                    BillingRecord.period_start == period_start,
                )
            ).first()
            if existing_bill:
                print(f"Billing record already exists for {code}")
                continue
            total_kwh = sum(daily_values)
            session.add(BillingRecord(
                block_id=block.id,
                period_start=period_start,
                period_end=period_end,
                total_kwh=round(total_kwh, 2),
                total_cost_inr=round(total_kwh * block.rate_per_kwh, 2),
            ))
        session.commit()
        print("Seeded billing records")

    print("\nSeed complete!")


if __name__ == "__main__":
    seed()
