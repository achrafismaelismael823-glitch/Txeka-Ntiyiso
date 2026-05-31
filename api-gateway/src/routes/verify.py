from fastapi import APIRouter, Depends, HTTPException
from ..models.schemas import VerifyResponse
from ..services.verification_service import VerificationService
from src.core.security import verify_token
import base64

router = APIRouter(tags=["verification"])

verification_service = VerificationService()

@router.get("/verify/{doc_hash}", response_model=VerifyResponse)
async def verify_document(
    doc_hash: str,
    current_user: dict = Depends(verify_token)
) -> VerifyResponse:
    
    if len(doc_hash) != 64:
        raise HTTPException(
            status_code=400,
            detail="Hash SHA-256 deve ter exactamente 64 caracteres hexadecimais"
        )
    
    if not all(c in '0123456789abcdefABCDEF' for c in doc_hash):
        raise HTTPException(
            status_code=400,
            detail="Hash deve conter apenas caracteres hexadecimais (0-9, a-f)"
        )
    
    doc_hash = doc_hash.lower()
    
    result = verification_service.verify_document(doc_hash)
    
    if result["status"] == "not_found":
        raise HTTPException(
            status_code=404,
            detail=f"Documento com hash {doc_hash[:16]}... não encontrado"
        )
    
    return VerifyResponse(
        status=result["status"],
        dados_publicos=result.get("dados_publicos"),
        qr_code=result.get("qr_code")
    )

@router.post("/verify")
async def verify_document_post(
    doc_hash: str,
    institution_id: str = None,
    current_user: dict = Depends(verify_token)
):
    
    if len(doc_hash) != 64:
        raise HTTPException(
            status_code=400,
            detail="Hash SHA-256 deve ter exactamente 64 caracteres"
        )
    
    result = verification_service.verify_document(doc_hash, institution_id)
    
    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    return VerifyResponse(
        status=result["status"],
        dados_publicos=result.get("dados_publicos"),
        qr_code=result.get("qr_code")
    )
