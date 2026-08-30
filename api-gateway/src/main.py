"""Main — entry point da API Txeka Ntiyiso."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from src.database import init_db
from src.routes import emission_routes, verify, revocation, audit_routes, institution_routes, auth_routes
from src.exceptions import TxekaNtiyisoException, txeka_exception_handler
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from src.core.rate_limiter import limiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")


# ── SENTRY INITIALIZATION ──────────────────────────────────────────
# Deve ocorrer ANTES de criar a app FastAPI
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=os.getenv("ENVIRONMENT", "production"),
        release=os.getenv("RENDER_GIT_COMMIT", "unknown"),
        integrations=[
            StarletteIntegration(transaction_style="url"),
            FastApiIntegration(transaction_style="url"),
        ],
        traces_sample_rate=0.2,      # 20% das requisicoes -> performance tracing
        profiles_sample_rate=0.1,    # 10% -> profiling de CPU
        send_default_pii=False,      # NAO envia dados sensiveis (tokens, emails)
    )

app = FastAPI(
    title="Txeka Ntiyiso",
    description="Plataforma de Validacao Digital de Documentos",
    version="2.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(TxekaNtiyisoException, txeka_exception_handler)

ENV = os.getenv("ENVIRONMENT", "production")

if ENV == "production":
    ALLOWED_ORIGINS = [
        "https://txeka-ntiyiso-portal.onrender.com",
        "https://txeka-ntiyiso-portal-staging.onrender.com"
    ]
else:
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


# ── SENTRY DEBUG ENDPOINT ──────────────────────────────────────────
@app.get("/sentry-debug", include_in_schema=False)
@limiter.limit("5/hour")
async def trigger_sentry_error(request: Request):
    # Endpoint para testar se o Sentry esta recebendo erros.
    # Acesse: https://txeka-ntiyiso-api.onrender.com/sentry-debug
    # Deve gerar um erro ZeroDivisionError no Sentry em ~30 segundos.
    division_by_zero = 1 / 0


@app.get("/health")
@limiter.limit("30/minute")
async def health_check(request: Request):
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
