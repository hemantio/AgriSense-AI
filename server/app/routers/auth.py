"""
AgriSense AI — Authentication Router
========================================
Handles login, registration, token refresh, and logout.
Rate-limited to prevent brute force attacks.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.schemas.auth import (
    PasswordChangeRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
    UserUpdateRequest,
)
from app.security import (
    UserRole,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password,
)
from app.utils.audit import log_action
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger("agrisense.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserProfileResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def register_user(
    request: Request,
    body: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
):
    """
    Register a new user (admin-only).

    Only admins can create new accounts (farmers or other admins).
    """
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == body.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        role=body.role,
        phone_number=body.phone_number,
        village_name=body.village_name,
        preferred_language=body.preferred_language,
        notes=body.notes,
    )
    db.add(user)
    await db.flush()

    await log_action(
        action="create",
        resource_type="user",
        resource_id=str(user.id),
        user_id=current_user["user_id"],
        details={"role": body.role, "email": body.email},
    )

    logger.info("User registered", user_id=str(user.id), role=body.role)
    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(
    request: Request,
    body: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate and receive JWT tokens.

    Returns access token (15min) and refresh token (7 days).
    """
    # Find user
    result = await db.execute(
        select(User).where(
            User.email == body.email,
            User.is_active == True,  # noqa: E712
            User.is_deleted == False,  # noqa: E712
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        # Generic error to prevent user enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate tokens with token version tracking claim
    token_data = {
        "sub": str(user.id),
        "role": user.role,
        "name": user.name,
        "v": user.token_version,
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Update last login
    user.last_login_at = datetime.now(UTC)
    await db.flush()

    await log_action(
        action="login",
        resource_type="user",
        resource_id=str(user.id),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfileResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def refresh_token(
    request: Request,
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh an expired access token using a valid refresh token.
    """
    payload = decode_token(body.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for refresh",
        )

    user_id = payload.get("sub")
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.is_active == True,  # noqa: E712
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Issue new tokens (token rotation with version tracking claim)
    token_data = {
        "sub": str(user.id),
        "role": user.role,
        "name": user.name,
        "v": user.token_version,
    }
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfileResponse.model_validate(user),
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's profile."""
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put("/me", response_model=UserProfileResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def update_me(
    request: Request,
    body: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Explicitly whitelist allowable profile updates to prevent mass assignment (HIGH-01)
    allowed_fields = {"name", "phone_number", "village_name", "preferred_language", "notes"}
    update_data = body.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field in allowed_fields:
            setattr(user, field, value)

    await db.flush()

    await log_action(
        action="update",
        resource_type="user",
        resource_id=str(user.id),
        user_id=current_user["user_id"],
        details={"updated_fields": list(update_data.keys())},
    )

    return user


@router.post("/change-password", status_code=200)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def change_password(
    request: Request,
    body: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    user.hashed_password = hash_password(body.new_password)
    # Increment token version on password change to invalidate outstanding tokens (HIGH-02)
    user.token_version += 1
    await db.flush()

    await log_action(
        action="password_change",
        resource_type="user",
        resource_id=str(user.id),
        user_id=current_user["user_id"],
    )

    return {"message": "Password changed successfully"}
