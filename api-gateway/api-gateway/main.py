from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="DocVerify MZ - API Gateway",
    description="Interface de verificação em tempo real com suporte CORS.",
    version="1.1.0"
)

# ATIVAÇÃO DE SEGURANÇA (CORS): Permite que o portal-web interaja com a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, deve colocar o domínio real do portal
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VerifyRequest(BaseModel):
    doc_hash: str
    institution_id: str

# Base de Dados Simulada com um Hash de Teste (Corresponde a um arquivo de 0 bytes)
MOCK_LEDGER_DB = {
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855": {
        "status_documento": "VÁLIDO",
        "doc_id": "DUAT-INAGE-2026",
        "revogado": False
    }
}

@app.post("/api/v1/verify")
async def verify_document(request: VerifyRequest):
    # Mostra no terminal da API o hash que o utilizador enviou (excelente para testes!)
    print(f"🔍 Recebido pedido de verificação para o Hash: {request.doc_hash}")
    
    record = MOCK_LEDGER_DB.get(request.doc_hash)
    
    if not record:
        raise HTTPException(
            status_code=404, 
            detail=f"⚠️ ALERTA DE FRAUDE: O documento com hash {request.doc_hash[:10]}... não existe no registo oficial."
        )
        
    return {
        "status": "sucesso",
        "dados_publicos": {
            "doc_id": record["doc_id"],
            "instituicao": request.institution_id,
            "estado": record["status_documento"]
        }
    }
