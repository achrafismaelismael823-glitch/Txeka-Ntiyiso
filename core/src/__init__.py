"""
Core Module - DocVerify MZ

Módulo de criptografia e segurança central.
Exporta utilitários para hashing, QR code generation, validação e segurança.
"""

from .hashing import gerar_hash_sha256, validar_hash
from .qr_generator import gerar_qr_code, validar_qr_code, gerar_qr_code_ficheiro
from .security import (
    sanitizar_entrada,
    validar_hash_sha256,
    validar_documento_id,
    verificar_integridade_dados,
    criar_assinatura_segura,
    validar_assinatura,
)

__version__ = "0.1.0"

__all__ = [
    "gerar_hash_sha256",
    "validar_hash",
    "gerar_qr_code",
    "validar_qr_code",
    "gerar_qr_code_ficheiro",
    "sanitizar_entrada",
    "validar_hash_sha256",
    "validar_documento_id",
    "verificar_integridade_dados",
    "criar_assinatura_segura",
    "validar_assinatura",
]
