"""Main — entry point da API Txeka Ntiyiso."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from src.database import init_db
from src.routes import emission_routes, verify, revocation, audit_routes, institution_routes, auth_routes
from src.exceptions import TxekaNtiyisoException, txeka_exception_handler
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Txeka Ntiyiso",
    description="Plataforma de Validacao Digital de Documentos",
    version="2.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(TxekaNtiyisoException, txeka_exception_handler)

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
    allow_methods=["GET", "POST", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "Accept"]
)


@app.on_event("startup")
async def startup():
    logger.info("Startup iniciado")
    
    db_ok = await init_db()
    if db_ok:
        logger.info("BD pronta")
    else:
        logger.warning("BD indisponivel. Health check monitora.")


API_PREFIX = "/api/v1"

app.include_router(emission_routes.router, prefix=API_PREFIX)
app.include_router(verify.router, prefix=API_PREFIX)
app.include_router(revocation.router, prefix=API_PREFIX)
app.include_router(audit_routes.router, prefix=API_PREFIX)
app.include_router(institution_routes.router, prefix=API_PREFIX)
app.include_router(auth_routes.router, prefix=API_PREFIX)

logger.info(f"Rotas registadas: {API_PREFIX}")


@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "project": "Txeka Ntiyiso",
        "version": "2.0.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "api_prefix": API_PREFIX
    }


@app.get("/ready")
async def ready_check():
    """Readiness probe --- verifica conexao com banco de dados."""
    try:
        db_ok = await init_db()
        if db_ok:
            return {"status": "ready", "database": "connected"}
        else:
            raise HTTPException(status_code=503, detail="Database unavailable")
    except Exception:
        raise HTTPException(status_code=503, detail="Service not ready")


@app.get("/")
async def root():
    return {
        "message": "Txeka Ntiyiso",
        "documentation": "/docs",
        "health": "/health",
        "api_prefix": API_PREFIX,
        "endpoints": {
            "auth": f"{API_PREFIX}/auth/login",
            "verification": f"{API_PREFIX}/verify/{{hash}}",
            "institutions": f"{API_PREFIX}/institutions",
            "emission": f"{API_PREFIX}/certify",
            "audit": f"{API_PREFIX}/audit"
        }
    }
