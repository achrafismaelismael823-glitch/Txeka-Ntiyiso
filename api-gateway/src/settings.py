"""Settings — configuração centralizada da API."""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, SecretStr, Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env" if os.getenv("ENVIRONMENT") != "production" else None,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "TXEKA NTIYISO API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # ──────────────────────────────────────────────
    # SEGURANÇA: Sem fallbacks — falha hard se não configurado
    # ──────────────────────────────────────────────

    DATABASE_URL: PostgresDsn = Field(
        ...,
        description="URL do banco de dados PostgreSQL"
    )

    JWT_SECRET_KEY: SecretStr = Field(
        ...,
        min_length=32,
        description="Chave secreta para JWT (mínimo 32 caracteres)"
    )

    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Admin do Sistema
    ADMIN_EMAIL: str = "admin@txeka.co.mz"
    ADMIN_PASSWORD_HASH: SecretStr = ""

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173"
    ]

    RATE_LIMIT_GLOBAL: str = "100/minute"
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_CERTIFY: str = "10/minute"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def database_url_async(self) -> str:
        """Converte URL para asyncpg."""
        url = str(self.DATABASE_URL)
        if url.startswith("postgresql://") and "asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://")
        return url

    @property
    def database_url_sync(self) -> str:
        """Converte URL para driver síncrono."""
        url = str(self.DATABASE_URL)
        if "asyncpg" in url:
            url = url.replace("postgresql+asyncpg://", "postgresql://")
        return url


settings = Settings()
