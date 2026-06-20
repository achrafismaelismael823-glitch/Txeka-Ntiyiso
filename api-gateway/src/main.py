from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from src.database import init_db, engine
from src.routes import emission_routes, verify, revocation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

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
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "Accept"]
)

@app.on_event("startup")
async def startup():
    logger.info("Iniciando ciclo de vida da aplicação...")
   
    db_ok = await init_db()
    if db_ok:
        logger.info("Base de dados conectada e pronta.")
    else:
        logger.warning("Base de dados indisponivel no startup. Health check vai monitorar.")

API_PREFIX = "/api/v1"

app.include_router(emission_routes.router, prefix=API_PREFIX)
app.include_router(verify.router, prefix=API_PREFIX)
app.include_router(revocation.router, prefix=API_PREFIX)

logger.info(f"Rotas registadas com prefixo: {API_PREFIX}")

@app.get("/health")
async def health_check():
    db_status = "connected" if engine else "disconnected"
    return {
        "status": "online",
        "database": db_status,
        "project": "Txeka Ntiyiso",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
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

