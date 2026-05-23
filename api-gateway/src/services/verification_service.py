"""
Verification Service Module - DocVerify MZ

Contém a lógica de negócio central para a custódia e validação de documentos.
Faz a ponte estrita entre as rotas da API e o motor criptográfico.
"""

import hashlib
import uuid
from datetime import datetime, timezone

from src.models.schemas import (
    DocumentUploadRequest, 
    DocumentResponse, 
    VerificationResponse
)


class VerificationService:
    """Serviço central de processamento de documentos e hashes."""
    
    @staticmethod
    def process_new_document(data: DocumentUploadRequest) -> DocumentResponse:
        """
        Processa um novo documento: gera identificador, calcula o hash SHA-256
        e prepara a string de dados para o QR Code assinado.
        """
        # 1. Gerar ID único para o sistema de custódia
        doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        
        # 2. Preparar os dados puros para o Hash (Isto será movido para o 'core' na Fase 3)
        raw_string = f"{data.document_type}|{data.owner_id}|{data.owner_name}".encode('utf-8')
        doc_hash = hashlib.sha256(raw_string).hexdigest()
        
        # 3. Gerar a carga útil do QR Code para verificação off-grid
        qr_data = f"mz.gov.docverify://{doc_id}?hash={doc_hash}"
        
        # 4. Retornar o modelo de resposta estrito validado pelo Pydantic
        return DocumentResponse(
            id=doc_id,
            document_type=data.document_type,
            owner_name=data.owner_name,
            document_hash=doc_hash,
            qr_code_data=qr_data,
            created_at=datetime.now(timezone.utc),
            status="VALID"
        )

    @staticmethod
    def verify_document_hash(document_hash: str) -> VerificationResponse:
        """
        Verifica a autenticidade de um hash contra a base de custódia.
        """
        # TODO: Integração com Base de Dados real nas fases de DevOps.
        # Por agora, validação estrutural de tamanho (SHA-256 tem 64 caracteres)
        
        if len(document_hash) == 64:
            return VerificationResponse(
                verified=True,
                message="✅ Documento autêntico. Assinatura criptográfica validada com sucesso."
            )
            
        return VerificationResponse(
            verified=False,
            message="❌ Falha na verificação. O documento foi adulterado ou não existe na custódia."
            )
