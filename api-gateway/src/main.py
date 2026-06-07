from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from alembic.config import Config
from alembic import command
from src.models.database import init_db
from src.models.database import db #-depois do taste eliminar com urgência
from src.routes import emission_routes, verify, revocation

# 1. Configura logging 
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

def run_migrations():
    """Aplica migrações Alembic automaticamente no startup"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        alembic_ini_path = os.path.join(base_dir, "..", "alembic.ini")
        alembic_ini_path = os.path.abspath(alembic_ini_path)
        
        logger.info(f"Procurando alembic.ini em: {alembic_ini_path}")
        
        alembic_cfg = Config(alembic_ini_path)
        command.upgrade(alembic_cfg, "head")
        logger.info("Migrações Alembic aplicadas com sucesso - Tabela Institution criada")
    except Exception as e:
        logger.error(f"Erro ao migrar banco: {e}")
        raise  

run_migrations()

app = FastAPI(
    title="Txeka Ntiyiso API",
    description="Plataforma de Validação Digital de Documentos",
    version="1.0.0"
)

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
    await init_db()

API_PREFIX = "/api/v1"

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
            "verification": f"{API_PREFIX}/verify/{{hash}}"
        }
    }

# elimitar depois do taste
@app.post("/dev/create-demo")
async def create_demo():
    try:
        async with await db.acquire() as conn:  # <- adiciona await aqui
            row = await conn.fetchrow("""
                INSERT INTO institutions (name, plan, credits, created_at) 
                VALUES ('Demo 80', 'free', 1, NOW())
                RETURNING id
            """)
        return {"institution_id": str(row['id']), "credits": 1}
    except Exception as e:
        return {"error": str(e)}
