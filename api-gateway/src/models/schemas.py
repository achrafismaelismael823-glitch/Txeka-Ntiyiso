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
    instituicao: str = Field(..., description="Nome da instituição que validou")
    estado: str = Field(..., description="Estado atual do documento (ativo, revogado, etc)")
    revogado: bool = Field(default=False, description="Se o documento foi revogado")
    data_verificacao: datetime = Field(..., description="Data e hora da verificação")


class VerifyResponse(BaseModel):
    """Schema para resposta bem-sucedida de verificação"""
    status: str = Field(..., description="Status da verificação (success, not_found)")
    dados_publicos: Optional[DadosPublicos] = Field(
        None,
        description="Dados públicos do documento se encontrado"
    )


class VerifyErrorResponse(BaseModel):
    """Schema para resposta de erro"""
    status: str = Field(..., description="Status de erro")
    message: str = Field(..., description="Mensagem de erro legível")
    detail: Optional[str] = Field(None, description="Detalhes técnicos do erro")
