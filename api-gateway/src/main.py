from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from src.models.database import init_db
from src.routes import emission_routes, verify, revocation
import os
from alembic.config import Config
from alembic import command
def run_migrations():
    """Aplica migrações Alembic automaticamente no startup"""
    try:
        alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrações Alembic aplicadas com sucesso - Tabela Institution criada")
    except Exception as e:
        logger.error(f"❌ Erro ao migrar banco: {e}")

run_migrations()

app = FastAPI(
    title="Txeka Ntiyiso API",
    description="Plataforma de Validação Digital de Documentos",
    version="1.0.0"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://txeka-ntiyiso-portal.onrender.com",
    "https://txeka-ntiyiso-portal-staging.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],  
    allow_headers=["Authorization", "Content-Type"]
)

@app.on_event("startup")
async def startup():
    init_db()

API_PREFIX = "/api/v1"

# Regista rotas SÓ depois de definir app e API_PREFIX
app.include_router(emission_routes.router, prefix=API_PREFIX)  
app.include_router(verify.router, prefix=API_PREFIX)
app.include_router(revocation.router, prefix=API_PREFIX)

logger.info(f"Rotas registadas com prefixo: {API_PREFIX}")

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "project": "Txeka Ntiyiso",
        "version": "1.0.0",
        "environment": "production",
        "api_prefix": API_PREFIX
    }

@app.get("/")
async def root():
    return {
        "message": "Txeka Ntiyiso API",
        "documentation": "/docs",
        "health": "/health",
        "api_prefix": API_PREFIX,
        "endpoints": {
            "verification": f"{API_PREFIX}/verify/{{hash}}",
            "emission": f"{API_PREFIX}/certify",  
            "emissions_list": f"{API_PREFIX}/emissions",
            "revoke": f"{API_PREFIX}/emissions/{{doc_id}}/revoke",  
            "certificate": f"{API_PREFIX}/certificate/{{doc_id}}"
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Erro não tratado: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False  
    )
