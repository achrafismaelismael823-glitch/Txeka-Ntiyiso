from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional

# ==========================================
# 1️ SCHEMAS DE DOCUMENTOS & VVERIFICAÇÃ

class DadosPublicos(BaseModel):
    doc_id: str
    document_type: str
    institution_id: str
    created_at: datetime
    revoked: bool = False
    revoked_at: Optional[datetime] = None
    revoked_reason: Optional[str] = None

class VerifyRequest(BaseModel):
    hash: str = Field(..., min_length=64, max_length=64, description="Hash SHA-256 do documento")

class VerifyResponse(BaseModel):
    status: str
    dados_publicos: Optional[DadosPublicos] = None

class DocumentCreate(BaseModel):
    doc_hash: str = Field(..., min_length=64, max_length=64)
    document_type: str
    file_name: str
    file_size: int

# ==========================================
# 2 SCHEMAS DE INSTITUIÇÃO & CRÉDITOS


class InstitutionBase(BaseModel):
    id: str
    name: str
    contact_email: EmailStr

class InstitutionCredits(BaseModel):
    credits: int
    status: str
