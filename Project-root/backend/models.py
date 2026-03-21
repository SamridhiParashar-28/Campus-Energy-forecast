from datetime import date, datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship


# ── Users ──────────────────────────────────────────────────
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(min_length=3, max_length=50, unique=True, index=True)
    hashed_password: str
    role: str = Field(default="viewer")        # "admin" or "viewer"
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    budgets: list["Budget"] = Relationship(back_populates="user")


# ── Blocks ─────────────────────────────────────────────────
class Block(SQLModel, table=True):
    __tablename__ = "blocks"

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)  # e.g. "G-H", "AB1"
    label: str                                  # e.g. "Girls Hostel"
    icon: str                                   # e.g. "fa-venus"
    rate_per_kwh: float = Field(default=8.5)

    readings: list["EnergyReading"] = Relationship(back_populates="block")
    appliances: list["Appliance"] = Relationship(back_populates="block")
    billing_records: list["BillingRecord"] = Relationship(back_populates="block")


# ── Energy Readings ────────────────────────────────────────
class EnergyReading(SQLModel, table=True):
    __tablename__ = "energy_readings"

    id: Optional[int] = Field(default=None, primary_key=True)
    block_id: int = Field(foreign_key="blocks.id", index=True)
    reading_date: date = Field(index=True)
    day_of_week: str                            # "Monday", "Tuesday" etc.
    is_weekend: bool = Field(default=False)
    total_kwh: float = Field(ge=0)             # must be >= 0
    temperature_c: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    block: Optional[Block] = Relationship(back_populates="readings")


# ── Appliances ─────────────────────────────────────────────
class Appliance(SQLModel, table=True):
    __tablename__ = "appliances"

    id: Optional[int] = Field(default=None, primary_key=True)
    block_id: int = Field(foreign_key="blocks.id", index=True)
    name: str
    power_watts: float = Field(ge=0)
    duration_hours: float = Field(ge=0)
    energy_kwh: float = Field(ge=0)

    block: Optional[Block] = Relationship(back_populates="appliances")


# ── Budgets ────────────────────────────────────────────────
class Budget(SQLModel, table=True):
    __tablename__ = "budgets"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    # scope: block code ("G-H", "AB1" etc.) or "TOTAL" for campus-wide
    scope: str = Field(index=True)
    amount_inr: float = Field(gt=0)
    period: str = Field(default="weekly")       # "weekly" or "monthly"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="budgets")


# ── Billing Records ────────────────────────────────────────
class BillingRecord(SQLModel, table=True):
    __tablename__ = "billing_records"

    id: Optional[int] = Field(default=None, primary_key=True)
    block_id: int = Field(foreign_key="blocks.id", index=True)
    period_start: date
    period_end: date
    total_kwh: float = Field(ge=0)
    total_cost_inr: float = Field(ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    block: Optional[Block] = Relationship(back_populates="billing_records")


# ── Token Blacklist (for secure logout) ───────────────────
class TokenBlacklist(SQLModel, table=True):
    __tablename__ = "token_blacklist"

    id: Optional[int] = Field(default=None, primary_key=True)
    jti: str = Field(unique=True, index=True)   # JWT ID — unique per token
    expired_at: datetime                         # when the token would have expired


# ── Pydantic response schemas (never expose hashed_password) ──
class UserRead(SQLModel):
    id: int
    username: str
    role: str
    is_active: bool
    created_at: datetime


class BlockRead(SQLModel):
    id: int
    code: str
    label: str
    icon: str
    rate_per_kwh: float


class EnergyReadingRead(SQLModel):
    id: int
    block_id: int
    reading_date: date
    day_of_week: str
    is_weekend: bool
    total_kwh: float
    temperature_c: Optional[float]


class BudgetRead(SQLModel):
    id: int
    scope: str
    amount_inr: float
    period: str
    updated_at: datetime


class BillingRecordRead(SQLModel):
    id: int
    block_id: int
    period_start: date
    period_end: date
    total_kwh: float
    total_cost_inr: float
