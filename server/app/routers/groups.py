"""
AgriSense AI — Groups Router
==============================
Cooperative group management, member listing, and QR-based group joining.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.group import Group, GroupMember
from app.models.user import User
from app.security import get_current_user
from app.utils.audit import log_action

router = APIRouter(prefix="/groups", tags=["Groups"])


class GroupCreateRequest(BaseModel):
    name: str
    description: str | None = None


class GroupResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    code: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GroupMemberResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    email: str
    role: str
    joined_at: datetime


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    body: GroupCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new group (Admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create groups",
        )

    # Check if group already exists
    existing = await db.execute(select(Group).where(Group.name == body.name))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Group with name '{body.name}' already exists",
        )

    group = Group(
        id=uuid.uuid4(),
        name=body.name,
        description=body.description,
    )
    db.add(group)
    await db.flush()  # Generate ID and auto code

    await log_action(
        action="create",
        resource_type="group",
        resource_id=str(group.id),
        user_id=current_user["user_id"],
    )
    return group


@router.get("/", response_model=list[GroupResponse])
async def list_groups(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all groups."""
    result = await db.execute(select(Group).order_by(Group.name))
    return result.scalars().all()


@router.get("/my-groups", response_model=list[GroupResponse])
async def list_my_groups(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List groups that the current user belongs to."""
    user_id = uuid.UUID(current_user["user_id"])
    query = (
        select(Group)
        .join(GroupMember, Group.id == GroupMember.group_id)
        .where(GroupMember.user_id == user_id)
        .order_by(Group.name)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{group_id}/members", response_model=list[GroupMemberResponse])
async def list_group_members(
    group_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a group."""
    group = await db.get(Group, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    query = (
        select(
            GroupMember.user_id,
            User.name,
            User.email,
            User.role,
            GroupMember.joined_at,
        )
        .join(User, GroupMember.user_id == User.id)
        .where(GroupMember.group_id == group_id)
        .order_by(GroupMember.joined_at)
    )
    result = await db.execute(query)

    members = []
    for row in result.all():
        members.append(
            GroupMemberResponse(
                user_id=row.user_id,
                name=row.name,
                email=row.email,
                role=row.role,
                joined_at=row.joined_at,
            )
        )
    return members


@router.post("/{group_id}/join", status_code=status.HTTP_200_OK)
async def join_group(
    group_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join a group using its Group ID."""
    group = await db.get(Group, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    user_id = uuid.UUID(current_user["user_id"])

    # Check if already a member
    membership = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
        )
    )
    if membership.scalars().first():
        return {"status": "success", "message": "Already a member of this group."}

    member = GroupMember(
        id=uuid.uuid4(),
        group_id=group_id,
        user_id=user_id,
    )
    db.add(member)
    await db.flush()

    await log_action(
        action="join",
        resource_type="group",
        resource_id=str(group_id),
        user_id=current_user["user_id"],
    )
    return {
        "status": "success",
        "message": f"Successfully joined group {group.name}!",
    }
