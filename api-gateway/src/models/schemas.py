from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime
from typing import Optional, List

# ==========================================
# 1️⃣ SCHEMAS DE DOCUMENTOS & VERIFICAÇÃO
# ==========================================

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
# 2️⃣ SCHEMAS DE INSTITUIÇÃO & CRÉDITOS
# ==========================================

class InstitutionBase(BaseModel):
    id: str = Field(..., min_length=2, max_length=100)
    name: str = Field(..., min_length=2, max_length=255)
    contact_email: EmailStr

class InstitutionCreate(BaseModel):
    id: str = Field(..., min_length=2, max_length=100, description="Código da instituição, ex: INAGE")
    name: str = Field(..., min_length=2, max_length=255)
    contact_email: EmailStr
    credits: int = Field(default=0, ge=0)
    subscription_plan: str = Field(default="standard")
    
    @field_validator('id')
    @classmethod
    def uppercase_id(cls, v):
        return v.upper()

class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    status: Optional[str] = Field(default=None, pattern="^(pending|active|suspended|inactive)$")
    subscription_plan: Optional[str] = None
    approved: Optional[bool] = None
    token_epoch: Optional[int] = Field(default=None, description="Campo interno — usado apenas pelo sistema para invalidação de tokens")

class InstitutionResponse(BaseModel):
    id: str
    name: str
    contact_email: Optional[str] = None
    role: str
    subscription_plan: str
    credits: int
    docs_emitted_month: int
    status: str
    approved: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InstitutionCredits(BaseModel):
    credits: int
    status: str
    docs_emitted_month: int

class CreditTransactionCreate(BaseModel):
    amount: int = Field(..., gt=0, description="Quantidade de créditos a adicionar")
    type: str = Field(default="manual_add", pattern="^(manual_add|bonus|refund)$")
    description: Optional[str] = Field(default=None, description="Motivo da adição")
    payment_method: Optional[str] = Field(default=None, pattern="^(bank_transfer|cash|mpesa|bonus|none)$")
    payment_reference: Optional[str] = Field(default=None, description="Número de comprovativo/recibo")
    notes: Optional[str] = Field(default=None, description="Notas internas para o admin")

class CreditTransactionResponse(BaseModel):
    id: int
    institution_id: str
    amount: int
    type: str
    description: Optional[str]
    payment_method: Optional[str]
    payment_reference: Optional[str]
    notes: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class InstitutionListResponse(BaseModel):
    total: int
    institutions: List[InstitutionResponse]

class InstitutionDashboard(BaseModel):
    institution: InstitutionResponse
    credits_history: List[CreditTransactionResponse]
    total_emitted: int
    total_verifications: int

class InstitutionLoginRequest(BaseModel):
    institution_id: str = Field(..., description="ID da instituição, ex: INAGE")
    password: str = Field(..., min_length=1)

class InstitutionLoginResponse(BaseModel):
    access_token: str
    token_type: str
    institution: InstitutionResponse
    message: str


class AdminLoginRequest(BaseModel):
    """Schema para login admin via JSON body (V3)."""
    email: str
    password: str
