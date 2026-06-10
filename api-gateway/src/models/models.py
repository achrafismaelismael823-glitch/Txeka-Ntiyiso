from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from src.models.base import AuditBase

class Document(AuditBase):
    """
    Document model representando documentos certificados.
    Herda automaticamente created_at e updated_at de AuditBase.
    """
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String(100), unique=True, index=True, nullable=False)
    doc_hash = Column(String(64), unique=True, index=True, nullable=False)
    document_type = Column(String(50), nullable=False)
    institution_id = Column(String(100), nullable=False, index=True)
    certificate_url = Column(String(255))
    qr_code = Column(Text)
    file_name = Column(String(255))
    file_size = Column(Integer)
    issued_by = Column(String(100))
    
    # Campos de revogação 
    revoked = Column(Boolean, default=False, nullable=False, index=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True) 
    revoked_reason = Column(String(500))
    revoked_by = Column(String(100))


class Institution(AuditBase):
    """
    Institution model para gerir emissores.
    """
    __tablename__ = "institutions"
    
    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact_email = Column(String(255))
    subscription_plan = Column(String(50), default="free")
    docs_emitted_month = Column(Integer, default=0)
    credits = Column(Integer, default=80, nullable=False)
    status = Column(String(20), default="active", nullable=False, index=True)
