"""
AgriSense AI — Application Configuration
==========================================
Centralized, type-safe configuration using Pydantic BaseSettings.
All secrets loaded from environment variables (.env file).
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
if not env_path.exists():
    env_path = BASE_DIR.parent / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(env_path),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str = "AgriSense AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # --- Database (PostgreSQL) ---
    DATABASE_URL: str = "postgresql+asyncpg://agrisense:agrisense_secret@localhost:5432/agrisense_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO: bool = False

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_SESSION_DB: int = 1
    REDIS_CACHE_TTL: int = 300  # 5 minutes
    CELERY_ALWAYS_EAGER: bool = True

    # --- JWT Authentication ---
    JWT_SECRET_KEY: str = "CHANGE-THIS-TO-A-SECURE-RANDOM-KEY-IN-PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    # --- Rate Limiting ---
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AUTH: str = "20/minute"
    RATE_LIMIT_UPLOAD: str = "30/minute"

    # --- File Upload ---
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: list[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ]

    # --- External APIs ---
    OPENWEATHER_API_KEY: str = ""
    OPENWEATHER_BASE_URL: str = "https://api.openweathermap.org/data/2.5"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # --- CIE (Conversational Intelligence Engine) ---
    CIE_PROMPT_VERSION: str = "v1.0"
    CIE_SESSION_TIMEOUT_MINUTES: int = 30
    CIE_MAX_CLARIFICATION_ROUNDS: int = 2
    CIE_MAX_MESSAGES_CONTEXT: int = 10

    # --- Google Cloud Platform (GCP) ---
    GCP_PROJECT_ID: str = ""
    GCP_LOCATION: str = "us-central1"
    GCS_BUCKET_NAME: str = ""

    # --- Logging ---
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "console"] = "console"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — loaded once on first access."""
    return Settings()
