from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EmittedDocument(BaseModel):
    doc_id: str
    hash_sha256: str
    institution_id: str
    document_type: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    status: str = "active"
    issued_at: Optional[datetime] = None
    issued_by: Optional[str] = None
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None

class EmitRequest(BaseModel):
    doc_hash: str = Field(..., min_length=64, max_length=64)
    document_type: str = Field(..., max_length=50)
    institution_id: str = Field(..., max_length=50)

class EmitResponse(BaseModel):
    status: str
    doc_id: str
    hash_sha256: str
    qr_code: str
    certificate_url: str
    timestamp: str
    message: str

class RevokeRequest(BaseModel):
    reason: str = Field(..., max_length=255)

class EmissionsListResponse(BaseModel):
    total: int
    documents: list[EmittedDocument]
