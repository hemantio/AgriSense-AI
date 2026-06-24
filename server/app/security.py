"""
AgriSense AI — Security Module
================================
JWT token management, password hashing, and RBAC utilities.
"""

from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db

settings = get_settings()

# --- Password Hashing (bcrypt) ---
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.BCRYPT_ROUNDS,
)

# --- OAuth2 Scheme ---
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login",
    auto_error=True,
)


# --- User Roles ---
class UserRole(StrEnum):
    """Enumeration of user roles for RBAC."""
    ADMIN = "admin"
    FARMER = "farmer"


# --- Password Utilities ---
def hash_password(password: str) -> str:
    """Hash a password using bcrypt with configured rounds."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# --- JWT Token Utilities ---
def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload data (must include 'sub' for user ID).
        expires_delta: Custom expiration time.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta
        or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "access",
    })
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT refresh token (longer-lived).

    Args:
        data: Payload data (must include 'sub' for user ID).
        expires_delta: Custom expiration time.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta
        or timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "refresh",
    })
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT token.

    Args:
        token: The JWT string to decode.

    Returns:
        Decoded payload dictionary.

    Raises:
        HTTPException: If token is invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("sub") is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# --- Current User Dependencies ---
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    FastAPI dependency: Extract and validate the current user from JWT.

    Returns:
        Dictionary with user_id, role, and other token claims.

    Raises:
        HTTPException 401: If token is invalid or user not found.
    """
    from app.models.user import User
    from sqlalchemy import select

    payload = decode_token(token)

    # Verify token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    role = payload.get("role")

    import uuid
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
        )

    # Verify user still exists and is active
    result = await db.execute(
        select(User).where(User.id == user_uuid, User.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return {
        "user_id": str(user.id),
        "role": role,
        "name": user.name,
        "email": user.email,
    }


def require_role(*allowed_roles: UserRole):
    """
    Factory for role-based access control dependency.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(UserRole.ADMIN))])

    Args:
        *allowed_roles: One or more UserRole values that are permitted.

    Returns:
        A FastAPI dependency function.
    """
    async def role_checker(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(r.value for r in allowed_roles)}",
            )
        return current_user

    return role_checker
