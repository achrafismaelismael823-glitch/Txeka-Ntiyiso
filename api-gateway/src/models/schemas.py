from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DadosPublicos(BaseModel):
    doc_id: str
    document_type: str
    institution_id: str
    created_at: datetime
    revoked_at: Optional[datetime] = None
    revoked_reason: Optional[str] = None

class VerifyResponse(BaseModel):
    status: str
    dados_publicos: Optional[DadosPublicos] = None

class VerifyRequest(BaseModel):
    hash: str
