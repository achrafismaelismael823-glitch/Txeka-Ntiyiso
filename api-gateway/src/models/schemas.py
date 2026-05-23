"""
Schemas Module - DocVerify MZ

Define os modelos de dados (Pydantic v2) para validação estrita
de requisições e respostas do API Gateway.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class DocumentUploadRequest(BaseModel):
    """Modelo para validação de entrada ao submeter um documento para custódia."""
    document_type: str = Field(
        ..., 
        description="Tipo de documento (ex: BI, NUIT, Passaporte, Alvará)",
        examples=["BI"]
    )
    owner_name: str = Field(
        ..., 
        description="Nome completo do titular do documento",
        examples=["Nome do Cidadão"]
    )
    owner_id: str = Field(
        ..., 
        description="Número de identificação único do documento (ex: Número do BI)",
        examples=["110101234567M"]
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Dados adicionais opcionais em formato chave-valor"
    )


class VerificationRequest(BaseModel):
    """Modelo para validação de entrada ao verificar a autenticidade de um hash SHA-256."""
    document_hash: str = Field(
        ..., 
        min_length=64, 
        max_length=64,
        description="O hash SHA-256 hexadecimal completo do documento a ser verificado",
        examples=["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"]
    )


class DocumentResponse(BaseModel):
    """Modelo padrão para resposta de sucesso após custódia ou validação."""
    id: str = Field(..., description="ID único gerado pelo sistema")
    document_type: str = Field(..., description="Tipo do documento validado")
    owner_name: str = Field(..., description="Titular do documento")
    document_hash: str = Field(..., description="Assinatura criptográfica SHA-256 gerada")
    qr_code_data: str = Field(..., description="String de dados assinada contida no QR Code")
    created_at: datetime = Field(..., description="Carimbo de data/hora da operação")
    status: str = Field(default="VALID", description="Estado atual do documento no sistema")


class VerificationResponse(BaseModel):
    """Modelo de resposta para operações de verificação pública."""
    verified: bool = Field(..., description="Indica se o documento é autêntico e existe na custódia")
    message: str = Field(..., description="Mensagem descritiva do resultado da verificação")
    document_details: Optional[DocumentResponse] = Field(
        default=None, 
        description="Detalhes do documento se verificado com sucesso, caso contrário None"
  )
