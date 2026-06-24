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
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
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
