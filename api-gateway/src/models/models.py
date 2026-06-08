"""
Database Models for Document Management System.

This module contains the core SQLAlchemy ORM models for documents,
institutions, and related audit trails.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class Document(Base):
    """
    Document model representing certified documents.
    
    Attributes:
        id: Primary key (auto-increment)
        doc_id: Unique document identifier (format: DOCTYPE-INST-DATE-UUID)
        doc_hash: SHA-256 hash of the document content (64 hex chars)
        document_type: Type of document (e.g., DUAT, CERTIFICATE)
        institution_id: ID of issuing institution
        certificate_url: Public URL to verify the certificate
        qr_code: Base64-encoded QR code data URI
        file_name: Original filename of the document
        file_size: Size of the original file in bytes
        issued_by: User/system that issued the document
        created_at: Timestamp of document emission
        revoked: Boolean flag indicating if document is revoked
        revoked_at: Timestamp when document was revoked
        revoked_reason: Reason for revocation
        revoked_by: User ID who revoked the document
        updated_at: Last update timestamp
    """
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String, unique=True, index=True, nullable=False)
    doc_hash = Column(String(64), unique=True, index=True, nullable=False)
    document_type = Column(String(50), nullable=False)
    institution_id = Column(String(100), nullable=False, index=True)
    certificate_url = Column(String(255))
    qr_code = Column(Text)
    file_name = Column(String(255))
    file_size = Column(Integer)
    issued_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    revoked = Column(Boolean, default=False, nullable=False, index=True)
    revoked_at = Column(DateTime)
    revoked_reason = Column(String(500))
    revoked_by = Column(String(100))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Institution(Base):
    """
    Institution model for managing certificate issuers.
    
    Attributes:
        id: Unique institution identifier (primary key)
        name: Display name of the institution
        contact_email: Contact email address
        subscription_plan: Current subscription level (free, starter, pro)
        docs_emitted_month: Document count in current month
        credits: Available document emission credits
        status: Account status (active, suspended, inactive)
        created_at: Account creation timestamp
        updated_at: Last modification timestamp
    """
    __tablename__ = "institutions"
    
    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact_email = Column(String(255))
    subscription_plan = Column(String(50), default="free")
    docs_emitted_month = Column(Integer, default=0)
    credits = Column(Integer, default=80, nullable=False)
    status = Column(String(20), default="active", nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
