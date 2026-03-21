from datetime import date, datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlmodel import Session, select

from auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    hash_password,
    require_admin,
)
from database import create_db_and_tables, get_session, get_settings
from models import (
    Appliance,
    BillingRecord,
    BillingRecordRead,
    Block,
    BlockRead,
    Budget,
    BudgetRead,
    EnergyReading,
    EnergyReadingRead,
    TokenBlacklist,
    User,
    UserRead,
)

# ── Rate limiter setup ─────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="WattWise API",
    version="2.0.0",
    # Disable docs in production to avoid leaking schema info
    docs_url="/docs" if get_settings().APP_ENV == "development" else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── CORS ───────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,         # required for HttpOnly cookies
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


# ── Security headers middleware ────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' cdn.jsdelivr.net cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' fonts.googleapis.com cdnjs.cloudflare.com; "
        "font-src 'self' fonts.gstatic.com cdnjs.cloudflare.com; "
        "img-src 'self' data:;"
    )
    if settings.APP_ENV == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
    return response


# ── Startup ────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_db_and_tables()


# ══════════════════════════════════════════════════════════
# REQUEST SCHEMAS
# ══════════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=128)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        # Only allow letters, numbers, underscores, hyphens
        import re
        if not re.match(r"^[a-zA-Z0-9_\-]+$", v):
            raise ValueError("Username may only contain letters, numbers, _ and -")
        return v.lower()


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class BudgetRequest(BaseModel):
    scope: str = Field(min_length=1, max_length=20)
    amount_inr: float = Field(gt=0, le=10_000_000)
    period: str = Field(default="weekly")

    @field_validator("period")
    @classmethod
    def valid_period(cls, v: str) -> str:
        if v not in ("weekly", "monthly"):
            raise ValueError("Period must be 'weekly' or 'monthly'")
        return v


class EnergyReadingRequest(BaseModel):
    block_code: str = Field(min_length=1, max_length=20)
    reading_date: date
    day_of_week: str
    is_weekend: bool
    total_kwh: float = Field(ge=0, le=100_000)
    temperature_c: Optional[float] = Field(default=None, ge=-50, le=60)


# ══════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════

@app.post("/auth/register", status_code=201)
@limiter.limit("3/hour")
async def register(
    request: Request,
    body: RegisterRequest,
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(User).where(User.username == body.username)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken.")

    user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
        role="viewer",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"success": True, "message": "Account created.", "username": user.username}


@app.post("/auth/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    session: Session = Depends(get_session),
):
    user = authenticate_user(body.username, body.password, session)
    if not user:
        # Generic message — never reveal whether username exists
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = create_access_token(user.id, user.username, user.role)

    # Store token in HttpOnly cookie — JavaScript cannot read this
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,              # not readable by JS
        secure=settings.APP_ENV == "production",   # HTTPS only in prod
        samesite="strict",          # CSRF protection
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
    )
    return {
        "success": True,
        "message": "Login successful.",
        "username": user.username,
        "role": user.role,
    }


@app.post("/auth/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Blacklist the current token's JTI so it can't be reused
    from auth import decode_token
    token = request.cookies.get("access_token")
    if token:
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti:
                blacklist_entry = TokenBlacklist(
                    jti=jti,
                    expired_at=datetime.fromtimestamp(exp, tz=timezone.utc),
                )
                session.add(blacklist_entry)
                session.commit()
        except Exception:
            pass  # Token already invalid — still clear the cookie

    response.delete_cookie("access_token")
    return {"success": True, "message": "Logged out."}


@app.get("/auth/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ══════════════════════════════════════════════════════════
# BLOCKS ROUTES
# ══════════════════════════════════════════════════════════

@app.get("/blocks", response_model=list[BlockRead])
async def get_blocks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return session.exec(select(Block)).all()


@app.get("/blocks/{code}", response_model=BlockRead)
async def get_block(
    code: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    block = session.exec(select(Block).where(Block.code == code.upper())).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found.")
    return block


# ══════════════════════════════════════════════════════════
# ENERGY READINGS ROUTES
# ══════════════════════════════════════════════════════════

@app.get("/readings", response_model=list[EnergyReadingRead])
async def get_readings(
    block_code: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    query = select(EnergyReading)
    if block_code:
        block = session.exec(
            select(Block).where(Block.code == block_code.upper())
        ).first()
        if block:
            query = query.where(EnergyReading.block_id == block.id)
    if start_date:
        query = query.where(EnergyReading.reading_date >= start_date)
    if end_date:
        query = query.where(EnergyReading.reading_date <= end_date)
    return session.exec(query.order_by(EnergyReading.reading_date)).all()


@app.post("/readings", status_code=201, response_model=EnergyReadingRead)
@limiter.limit("60/minute")
async def create_reading(
    request: Request,
    body: EnergyReadingRequest,
    current_user: User = Depends(require_admin),   # admin only
    session: Session = Depends(get_session),
):
    block = session.exec(
        select(Block).where(Block.code == body.block_code.upper())
    ).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found.")

    reading = EnergyReading(
        block_id=block.id,
        reading_date=body.reading_date,
        day_of_week=body.day_of_week,
        is_weekend=body.is_weekend,
        total_kwh=body.total_kwh,
        temperature_c=body.temperature_c,
    )
    session.add(reading)
    session.commit()
    session.refresh(reading)
    return reading


# ══════════════════════════════════════════════════════════
# BILLING ROUTES
# ══════════════════════════════════════════════════════════

@app.get("/billing", response_model=list[BillingRecordRead])
async def get_billing(
    block_code: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    query = select(BillingRecord)
    if block_code:
        block = session.exec(
            select(Block).where(Block.code == block_code.upper())
        ).first()
        if block:
            query = query.where(BillingRecord.block_id == block.id)
    return session.exec(query.order_by(BillingRecord.period_start.desc())).all()


# ══════════════════════════════════════════════════════════
# BUDGET ROUTES
# ══════════════════════════════════════════════════════════

@app.get("/budgets", response_model=list[BudgetRead])
async def get_budgets(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Users only see their own budgets
    return session.exec(
        select(Budget).where(Budget.user_id == current_user.id)
    ).all()


@app.put("/budgets", response_model=BudgetRead)
async def upsert_budget(
    body: BudgetRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Upsert — update if exists, create if not
    existing = session.exec(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.scope == body.scope,
        )
    ).first()

    if existing:
        existing.amount_inr = body.amount_inr
        existing.period = body.period
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    budget = Budget(
        user_id=current_user.id,
        scope=body.scope,
        amount_inr=body.amount_inr,
        period=body.period,
    )
    session.add(budget)
    session.commit()
    session.refresh(budget)
    return budget


@app.delete("/budgets/{scope}", status_code=204)
async def delete_budget(
    scope: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    budget = session.exec(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.scope == scope,
        )
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found.")
    session.delete(budget)
    session.commit()


# ══════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
