"""
AgriSense AI — Farmers Router
================================
Admin-level farmer management CRUD operations.
"""

import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserUpdateRequest
from app.schemas.farmer import FarmerCreateRequest, FarmerListResponse, FarmerResponse
from app.security import UserRole, get_current_user, hash_password, require_role
from app.utils.audit import log_action

router = APIRouter(prefix="/farmers", tags=["Farmers"])


@router.get("/", response_model=FarmerListResponse)
async def list_farmers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=100),
    village: str | None = Query(None, max_length=150),
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List all farmers with pagination and filtering (admin only)."""
    query = select(User).where(
        User.role == "farmer",
        User.is_deleted == False,  # noqa: E712
    )

    # Search filter
    if search:
        query = query.where(
            User.name.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
            | User.phone_number.ilike(f"%{search}%")
        )

    # Village filter
    if village:
        query = query.where(User.village_name.ilike(f"%{village}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(User.created_at.desc())

    result = await db.execute(query)
    farmers = result.scalars().all()

    return FarmerListResponse(
        farmers=[FarmerResponse.model_validate(f) for f in farmers],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.post("/", response_model=FarmerResponse, status_code=201)
async def create_farmer(
    body: FarmerCreateRequest,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new farmer account (admin only)."""
    # Check email uniqueness
    result = await db.execute(
        select(User).where(User.email == body.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    farmer = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        role="farmer",
        phone_number=body.phone_number,
        village_name=body.village_name,
        preferred_language=body.preferred_language,
        notes=body.notes,
    )
    db.add(farmer)
    await db.flush()

    await log_action(
        action="create",
        resource_type="farmer",
        resource_id=str(farmer.id),
        user_id=current_user["user_id"],
    )

    return farmer


@router.get("/{farmer_id}", response_model=FarmerResponse)
async def get_farmer(
    farmer_id: str,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific farmer's details (admin only)."""
    result = await db.execute(
        select(User).where(
            User.id == farmer_id,
            User.role == "farmer",
            User.is_deleted == False,  # noqa: E712
        )
    )
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer


@router.put("/{farmer_id}", response_model=FarmerResponse)
async def update_farmer(
    farmer_id: str,
    body: UserUpdateRequest,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Update a farmer's details (admin only)."""
    result = await db.execute(
        select(User).where(
            User.id == farmer_id,
            User.role == "farmer",
            User.is_deleted == False,  # noqa: E712
        )
    )
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farmer, field, value)

    await db.flush()

    await log_action(
        action="update",
        resource_type="farmer",
        resource_id=farmer_id,
        user_id=current_user["user_id"],
        details={"updated_fields": list(update_data.keys())},
    )

    return farmer


@router.delete("/{farmer_id}", status_code=204)
async def delete_farmer(
    farmer_id: str,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a farmer account (admin only)."""
    result = await db.execute(
        select(User).where(
            User.id == farmer_id,
            User.role == "farmer",
            User.is_deleted == False,  # noqa: E712
        )
    )
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    farmer.is_deleted = True
    farmer.is_active = False
    await db.flush()

    await log_action(
        action="delete",
        resource_type="farmer",
        resource_id=farmer_id,
        user_id=current_user["user_id"],
    )
