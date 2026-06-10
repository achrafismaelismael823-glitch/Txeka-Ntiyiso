from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, SecretStr, AnyHttpUrl

class Settings(BaseSettings):
    #  Configuração Base do Pydantic Settings
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore" 
    )

    #  Configurações da Aplicação
    PROJECT_NAME: str = "TXEKA NTIYISO API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development" 

    #  Banco de Dados 
    DATABASE_URL: PostgresDsn

    #  Segurança e Autenticação (JWT)
    JWT_SECRET_KEY: SecretStr
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    #  CORS (Cross-Origin Resource Sharing)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173"
        # para adição de domínios de produção futura
    ]

    #  Rate Limiting (Prevenção de Abuso)
    RATE_LIMIT_GLOBAL: str = "100/minute"
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_CERTIFY: str = "10/minute"

    @property
    def is_production(self) -> bool:
        """Helper property para verificar se o ambiente é de produção."""
        return self.ENVIRONMENT == "production"


    settings = Settings()
