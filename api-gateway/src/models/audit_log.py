"""
TXEKA NTIYISO API - AUDIT LOG MODEL
Legal compliance: Decreto 59/2019, Lei 3/2017, Banco de Mocambique
"""

import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, Index
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base

# CAT = Central Africa Time (UTC+2) - Fuso horario de Mocambique
CAT = timezone(timedelta(hours=2), name="CAT")


def now_cat() -> datetime:
    """Retorna datetime no fuso horario de Mocambique (CAT, UTC+2)."""
    return datetime.now(CAT)


class AuditLog(Base):
    """
    Tabela de auditoria para rastreabilidade legal.
    
    Conformidade:
    - Decreto 59/2019: Retencao minima 20 anos
    - Lei 3/2017: Nao-repudio de timestamps
    - Banco de Mocambique: Rastreabilidade de transacoes
    """
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_email = Column(String(255), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(255), nullable=False, index=True)
    institution_id = Column(String(100), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    request_path = Column(String(500), nullable=True)
    request_method = Column(String(10), nullable=True)
    status_code = Column(Integer, nullable=True)
    success = Column(Boolean, nullable=False, default=True)
    details = Column(Text(), nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=now_cat)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_cat)
    
    __table_args__ = (
        Index('ix_audit_logs_timestamp', 'timestamp'),
        Index('ix_audit_logs_action_timestamp', 'action', 'timestamp'),
        Index('ix_audit_logs_user_timestamp', 'user_email', 'timestamp'),
        Index('ix_audit_logs_institution_timestamp', 'institution_id', 'timestamp'),
    )
    
    def to_dict(self) -> dict:
        def to_cat(dt):
            """Converte datetime para CAT (UTC+2) com formato ISO."""
            if dt is None:
                return None
            # Se nao tem timezone, assume UTC (como PostgreSQL guarda)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            # Converte para CAT (UTC+2)
            cat_dt = dt.astimezone(CAT)
            return cat_dt.isoformat()
        
        return {
            "id": str(self.id),
            "user_email": self.user_email,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "institution_id": self.institution_id,
            "ip_address": self.ip_address,
            "request_path": self.request_path,
            "request_method": self.request_method,
            "status_code": self.status_code,
            "success": self.success,
            "details": self.details,
            "timestamp": to_cat(self.timestamp),
            "created_at": to_cat(self.created_at),
        }
