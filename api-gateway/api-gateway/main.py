from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="DocVerify MZ - API Gateway",
    description="Interface de verificação em tempo real para Moçambique.",
    version="1.0.0"
)

class VerifyRequest(BaseModel):
    doc_hash: str
    institution_id: str

# Base de Dados Simulada para Teste
MOCK_LEDGER_DB = {
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824": {
        "status_documento": "VÁLIDO",
        "doc_id": "DUAT-2026-88391",
        "revogado": False
    }
}

@app.post("/api/v1/verify")
async def verify_document(request: VerifyRequest):
    record = MOCK_LEDGER_DB.get(request.doc_hash)
    
    if not record:
        raise HTTPException(status_code=404, detail="⚠️ FRAUDE: Documento não encontrado.")
    if record["revogado"]:
        raise HTTPException(status_code=403, detail="⚠️ ALERTA: Documento foi REVOGADO.")
        
    return {
        "status": "sucesso",
        "dados_publicos": {
            "doc_id": record["doc_id"],
            "instituicao": request.institution_id,
            "estado": record["status_documento"]
        }
    }
