"""
AgriSense AI — CORS Middleware Configuration
================================================
Strict CORS policy allowing only the frontend origin.
"""

from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

settings = get_settings()


def setup_cors(app):
    """Configure CORS with strict origin whitelist."""
    origins = settings.ALLOWED_ORIGINS
    if settings.is_production and "*" in origins:
        # Strip wildcard origins in production for security hardening
        origins = [origin for origin in origins if origin != "*"]
        if not origins:
            # Fallback to local port if list becomes empty
            origins = ["http://localhost:3000"]
            
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "X-CSRF-Token",
            "Accept",
            "Accept-Language",
        ],
        expose_headers=["X-Total-Count", "X-Request-Id"],
        max_age=600,  # 10 minutes preflight cache
    )
