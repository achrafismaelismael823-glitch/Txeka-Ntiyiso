from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from src.database import AuditBase


class Document(AuditBase):
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
    
    revoked = Column(Boolean, default=False, nullable=False, index=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String(500))
    revoked_by = Column(String(100))


class Institution(AuditBase):
    __tablename__ = "institutions"
    
    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact_email = Column(String(255))
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), default="institution", nullable=False)
    subscription_plan = Column(String(50), default="free")
    docs_emitted_month = Column(Integer, default=0)
    credits = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)
    api_key = Column(String(255), unique=True, index=True, nullable=True)
    api_key_hash = Column(String(255), nullable=False)  # ✅
    approved = Column(Boolean, default=False, nullable=False)


class CreditTransaction(AuditBase):
    __tablename__ = "credit_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(String(100), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    type = Column(String(20), nullable=False)
    description = Column(String(500))
    payment_method = Column(String(50))
    payment_reference = Column(String(100))
    notes = Column(Text())
    created_by = Column(String(100))
