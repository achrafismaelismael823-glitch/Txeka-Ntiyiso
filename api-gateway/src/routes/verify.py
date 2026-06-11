"""
Verification Routes - Unified endpoints for document authentication via Hash.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.database import get_async_db
from src.models.schemas import VerifyResponse, VerifyRequest
from src.security import verify_token
from src.services.verification_service import VerificationService

router = APIRouter(tags=["verification"])

@router.get("/verify/{doc_hash}", response_model=VerifyResponse)
async def verify_document_get(
    doc_hash: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(verify_token)
) -> VerifyResponse:
    """Verifica a autenticidade de um documento através do parâmetro de URL (GET)."""
    if len(doc_hash) != 64:
        raise HTTPException(status_code=400, detail="O hash SHA-256 deve conter exatamente 64 caracteres.")
        
    service = VerificationService(db)
    return await service.verify_document(doc_hash.lower())


@router.post("/verify", response_model=VerifyResponse)
async def verify_document_post(
    request: VerifyRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(verify_token)
) -> VerifyResponse:
    """Verifica a autenticidade de um documento via payload JSON (Integrações B2B/B2G)."""
    service = VerificationService(db)
    return await service.verify_document(request.doc_hash.lower())
