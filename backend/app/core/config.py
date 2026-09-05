"""
LedgerIQ Application Configuration Settings
"""
import os
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LedgerIQ"
    VERSION: str = "1.0.0"
    TAGLINE: str = "Reconcile faster. Explain every rupee. Resolve exceptions with confidence."
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security
    JWT_SECRET: str = "ledgeriq_super_secret_jwt_key_2026_buildathon_secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    # Primary: PostgreSQL. Fallback for standalone/local: SQLite
    DATABASE_URL: str = "sqlite+aiosqlite:///./ledgeriq.db"
    SYNC_DATABASE_URL: Optional[str] = None
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"

    # AI Provider configuration
    AI_PROVIDER: str = "fallback"  # gemini, groq, openrouter, ollama, fallback
    AI_MODEL_NAME: str = "gemini-2.0-flash"
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Razorpay API Integration (Optional for live/test account sync)
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    RAZORPAY_API_BASE_URL: str = "https://api.razorpay.com/v1"

    # Default Financial Tolerances
    DEFAULT_MDR_FEE_RATE: float = 0.02  # 2%
    DEFAULT_GST_TAX_RATE: float = 0.18  # 18% on MDR
    DEFAULT_DATE_TOLERANCE_DAYS: int = 3
    DEFAULT_AMOUNT_TOLERANCE_INR: float = 0.05

    # CORS: Explicitly allowed frontend origins (no wildcards with credentials)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL


settings = Settings()
