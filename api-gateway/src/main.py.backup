from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from src.database import init_db
from src.routes import emission_routes, verify, revocation

# 1. Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

# 2. Instanciação da API
app = FastAPI(
    title="Txeka Ntiyiso API",
    description="Plataforma de Validação Digital de Documentos",
    version="1.0.0"
)

# 3. Configuração do CORS 
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

# 4. Ciclo de Vida da Aplicação (Startup)
@app.on_event("startup")
async def startup():
    logger.info("Iniciando ciclo de vida da aplicação...")
    
    #  O Render já a faz no Start Command.
    
    await init_db()
    logger.info("Base de dados conectada e pronta.")

# 5. Registo de Rotas
API_PREFIX = "/api/v1"

app.include_router(emission_routes.router, prefix=API_PREFIX)  
app.include_router(verify.router, prefix=API_PREFIX)
app.include_router(revocation.router, prefix=API_PREFIX)

logger.info(f"Rotas registadas com prefixo: {API_PREFIX}")

# 6. Endpoints de Monitorização
@app.get("/health")
async def health_check():
    return {
        "status": "online",
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

