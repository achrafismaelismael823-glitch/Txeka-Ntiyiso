from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from src.models.database import get_db
from src.models import Document
from src.models.schemas import VerifyResponse
from src.core.security import verify_token, validar_hash_sha256
import logging

router = APIRouter(tags=["verification"])
logger = logging.getLogger(__name__)


class VerifyRequest(BaseModel):
    doc_hash: str = Field(..., min_length=64, max_length=64, pattern=r'^[0-9a-fA-F]{64}$')
    institution_id: str | None = None


@router.get("/verify/{doc_hash}", response_model=VerifyResponse)
async def verify_document(
    doc_hash: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> VerifyResponse:
    """Verifica documento via hash na URL."""
    if not validar_hash_sha256(doc_hash):
        raise HTTPException(
            status_code=400,
            detail="Hash SHA-256 inválido. Deve ter 64 caracteres hexadecimais."
        )
    doc_hash = doc_hash.lower()
    logger.info(f"Verificação GET por {current_user.get('institution')} — hash {doc_hash[:16]}...")

    doc = db.query(Document).filter(Document.doc_hash == doc_hash).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"Documento com hash {doc_hash[:16]}... não encontrado"
        )

    return VerifyResponse(
        status="verified",
        dados_publicos={
            "doc_id": doc.doc_id,
            "document_type": doc.document_type,
            "institution_id": doc.institution_id,
            "created_at": doc.created_at.isoformat() if doc.created_at else None
        },
        qr_code=doc.qr_code
    )


@router.post("/verify", response_model=VerifyResponse)
async def verify_document_post(
    request: VerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """Verifica documento via body JSON (uso B2B/B2G)."""
    doc_hash = request.doc_hash.lower()
    institution_id = request.institution_id
    logger.info(f"Verificação POST por {current_user.get('institution')} — hash {doc_hash[:16]}...")

    doc = db.query(Document).filter(Document.doc_hash == doc_hash).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    return VerifyResponse(
        status="verified",
        dados_publicos={
            "doc_id": doc.doc_id,
            "document_type": doc.document_type,
            "institution_id": doc.institution_id,
            "created_at": doc.created_at.isoformat() if doc.created_at else None
        },
        qr_code=doc.qr_code
    )
