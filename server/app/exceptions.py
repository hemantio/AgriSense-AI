"""
AgriSense AI — Domain Exception Hierarchy
=============================================
Typed exceptions for business logic errors.
Routers and services raise these; the global exception handler
in main.py catches and serializes them into consistent JSON responses.

This replaces scattered HTTPException calls with domain-aware errors
that carry structured context (resource type, field names, etc.).
"""

from typing import Any


class AgriSenseError(Exception):
    """Base exception for all application-level errors."""

    status_code: int = 500
    error_code: str = "internal_error"

    def __init__(
        self,
        message: str = "An unexpected error occurred.",
        *,
        details: dict[str, Any] | None = None,
    ):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        """Serialize for JSON response."""
        payload: dict[str, Any] = {
            "error": self.error_code,
            "detail": self.message,
        }
        if self.details:
            payload["details"] = self.details
        return payload


# --- 400-level Errors ---


class BadRequestError(AgriSenseError):
    """Invalid client input that doesn't fit Pydantic validation."""

    status_code = 400
    error_code = "bad_request"


class AuthenticationError(AgriSenseError):
    """Invalid or expired credentials."""

    status_code = 401
    error_code = "authentication_error"


class ForbiddenError(AgriSenseError):
    """Authenticated but lacks required role/permission."""

    status_code = 403
    error_code = "forbidden"


class NotFoundError(AgriSenseError):
    """Requested resource does not exist (or is soft-deleted)."""

    status_code = 404
    error_code = "not_found"

    def __init__(
        self,
        resource: str,
        resource_id: str | None = None,
        *,
        details: dict[str, Any] | None = None,
    ):
        self.resource = resource
        self.resource_id = resource_id
        if resource_id:
            message = f"{resource} with id '{resource_id}' not found"
        else:
            message = f"{resource} not found"
        super().__init__(message, details=details)


class ConflictError(AgriSenseError):
    """Resource already exists (e.g., duplicate email)."""

    status_code = 409
    error_code = "conflict"


class ValidationError(AgriSenseError):
    """Business-rule validation failure (beyond Pydantic schema)."""

    status_code = 422
    error_code = "validation_error"

    def __init__(
        self,
        message: str = "Validation failed",
        *,
        field: str | None = None,
        details: dict[str, Any] | None = None,
    ):
        extra = details or {}
        if field:
            extra["field"] = field
        super().__init__(message, details=extra)


# --- 500-level Errors ---


class ExternalServiceError(AgriSenseError):
    """Failure communicating with an external API (Gemini, OpenWeather, etc.)."""

    status_code = 502
    error_code = "external_service_error"

    def __init__(
        self,
        service_name: str,
        message: str = "External service unavailable",
        *,
        details: dict[str, Any] | None = None,
    ):
        self.service_name = service_name
        extra = details or {}
        extra["service"] = service_name
        super().__init__(message, details=extra)
