"""
Config Module - DocVerify MZ

Gere as configurações da aplicação e variáveis de ambiente
utilizando validação estrita com Pydantic Settings.
"""

from typing import List
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Metadados da API
    PROJECT_NAME: str = "DocVerify MZ — API Gateway"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Configuração de Ambiente
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Segurança e CORS (Origins permitidas)
    # Em produção, estas origens serão substituídas pelo domínio real do frontend
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
    ]
    
    # Configuração do Sistema Monorepo (Criptografia)
    SECRET_KEY: str = "CHANGEME_DEFAULTS_MUITA_ATENCAO_EM_PRODUCAO_SHA256"
    
    # Suporte para carregar ficheiro .env se presente na raiz do módulo
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Instância global para importação em todo o ecossistema da API
settings = Settings()
