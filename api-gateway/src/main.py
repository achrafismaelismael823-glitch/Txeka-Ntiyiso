import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import verify
from src.routes import emit
# Configuração de Logs Institucionais
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("src.main")

app = FastAPI(
    title="Txeka Ntiyiso API",
    description="API Gateway para Validação Criptográfica de Documentos",
    version="1.0.0"
)

# Configuração de CORS Perimetral
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CORREÇÃO: Rota Raiz oficial para responder com 200 OK no Render (Evita Falsos Alertas de Queda)
@app.get("/", tags=["Diagnóstico"])
def root_health_check():
    return {
        "status": "online",
        "infraestrutura": "Txeka Ntiyiso",
        "jurisdicao": "Moçambique",
        "ambiente": "production"
    }

# Ativação das Rotas do Ecossistema
app.include_router(verify.router, prefix="/api/v1")
app.include_router(emit.router)
logger.info("Registando rotas sob prefixo: /api/v1")

@app.on_event("startup")
def startup_event():
    logger.info("Txeka Ntiyiso API Gateway operacional em produção...")
