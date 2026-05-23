"""
Models Module - Schemas e contratos de dados

Centraliza a definição de modelos Pydantic para validação de requisições e respostas.
"""

from .schemas import (
    VerifyRequest,
    VerifyResponse,
    DadosPublicos,
    VerifyErrorResponse,
)

__all__ = [
    "VerifyRequest",
    "VerifyResponse",
    "DadosPublicos",
    "VerifyErrorResponse",
]
