from datetime import datetime
from typing import Optional, List
import uuid
import hashlib
from fastapi import HTTPException
from sqlalchemy.orm import Session
from..models.models import Document, Institution

class EmissionService:

    def __init__(self, db: Session):
        self.db = db 

    def generate_doc_id(self, institution_id: str, document_type: str) -> str:
        timestamp = datetime.utcnow().strftime('%Y%m%d')
        unique_id = str(uuid.uuid4())[:6].upper()
        return f"{document_type}-{institution_id}-{timestamp}-{unique_id}"

    def certify_document(
        self,
        institution_id: str,
        document_type: str,
        file_name: str,
        content: str,
        issued_by: str
    ) -> dict:
        
        institution = self.db.query(Institution).filter(
            Institution.id == institution_id
        ).first()

        if not institution:
            raise HTTPException(status_code=404, detail="Instituição não encontrada")

        if institution.status!= "active":
            raise HTTPException(status_code=403, detail="Instituição suspensa")

         if institution.credits <= 0:           
  
              if institution.subscription_plan == "free":
                 raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "Demo expirada",
                        "message": "Créditos demo zerados. Contrate Starter 100 créditos MT 2.000"
                    }
                )
                
            else:
                raise HTTPException(
                      status_code=402,
                    detail=f"Pacote {institution.subscription_plan} esgotado. Recarregue"
                )
                
        #  Verifica hash duplicado
        hash_sha256 = hashlib.sha256(content.encode()).hexdigest()
        existing = self.db.query(Document).filter(Document.doc_hash == hash_sha256).first()
        if existing:
            
            raise HTTPException(status_code=409, detail="Documento já certificado")

        # Gerar ID + Debitar crédito
        doc_id = self.generate_doc_id(institution_id, document_type)
        institution.credits -= 1
        institution.docs_emitted_month += 1

        # Salva no DB 
        document = Document(
            doc_id=doc_id,
            doc_hash=hash_sha256,
            document_type=document_type,
            institution_id=institution_id,
            certificate_url=f"https://verify.docutrust.co.mz/{doc_id}",
            qr_code=f"QR_{doc_id}"
        )

        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)

        return {
            "doc_id": document.doc_id,
            "certificate_url": document.certificate_url,
            "credits_remaining": institution.credits
        }

    def get_document_by_id(self, doc_id: str) -> Optional[Document]:
        return self.db.query(Document).filter(Document.doc_id == doc_id).first()

    def get_document_by_hash(self, hash_sha256: str) -> Optional[Document]:
        return self.db.query(Document).filter(Document.doc_hash == hash_sha256).first()

    def revoke_document(self, doc_id: str, reason: str) -> Optional[Document]:
        doc = self.get_document_by_id(doc_id)
        if doc:
            doc.revoked = True
            doc.revoked_at = datetime.utcnow()
            doc.revoked_reason = reason
            self.db.commit()
            return doc
        return None
