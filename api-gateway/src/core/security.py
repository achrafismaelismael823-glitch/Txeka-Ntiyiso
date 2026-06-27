"""Security utils — sanitização, validação e HMAC."""

import logging
import re
import os
import hmac
import hashlib

logger = logging.getLogger(__name__)


def sanitizar_entrada(entrada: str, max_length: int = 1000) -> str:
    """Sanitiza entrada de texto."""
    if not isinstance(entrada, str):
        raise TypeError("Entrada deve ser string")
    entrada = entrada[:max_length]
    return re.sub(r'[\x00-\x1f\x7f-\x9f]', '', entrada).strip()


def validar_hash_sha256(hash_str: str) -> bool:
    """Valida hash SHA-256 (64 chars hex)."""
    if not isinstance(hash_str, str) or len(hash_str) != 64:
        return False
    return all(c in '0123456789abcdef' for c in hash_str.lower())


def validar_documento_id(doc_id: str) -> bool:
    """Valida formato de doc_id."""
    if not isinstance(doc_id, str):
        return False
    return bool(re.match(r'^[A-Z0-9]+(-[A-Z0-9]+)+$', doc_id.upper()))


def verificar_integridade_dados(dados: dict, campos_obrigatorios: list) -> bool:
    """Verifica campos obrigatórios em dict."""
    if not isinstance(dados, dict):
        return False
    return all(dados.get(campo) not in (None, "") for campo in campos_obrigatorios)


def criar_assinatura_segura(dados: str, chave_secreta: str) -> str:
    """Cria assinatura HMAC-SHA256."""
    return hmac.new(chave_secreta.encode(), dados.encode(), hashlib.sha256).hexdigest()


def validar_assinatura(dados: str, assinatura: str, chave_secreta: str) -> bool:
    """Valida assinatura HMAC-SHA256."""
    return hmac.compare_digest(assinatura, criar_assinatura_segura(dados, chave_secreta))

