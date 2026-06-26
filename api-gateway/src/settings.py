"""Settings — configuração centralizada da API."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, SecretStr


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "TXEKA NTIYISO API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    DATABASE_URL: PostgresDsn = "postgresql+asyncpg://postgres:postgres@localhost:5432/txeka_ntiyiso"

    JWT_SECRET_KEY: SecretStr = "dev-secret-key-change-in-production-32chars!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

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
