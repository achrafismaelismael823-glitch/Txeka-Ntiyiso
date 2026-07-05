"""
TXEKA NTIYISO API - AUDIT SERVICE
Servico de auditoria para conformidade legal.
"""

import json
import logging
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import Request

from src.models.audit_log import AuditLog, now_cat

logger = logging.getLogger("uvicorn")


class AuditService:
    """
    Servico responsavel por registrar todas as acoes auditaveis.
    
    Acoes auditaveis:
    - EMIT: Emissao de documento
    - VERIFY: Verificacao de documento
    - REVOKE: Revogacao de documento
    - LOGIN: Autenticacao bem-sucedida
    - LOGOUT: Encerramento de sessao
    - EXPORT: Exportacao de dados
    - DELETE: Eliminacao de dados
    - SYSTEM: Acoes do sistema
    
    Todos os timestamps em CAT (UTC+2) - horario de Mocambique.
    """
    
    @staticmethod
    async def log(
        session: AsyncSession,
        user_email: str,
        action: str,
        resource_type: str,
        resource_id: str,
        institution_id: Optional[str] = None,
        request: Optional[Request] = None,
        success: bool = True,
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        try:
            ip_address = None
            user_agent = None
            request_path = None
            request_method = None
            
            if request is not None:
                ip_address = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
                request_path = str(request.url.path)
                request_method = request.method
            
            audit = AuditLog(
                user_email=user_email,
                action=action.upper(),
                resource_type=resource_type.upper(),
                resource_id=str(resource_id),
                institution_id=institution_id,
                ip_address=ip_address,
                user_agent=user_agent,
                request_path=request_path,
                request_method=request_method,
                status_code=status_code,
                success=success,
                details=json.dumps(details) if details else None,
                timestamp=now_cat(),
                created_at=now_cat(),
            )
            
            session.add(audit)
            await session.commit()
            
            logger.info(f"[AUDIT] {action} by {user_email} on {resource_type}:{resource_id}")
            return audit
            
        except Exception as e:
            logger.error(f"[AUDIT ERROR] Falha ao registrar auditoria: {e}")
            await session.rollback()
            raise
    
    @staticmethod
    async def log_emit(session, user_email, doc_hash, institution_id, request=None, success=True, status_code=None, details=None):
        return await AuditService.log(session, user_email, "EMIT", "DOCUMENT", doc_hash, institution_id, request, success, status_code, details)
    
    @staticmethod
    async def log_verify(session, user_email, doc_hash, institution_id=None, request=None, success=True, status_code=None, details=None):
        return await AuditService.log(session, user_email, "VERIFY", "DOCUMENT", doc_hash, institution_id, request, success, status_code, details)
    
    @staticmethod
    async def log_revoke(session, user_email, doc_hash, institution_id, request=None, success=True, status_code=None, details=None):
        return await AuditService.log(session, user_email, "REVOKE", "DOCUMENT", doc_hash, institution_id, request, success, status_code, details)
    
    @staticmethod
    async def get_logs(session, action=None, resource_type=None, user_email=None, institution_id=None, start_date=None, end_date=None, limit=100, offset=0):
        query = select(AuditLog).order_by(desc(AuditLog.timestamp))
        if action: query = query.where(AuditLog.action == action.upper())
        if resource_type: query = query.where(AuditLog.resource_type == resource_type.upper())
        if user_email: query = query.where(AuditLog.user_email == user_email)
        if institution_id: query = query.where(AuditLog.institution_id == institution_id)
        if start_date: query = query.where(AuditLog.timestamp >= start_date)
        if end_date: query = query.where(AuditLog.timestamp <= end_date)
        query = query.limit(limit).offset(offset)
        result = await session.execute(query)
        return result.scalars().all()
    

    @staticmethod
    async def get_stats(
        session: AsyncSession,
        institution_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retorna estatísticas agregadas dos logs de auditoria."""
        from sqlalchemy import func, and_, desc
        from datetime import datetime, timedelta

        filters = []
        if institution_id:
            filters.append(AuditLog.institution_id == institution_id)
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                filters.append(AuditLog.timestamp >= start_dt)
            except ValueError:
                pass
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                filters.append(AuditLog.timestamp <= end_dt)
            except ValueError:
                pass

        where_clause = and_(*filters) if filters else None

        # Ações por tipo
        actions_query = select(AuditLog.action, func.count(AuditLog.id).label("count")).group_by(AuditLog.action)
        if where_clause is not None:
            actions_query = actions_query.where(where_clause)
        actions_result = await session.execute(actions_query)
        actions_by_type = {row.action: row.count for row in actions_result.all()}

        # Verificações sucesso vs falha
        verify_success = select(func.count(AuditLog.id)).where(and_(AuditLog.action == "VERIFY", AuditLog.success == True))
        verify_failed = select(func.count(AuditLog.id)).where(and_(AuditLog.action == "VERIFY", AuditLog.success == False))
        if where_clause is not None:
            verify_success = verify_success.where(where_clause)
            verify_failed = verify_failed.where(where_clause)
        total_verify_success = (await session.execute(verify_success)).scalar() or 0
        total_verify_failed = (await session.execute(verify_failed)).scalar() or 0

        # Emitidos vs revogados
        emit_count = select(func.count(AuditLog.id)).where(AuditLog.action == "EMIT")
        revoke_count = select(func.count(AuditLog.id)).where(AuditLog.action == "REVOKE")
        if where_clause is not None:
            emit_count = emit_count.where(where_clause)
            revoke_count = revoke_count.where(where_clause)
        total_emitted = (await session.execute(emit_count)).scalar() or 0
        total_revoked = (await session.execute(revoke_count)).scalar() or 0

        # Verificações por dia (últimos 30 dias)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        daily_query = select(func.date(AuditLog.timestamp).label("date"), func.count(AuditLog.id).label("count")).where(
            and_(AuditLog.action == "VERIFY", AuditLog.timestamp >= thirty_days_ago)
        ).group_by(func.date(AuditLog.timestamp)).order_by(func.date(AuditLog.timestamp))
        if institution_id:
            daily_query = daily_query.where(AuditLog.institution_id == institution_id)
        daily_result = await session.execute(daily_query)
        verifications_by_day = [{"date": str(row.date), "count": row.count} for row in daily_result.all()]

        # Top instituições
        top_institutions_query = select(AuditLog.institution_id, func.count(AuditLog.id).label("count")).where(
            AuditLog.institution_id.isnot(None)
        ).group_by(AuditLog.institution_id).order_by(desc("count")).limit(10)
        if where_clause is not None:
            top_institutions_query = top_institutions_query.where(where_clause)
        top_institutions_result = await session.execute(top_institutions_query)
        top_institutions = [{"institution_id": row.institution_id, "count": row.count} for row in top_institutions_result.all()]

        # Total geral
        total_logs_query = select(func.count(AuditLog.id))
        if where_clause is not None:
            total_logs_query = total_logs_query.where(where_clause)
        total_logs = (await session.execute(total_logs_query)).scalar() or 0

        # Logs recentes (7 dias)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_query = select(func.count(AuditLog.id)).where(AuditLog.timestamp >= seven_days_ago)
        if where_clause is not None:
            recent_query = recent_query.where(where_clause)
        recent_logs = (await session.execute(recent_query)).scalar() or 0

        return {
            "summary": {
                "total_logs": total_logs,
                "recent_logs_7d": recent_logs,
                "total_emitted_documents": total_emitted,
                "total_revoked_documents": total_revoked,
                "active_documents": total_emitted - total_revoked,
                "total_verifications": total_verify_success + total_verify_failed,
                "verification_success_rate": round(
                    (total_verify_success / (total_verify_success + total_verify_failed) * 100), 2
                ) if (total_verify_success + total_verify_failed) > 0 else 0,
            },
            "actions_by_type": actions_by_type,
            "verifications": {
                "success": total_verify_success,
                "failed": total_verify_failed,
                "success_rate_percent": round(
                    (total_verify_success / (total_verify_success + total_verify_failed) * 100), 2
                ) if (total_verify_success + total_verify_failed) > 0 else 0,
            },
            "verifications_by_day": verifications_by_day,
            "top_institutions": top_institutions,
            "period": {
                "start": start_date,
                "end": end_date,
                "last_30_days": len(verifications_by_day),
            },
        }

    @staticmethod
    async def get_document_history(session, doc_hash):
        query = select(AuditLog).where(AuditLog.resource_id == doc_hash).order_by(desc(AuditLog.timestamp))
        result = await session.execute(query)
        return result.scalars().all()
