from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String, unique=True, index=True, nullable=False)
    doc_hash = Column(String(64), unique=True, index=True, nullable=False)
    document_type = Column(String(50), nullable=False)
    institution_id = Column(String(100), nullable=False)
    certificate_url = Column(String(255))
    qr_code = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked = Column(Boolean, default=False, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    revoked_reason = Column(String(255), nullable=True)

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(100), primary_key=True, index=True)  
    name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=True)
    
    # Subscrição 
    subscription_active = Column(Boolean, default=False, nullable=False)
    subscription_plan = Column(String(50), default="free")  
    subscription_expires_at = Column(DateTime, nullable=True)
    docs_emitted_month = Column(Integer, default=0)  
    
    # Motor de Lucro - regra de equidade
    credits = Column(Integer, default=80, nullable=False)  
    status = Column(String(20), default="active", nullable=False) 
    
    # Auditoria
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
