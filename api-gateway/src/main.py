"""
Main Application Module - DocVerify MZ

Ponto de entrada principal do API Gateway. 
Inicializa a aplicação FastAPI, configura middlewares (CORS) 
e regista todas as rotas de domínio.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routes import verify

def create_app() -> FastAPI:
    """Fábrica de aplicação para inicializar o FastAPI com configurações estritas."""
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="API Gateway para Custódia e Validação Criptográfica de Documentos em Moçambique."
    )

    # Configuração de Segurança: CORS (Cross-Origin Resource Sharing)
    # Permite que aplicações frontend autorizadas comuniquem com esta API
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Registar as rotas (Endpoints) construídas
    # O prefixo '/api/v1' vem do ficheiro de configuração central
    app.include_router(verify.router, prefix=settings.API_V1_STR)

    return app

# Instância principal que o servidor Uvicorn irá correr
app = create_app()

@app.get("/health", tags=["System"])
async def health_check():
    """Endpoint de monitorização para verificar se a API está viva (Monitorização DevOps)."""
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION
    }
