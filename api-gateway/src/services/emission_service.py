from datetime import datetime
from typing import Optional, List
import uuid
from ..models.emission import EmittedDocument

class EmissionService:
    
    def __init__(self):
        self.storage = {}
    
    def generate_doc_id(self, institution_id: str, document_type: str) -> str:
        timestamp = datetime.utcnow().strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:6].upper()
        return f"{document_type}-{institution_id}-{timestamp}-{unique_id}"
    
    def save_document(
        self,
        doc_id: str,
        hash_sha256: str,
        institution_id: str,
        document_type: str,
        file_name: str,
        file_size: int,
        issued_by: str
    ) -> EmittedDocument:
        document = EmittedDocument(
            doc_id=doc_id,
            hash_sha256=hash_sha256,
            institution_id=institution_id,
            document_type=document_type,
            file_name=file_name,
            file_size=file_size,
            status="active",
            issued_at=datetime.utcnow(),
            issued_by=issued_by
        )
        
        self.storage[doc_id] = document
        self.storage[hash_sha256] = document
        
        return document
    
    def get_document_by_id(self, doc_id: str) -> Optional[EmittedDocument]:
        return self.storage.get(doc_id)
    
    def get_document_by_hash(self, hash_sha256: str) -> Optional[EmittedDocument]:
        return self.storage.get(hash_sha256)
    
    def get_documents_by_institution(self, institution_id: str) -> List[EmittedDocument]:
        return [
            doc for doc in self.storage.values()
            if isinstance(doc, EmittedDocument) and doc.institution_id == institution_id
        ]
    
    def revoke_document(self, doc_id: str, reason: str) -> Optional[EmittedDocument]:
        doc = self.storage.get(doc_id)
        if doc and isinstance(doc, EmittedDocument):
            doc.status = "revoked"
            doc.revoked_at = datetime.utcnow()
            doc.revocation_reason = reason
            self.storage[doc.hash_sha256] = doc
            return doc
        return None
    
    def list_all(self) -> List[EmittedDocument]:
        return [doc for doc in self.storage.values() if isinstance(doc, EmittedDocument)]
