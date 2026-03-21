import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from database import get_session, get_settings
from models import TokenBlacklist, User

# ── Password hashing ───────────────────────────────────────
# bcrypt with cost factor 12 — slow enough to resist brute force
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ────────────────────────────────────────────────────
def create_access_token(user_id: int, username: str, role: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "iat": now,
        "exp": expire,
        "jti": str(uuid.uuid4()),   # unique token ID — used for blacklisting
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Current user dependency ────────────────────────────────
def get_current_user(
    access_token: Optional[str] = Cookie(default=None),
    session: Session = Depends(get_session),
) -> User:
    # No token at all
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    payload = decode_token(access_token)

    # Check token is not blacklisted (i.e. user hasn't logged out)
    jti = payload.get("jti")
    if jti:
        blacklisted = session.exec(
            select(TokenBlacklist).where(TokenBlacklist.jti == jti)
        ).first()
        if blacklisted:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked. Please log in again.",
            )

    user_id = int(payload.get("sub", 0))
    user = session.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    return user


# ── Role-based access dependency ───────────────────────────
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user


# ── Timing-safe login (prevents username enumeration) ─────
DUMMY_HASH = hash_password("dummy_timing_protection_password")


def authenticate_user(username: str, password: str, session: Session) -> Optional[User]:
    user = session.exec(
        select(User).where(User.username == username.lower())
    ).first()

    # Always run bcrypt — even for unknown users — so response time
    # is identical whether the username exists or not.
    candidate_hash = user.hashed_password if user else DUMMY_HASH
    is_correct = verify_password(password, candidate_hash)

    if not user or not is_correct or not user.is_active:
        return None

    return user
