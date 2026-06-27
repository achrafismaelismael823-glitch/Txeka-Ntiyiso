"""
Revocation Routes — Revoga documentos com audit logging imutável.
🇲🇿 Txeka Ntiyiso: apenas admin ou instituição proprietária pode revogar.
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
    """Revoga documento. Apenas admin ou instituição proprietária."""
    doc_id_decoded = unquote(doc_id)
    
    result = await db.execute(select(Document).where(Document.doc_id == doc_id_decoded))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id_decoded} nao encontrado")

    if document.revoked:
        # Documento ja revogado
        await AuditService.log_revoke(
            session=db,
            user_email=current_user.get("email", "unknown"),
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
            "message": f"Documento ja se encontra revogado. Motivo: {document.revoked_reason}"
        }

    # RBAC: admin pode tudo, instituicao so os seus documentos
    if current_user.get("institution") != document.institution_id and current_user.get("role") != "admin":
        # Sem permissao
        await AuditService.log_revoke(
            session=db,
            user_email=current_user.get("email", "unknown"),
            doc_hash=document.doc_hash,
            institution_id=document.institution_id,
            request=req,
            success=False,
            status_code=403,
            details={"reason": "permission_denied"}
        )
        raise HTTPException(status_code=403, detail="Sem permissao para revogar este documento")

    # Revoga
    document.revoked = True
    document.revoked_at = datetime.now(CAT)
    document.revoked_reason = request.reason
    document.revoked_by = current_user.get("id")  

    await db.commit()
    
    # Audit log
    await AuditService.log_revoke(
        session=db,
        user_email=current_user.get("email", "unknown"),
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

