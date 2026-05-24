"""
Config Module - DocVerify MZ

Gere as configurações da aplicação e variáveis de ambiente
utilizando validação estrita com Pydantic Settings.
"""

from typing import List, Union
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Metadados da API
    PROJECT_NAME: str = "DocVerify MZ — API Gateway"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Configuração de Ambiente (Alterado para os padrões da Render)
    ENVIRONMENT: str = "production"
    DEBUG: Union[bool, str] = False
    
    # Segurança e CORS (Aceita lista ou string "*" vinda da Render)
    ALLOWED_ORIGINS: Union[List[str], str] = ["*"]
    
    # Configuração do Sistema Monorepo (Criptografia)
    SECRET_KEY: str = "CHANGEME_DEFAULTS_MUITA_ATENCAO_EM_PRODUCAO_SHA256"
    
    # 🌟 CORREÇÃO VITAL PARA O UVICORN:
    LOG_LEVEL: str = "INFO"
    
    # Configuração do Pydantic Settings
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignora variáveis extra configuradas na Render para não quebrar o arranque
    )


# Instância global para importação em todo o ecossistema da API
settings = Settings()
