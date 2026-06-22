"""
Revocation Routes - Endpoints for document revocation with audit logging.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from urllib.parse import unquote
from src.database import get_db
from src.models.models import Document
from src.models.emission import RevokeRequest
from src.security import verify_token
from src.services.audit_service import AuditService

# CAT = Central Africa Time (UTC+2) - Fuso horario de Mocambique
CAT = timezone(timedelta(hours=2), name="CAT")

router = APIRouter(tags=["revocation"])

@router.post("/emissions/{doc_id}/revoke", status_code=status.HTTP_200_OK)
async def revoke_emission(
    doc_id: str,
    request: RevokeRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(verify_token)
) -> Dict[str, Any]:
    """Revoga um documento emitido e gera um rasto de auditoria imutável."""
    doc_id_decoded = unquote(doc_id)
    
    result = await db.execute(select(Document).where(Document.doc_id == doc_id_decoded))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id_decoded} não encontrado")

    if document.revoked:
        # Registrar tentativa de revogação de documento já revogado
        await AuditService.log_revoke(
            session=db,
            user_email=current_user.get("sub", "unknown"),
            doc_hash=document.doc_hash,
            institution_id=document.institution_id,
            request=req,
            success=False,
            status_code=200,
            details={"reason": "already_revoked", "attempted_reason": request.reason}
        )
        return {
            "status": "already_revoked",
            "doc_id": document.doc_id,
            "message": f"Documento já se encontrava revogado. Motivo: {document.revoked_reason}"
        }

    # Validação de permissões da Instituição ou Admin
    if current_user.get("institution") != document.institution_id and current_user.get("role") != "admin":
        # Registrar tentativa de revogação não autorizada
        await AuditService.log_revoke(
            session=db,
            user_email=current_user.get("sub", "unknown"),
            doc_hash=document.doc_hash,
            institution_id=document.institution_id,
            request=req,
            success=False,
            status_code=403,
            details={"reason": "permission_denied"}
        )
        raise HTTPException(status_code=403, detail="Sem permissão para revogar este documento")

    document.revoked = True
    document.revoked_at = datetime.now(CAT)
    document.revoked_reason = request.reason
    document.revoked_by = current_user.get("id")

    await db.commit()
    
    # ✅ REGISTRAR AUDITORIA — Revogação bem-sucedida
    await AuditService.log_revoke(
        session=db,
        user_email=current_user.get("sub", "unknown"),
        doc_hash=document.doc_hash,
        institution_id=document.institution_id,
        request=req,
        success=True,
        status_code=200,
        details={"reason": request.reason, "revoked_by": current_user.get("id")}
    )
    
    return {
        "status": "revoked",
        "doc_id": document.doc_id,
        "revoked_at": document.revoked_at.isoformat(),
        "message": f"Documento revogado com sucesso. Motivo: {request.reason}"
    }
