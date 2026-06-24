"""
AgriSense AI — Rate Limiting Middleware
==========================================
Protects API endpoints from abuse using slowapi.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings

settings = get_settings()

# --- Rate Limiter Instance ---
storage_uri = "memory://" if settings.ENVIRONMENT == "development" else settings.REDIS_URL

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT_DEFAULT],
    storage_uri=storage_uri,
    strategy="fixed-window",
)


def setup_rate_limiting(app):
    """Attach rate limiting to the FastAPI application."""
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request, exc):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limit_exceeded",
                "detail": "Too many requests. Please slow down.",
                "retry_after": str(exc.detail),
            },
        )
