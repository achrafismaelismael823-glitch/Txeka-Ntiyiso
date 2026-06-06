from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from urllib.parse import unquote

from src.models.database import get_db
from src.models import Document
from src.models.emission import RevokeRequest
from src.core.security import verify_token
import logging

router = APIRouter(tags=["revocation"])
logger = logging.getLogger(__name__)

@router.post("/emissions/{doc_id}/revoke", status_code=status.HTTP_200_OK)
async def revoke_emission(
    doc_id: str,
    request: RevokeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token),
    req: Request = None
):
    """Revoga documento. Requer motivo. Loga IP + user pra auditoria."""
    doc_id = unquote(doc_id)
    document = db.query(Document).filter(Document.doc_id == doc_id).first()

    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id} não encontrado")

    if document.revoked:
        return {
            "status": "already_revoked",
            "doc_id": document.doc_id,
            "revoked_at": document.revoked_at.isoformat() if document.revoked_at else None,
            "message": f"Documento já estava revogado. Motivo: {document.revoked_reason}"
        }

    # Validação compliance: só o emissor dono ou admin pode revogar
    if current_user.get("institution") != document.institution_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão pra revogar este documento")

    document.revoked = True
    document.revoked_at = datetime.utcnow()
    document.revoked_reason = request.reason

    try:
        db.commit()
        db.refresh(document)
        
        # Log auditoria
        ip = req.client.host if req else "unknown"
        logger.info(f"REVOGAÇÃO | IP:{ip} | User:{current_user.get('id')} | Doc:{doc_id} | Motivo:{request.reason}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Erro revogação {doc_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao revogar: {str(e)}")

    return {
        "status": "revoked",
        "doc_id": document.doc_id,
        "revoked_at": document.revoked_at.isoformat(),
        "revoked_by": current_user.get("institution"),
        "message": f"Documento revogado: {request.reason}"
  }
