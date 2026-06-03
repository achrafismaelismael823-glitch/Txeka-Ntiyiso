from sqlalchemy import Column, Integer, String, DateTime, Text
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
