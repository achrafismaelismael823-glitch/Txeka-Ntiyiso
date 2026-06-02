"""
Data Schemas - Pydantic models para validação de requisições e respostas
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class VerifyRequest(BaseModel):
    """Schema para requisição de verificação de documento"""
    doc_hash: str = Field(
        ..., 
        min_length=64, 
        max_length=64,
        description="Hash SHA-256 do documento (64 caracteres hexadecimais)"
    )
    institution_id: Optional[str] = Field(
        None,
        description="ID opcional da instituição verificadora"
    )


class DadosPublicos(BaseModel):
    """Schema para dados públicos de um documento verificado"""
    doc_id: str = Field(..., description="Identificador único do documento")
    document_type: str = Field(..., description="Tipo de documento")
    institution_id: str = Field(..., description="ID da instituição que emitiu")
    created_at: Optional[str] = Field(None, description="Data de emissão")


class VerifyResponse(BaseModel):
    """Schema para resposta bem-sucedida de verificação"""
    status: str = Field(..., description="Status da verificação")
    dados_publicos: Optional[DadosPublicos] = Field(
        None,
        description="Dados públicos do documento se encontrado"
    )
    qr_code: Optional[str] = Field(
        None,
        description="Código QR em base64"
    )


class VerifyErrorResponse(BaseModel):
    """Schema para resposta de erro"""
    status: str = Field(..., description="Status de erro")
    message: str = Field(..., description="Mensagem de erro legível")
    detail: Optional[str] = Field(None, description="Detalhes técnicos do erro")
