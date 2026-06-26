"""
Revocation Routes - Endpoints para revogação de documentos com audit logging.

  Contexto Txeka Ntiyiso:
    Sistema nacional de certificação digital moçambicano.
    Cada revogação gera um rastro de auditoria imutável conforme
    requisitos do INAGE e legislação de documentos digitais.

  Segurança:
    - Apenas admin ou instituição proprietária pode revogar
    - Audit logs registram IP, User-Agent e timestamp CAT
    - Documentos revogados NUNCA são eliminados (soft delete proibido)
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

# CAT = Central Africa Time (UTC+2) - Fuso horário oficial de Moçambique
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
    """
    Revoga um documento emitido e gera rastro de auditoria imutável.
    
      Regra de negócio:
        Um documento revogado mantém-se na base de dados como
        "revoked=true" para preservar o histórico legal.
        NUNCA é eliminado fisicamente (soft delete proibido).
    
    Args:
        doc_id: Identificador único do documento (ex: DUAT-INAGE-20260626-XXXXXX)
        request: Payload com motivo da revogação (máx 255 chars)
        req: Request object para extrair metadados (IP, User-Agent)
        db: AsyncSession do SQLAlchemy
        current_user: Dict com claims do JWT (email, role, id, institution)
    
    Returns:
        Dict com status "revoked" ou "already_revoked", doc_id e timestamp CAT
    
    Raises:
        HTTPException 404: Documento não encontrado na base de dados
        HTTPException 403: Utilizador sem permissão (instituição diferente e não-admin)
    
      Nota técnica:
        O email é extraído do claim "email" do JWT, com fallback para "sub"
        caso o token seja legado ou de integração B2B/B2G.
    """
    doc_id_decoded = unquote(doc_id)
    
    result = await db.execute(select(Document).where(Document.doc_id == doc_id_decoded))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail=f"Documento {doc_id_decoded} não encontrado")

    if document.revoked:
        # Tentativa de revogação duplicada — loga para auditoria de segurança
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
            "message": f"Documento já se encontrava revogado. Motivo: {document.revoked_reason}"
        }

    # Validação RBAC: admin pode tudo, instituição só os seus documentos
    if current_user.get("institution") != document.institution_id and current_user.get("role") != "admin":
        # Tentativa não autorizada — potencial ataque de insider
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
        raise HTTPException(status_code=403, detail="Sem permissão para revogar este documento")

    #  Revogação efetiva — atualiza flags e timestamp CAT
    document.revoked = True
    document.revoked_at = datetime.now(CAT)
    document.revoked_reason = request.reason
    document.revoked_by = current_user.get("id")  # UUID do utilizador do JWT

    await db.commit()
    
    #  Registro de auditoria — sucesso com metadados completos
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
