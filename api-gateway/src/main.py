"""
Main Application Module - DocVerify MZ

Ponto de entrada principal do API Gateway. 
Inicializa a aplicação FastAPI, configura middlewares (CORS, Logging),
eventos de ciclo de vida e regista todas as rotas de domínio.

Implementa padrões profissionais de produção incluindo:
- Lifespan context manager para inicialização e finalização
- Middleware de logging estruturado para auditoria
- Exception handlers globais para respostas padronizadas
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.routes import verify

# Configuração de Logging Estruturado
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Contexto de ciclo de vida da aplicação.
    
    Executa lógica de inicialização quando a aplicação inicia e
    lógica de finalização quando a aplicação encerra.
    
    Isto é essencial para gerenciar recursos como conexões de banco de dados,
    pools de conexão, e limpeza de ficheiros temporários.
    """
    # Inicialização: Lógica de startup
    logger.info("🚀 DocVerify MZ API Gateway iniciando...")
    logger.info(f"Ambiente: {settings.ENVIRONMENT}")
    logger.info(f"Versão: {settings.VERSION}")
    logger.info(f"CORS Origins: {settings.BACKEND_CORS_ORIGINS}")
    
    yield
    
    # Finalização: Lógica de shutdown
    logger.info("🛑 DocVerify MZ API Gateway encerrando...")
    logger.info("Limpeza de recursos e conexões finalizada.")


def create_app() -> FastAPI:
    """
    Fábrica de aplicação para inicializar o FastAPI com configurações profissionais.
    
    Implementa o padrão Factory para permitir testes e múltiplas instâncias
    com configurações diferentes.
    
    Returns:
        FastAPI: Instância configurada da aplicação.
    """
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="API Gateway para Custódia e Validação Criptográfica de Documentos em Moçambique.",
        lifespan=lifespan  # Registra o contexto de ciclo de vida
    )

    # ================================================================
    # CONFIGURAÇÃO DE SEGURANÇA: CORS (Cross-Origin Resource Sharing)
    # ================================================================
    # Permite que aplicações frontend autorizadas comuniquem com esta API.
    # Utiliza lista branca em vez de wildcard por razões de segurança.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ================================================================
    # MIDDLEWARE DE LOGGING ESTRUTURADO
    # ================================================================
    # Registra todas as requisições e respostas para auditoria e debugging.
    @app.middleware("http")
    async def logging_middleware(request: Request, call_next):
        """
        Middleware que regista detalhes de cada requisição HTTP.
        
        Útil para auditoria, debugging e monitorização de padrões de uso.
        """
        logger.info(f"📨 Requisição: {request.method} {request.url.path}")
        
        response = await call_next(request)
        
        logger.info(f"📤 Resposta: {response.status_code} {request.method} {request.url.path}")
        
        return response

    # ================================================================
    # EXCEPTION HANDLERS GLOBAIS
    # ================================================================
    # Define como diferentes tipos de erro são retornados ao cliente.

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """
        Handler para erros de validação Pydantic.
        
        Quando dados inválidos são enviados (tipo errado, campo obrigatório faltando, etc.),
        retorna uma resposta JSON padronizada com detalhes do erro.
        """
        logger.warning(f"⚠️ Erro de validação: {exc.errors()}")
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": "error",
                "message": "Dados de requisição inválidos",
                "detail": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """
        Handler global para exceções inesperadas.
        
        Captura qualquer erro que não foi tratado especificamente
        e retorna uma resposta padronizada sem expor detalhes internos.
        """
        logger.error(f"❌ Erro inesperado: {str(exc)}", exc_info=True)
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "message": "Erro interno do servidor",
                "detail": "Um erro inesperado ocorreu. Por favor contacte o administrador.",
            },
        )

    # ================================================================
    # REGISTAR AS ROTAS (Endpoints)
    # ================================================================
    # O prefixo '/api/v1' vem do ficheiro de configuração central.
    # Isto garante que todos os endpoints de verificação estejam sob este prefixo.
    logger.info(f"Registando rotas sob prefixo: {settings.API_V1_STR}")
    app.include_router(verify.router, prefix=settings.API_V1_STR)

    return app


# Instância principal que o servidor Uvicorn irá correr
app = create_app()


@app.get("/health", tags=["System"])
async def health_check():
    """
    Endpoint de monitorização para verificar se a API está viva.
    
    Utilizado por sistemas de orquestração (Kubernetes, Render, etc.) para
    verificar a saúde da aplicação e determinar se deve receber tráfego.
    
    Returns:
        dict: Estado da aplicação com nome do projecto e versão.
    """
    logger.debug("Health check solicitado")
    
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }
