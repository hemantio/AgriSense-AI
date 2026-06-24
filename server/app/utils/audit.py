"""
AgriSense AI — Audit Trail Utility
=====================================
Logs all CRUD operations with user context for accountability.
"""

from datetime import UTC, datetime

import structlog

logger = structlog.get_logger("agrisense.audit")


async def log_action(
    action: str,
    resource_type: str,
    resource_id: str,
    user_id: str | None = None,
    details: dict | None = None,
    request_id: str | None = None,
) -> None:
    """
    Log an auditable action.

    Args:
        action: The action performed (create, read, update, delete, login, etc.)
        resource_type: Type of resource affected (user, plot, crop, etc.)
        resource_id: ID of the affected resource
        user_id: ID of the user who performed the action
        details: Additional context details
        request_id: Request ID for correlation
    """
    await logger.ainfo(
        "audit_event",
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        user_id=user_id,
        details=details or {},
        request_id=request_id,
        timestamp=datetime.now(UTC).isoformat(),
    )
