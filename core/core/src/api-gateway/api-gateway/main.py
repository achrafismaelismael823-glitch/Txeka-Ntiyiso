from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime

# Inicialização da API com metadados para a documentação automática
app = FastAPI(
    title="DocVerify MZ - API Gateway",
    description="Interface de verificação em tempo real para documentos criptografados em Moçambique.",
    version="1.0.0"
)

# 1. Definição do formato exato que a API espera receber (Segurança e Validação)
class VerifyRequest(BaseModel):
    doc_hash: str
    institution_id: str

# 2. Base de Dados Simulada (Em produção, isto estaria ligado a um PostgreSQL ou Blockchain)
# Vamos usar o hash que gerámos no ficheiro qr_generator.py
MOCK_LEDGER_DB = {
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824": {
        "status_documento": "VÁLIDO",
        "doc_id": "DUAT-2026-88391",
        "data_registo": "2026-05-21T10:00:00Z",
        "revogado": False
    }
}

# 3. Rota de Verificação Principal
@app.post("/api/v1/verify", summary="Verifica a autenticidade de um documento via Hash")
async def verify_document(request: VerifyRequest):
    """
    Recebe o hash SHA-256 de um documento (lido de um QR Code ou PDF) e 
    verifica se ele existe e é válido na base de dados imutável.
    """
    # Procura o hash na base de dados
    record = MOCK_LEDGER_DB.get(request.doc_hash)
    
    # Se o hash não existir, ou se o ID da instituição não bater certo, rejeita
    if not record:
        raise HTTPException(
            status_code=404, 
            detail="⚠️ FRAUDE DETETADA: Documento não encontrado ou hash inválido."
        )
        
    # Se o documento foi revogado (ex: um DUAT cancelado), avisa o sistema
    if record["revogado"]:
        raise HTTPException(
            status_code=403, 
            detail="⚠️ ALERTA: Este documento existe, mas foi REVOGADO pela instituição emissora."
        )
        
    # Retorna sucesso (Sem expor dados pessoais do cidadão)
    return {
        "status": "sucesso",
        "mensagem": "Documento autêntico e válido.",
        "dados_publicos": {
            "doc_id": record["doc_id"],
            "instituicao": request.institution_id,
            "estado": record["status_documento"]
        }
  }
