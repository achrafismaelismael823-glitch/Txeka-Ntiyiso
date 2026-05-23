"""
Core Module - DocVerify MZ

Módulo de criptografia e segurança central.
Exporta utilitários para hashing, QR code generation e validação.
"""

from .hashing import gerar_hash_sha256, validar_hash

__version__ = "0.1.0"
__all__ = ["gerar_hash_sha256
