"""
Revocation Routes - Endpoints for document revocation with audit logging.
"""

from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from urllib.parse import unquote

from src.models.database import get_async_db
from src.models.models import Document
from src.models.emission import RevokeRequest
from src.security import verify_token

router = APIRouter(tags=["revocation"])

@router.post("/emissions/{doc_id}/revoke", status_code=status.HTTP_200_OK)
async def revoke_emission(
    doc_id: str,
    request: RevokeRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: dict = Depends(verify_token)
) -> Dict[str, Any]:
    """Revoga um documento emitido e gera um rasto de auditoria imutável."""
    doc_id_decoded = unquote(doc_id)
    
    result = await db.execute(select(Document).where(Document.doc_id == doc_id_decoded))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id_decoded} não encontrado")

    if document.revoked:
        return {
            "status": "already_revoked",
            "doc_id": document.doc_id,
            "message": f"Documento já se encontrava revogado. Motivo: {document.revoked_reason}"
        }

    # Validação de permissões da Instituição ou Admin
    if current_user.get("institution") != document.institution_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Sem permissão para revogar este documento")

    document.revoked = True
    document.revoked_at = datetime.now(timezone.utc)
    document.revoked_reason = request.reason
    document.revoked_by = current_user.get("id")

    await db.commit()
    
    return {
        "status": "revoked",
        "doc_id": document.doc_id,
        "revoked_at": document.revoked_at.isoformat(),
        "message": f"Documento revogado com sucesso. Motivo: {request.reason}"
    }
