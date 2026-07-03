"""
AgriSense AI — FastAPI Application Entry Point
==================================================
Main application factory with full middleware stack.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import close_db, init_db
from app.exceptions import AgriSenseError
from app.middleware.cors import setup_cors
from app.middleware.rate_limit import setup_rate_limiting
from app.middleware.security_headers import setup_security_headers
from app.routers import (
    auth,
    crops,
    dashboard,
    expenses,
    farmers,
    health,
    inputs,
    plots,
    recommendations,
    simulation,
    weather,
)
from app.utils.logger import get_logger, setup_logging

settings = get_settings()


# --- Application Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown events."""
    # Startup
    setup_logging()
    logger = get_logger("agrisense.main")
    logger.info(
        "Starting AgriSense AI",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )

    # Initialize database tables (dev only — use Alembic in production)
    if settings.DEBUG:
        await init_db()
        logger.info("Database tables initialized")

    yield

    # Shutdown
    await close_db()
    logger.info("AgriSense AI shut down cleanly")


# --- Application Factory ---
def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Intelligent Farm Management and Decision Support Platform "
            "for Small-Scale Farmers. Provides AI-powered crop health analysis, "
            "weather intelligence, smart recommendations, and comprehensive "
            "farm management tools."
        ),
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
        openapi_url="/api/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # --- Middleware Stack (order matters: last added = first executed) ---
    setup_cors(app)
    setup_security_headers(app)
    setup_rate_limiting(app)

    # --- API Routers ---
    api_prefix = settings.API_PREFIX

    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(farmers.router, prefix=api_prefix)
    app.include_router(plots.router, prefix=api_prefix)
    app.include_router(crops.router, prefix=api_prefix)
    app.include_router(expenses.router, prefix=api_prefix)
    app.include_router(inputs.router, prefix=api_prefix)
    app.include_router(health.router, prefix=api_prefix)
    app.include_router(weather.router, prefix=api_prefix)
    app.include_router(simulation.router, prefix=api_prefix)
    app.include_router(recommendations.router, prefix=api_prefix)
    app.include_router(dashboard.router, prefix=api_prefix)

    # --- Static File Serving (uploads) ---
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    app.mount(
        "/uploads",
        StaticFiles(directory=settings.UPLOAD_DIR),
        name="uploads",
    )

    # --- Domain Exception Handler ---
    @app.exception_handler(AgriSenseError)
    async def domain_exception_handler(request, exc: AgriSenseError):
        """Handle typed domain exceptions with consistent JSON responses."""
        logger = get_logger("agrisense.error")
        logger.warning(
            "Domain error",
            error_code=exc.error_code,
            detail=exc.message,
            path=str(request.url),
            method=request.method,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict(),
        )

    # --- Global Catch-All Exception Handler ---
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        """Catch-all exception handler — never expose stack traces."""
        logger = get_logger("agrisense.error")
        logger.error(
            "Unhandled exception",
            path=str(request.url),
            method=request.method,
            error=str(exc),
            request_id=getattr(request.state, "request_id", "unknown"),
        )

        if settings.DEBUG:
            detail = str(exc)
        else:
            detail = "An internal error occurred. Please try again later."

        return JSONResponse(
            status_code=500,
            content={"error": "internal_server_error", "detail": detail},
        )

    # --- Health Check ---
    @app.get("/health", tags=["System"])
    async def health_check():
        """System health check endpoint."""
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    return app


# --- Create Application Instance ---
app = create_app()
