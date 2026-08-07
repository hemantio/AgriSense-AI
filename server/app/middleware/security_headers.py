"""
AgriSense AI — Security Headers Middleware
=============================================
Adds hardened HTTP security headers to all responses.
Equivalent to Helmet.js for Express.
"""

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import get_settings

settings = get_settings()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware that injects security headers into every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate unique request ID for tracing
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response: Response = await call_next(request)

        # --- Core Security Headers ---
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(self), geolocation=(self), "
            "payment=(), usb=(), magnetometer=()"
        )

        # --- Content Security Policy & Strict Transport Security ---
        if settings.is_production:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https://*.tile.openstreetmap.org; "
                "connect-src 'self' https://api.openweathermap.org; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        else:
            # Relaxed CSP for local development (supports tools, documentation exploration, live reloading)
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https://*.tile.openstreetmap.org blob:; "
                "connect-src 'self' ws://localhost:* http://localhost:* https://api.openweathermap.org; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )

        # --- Request Tracing ---
        response.headers["X-Request-Id"] = request_id

        # --- Remove Server Header ---
        if "server" in response.headers:
            del response.headers["server"]

        return response


def setup_security_headers(app):
    """Attach security headers middleware to the app."""
    app.add_middleware(SecurityHeadersMiddleware)
