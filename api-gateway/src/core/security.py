"""
Security Module - Utilitários de segurança e proteção + JWT

Implementa camadas de validação, sanitização e autenticação JWT
para garantir a integridade e segurança dos dados do DocVerify.
Versão: 1.0.0 - Fase 1 | Fase 2: Migração para RSA 2048
Licença: Todos Direitos Reservados © 2026 Txeka Ntiyiso LDA
"""

import logging
import re
import os
from typing import Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

logger = logging.getLogger(__name__)

# ===== JWT CONFIG =====
security = HTTPBearer()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-txeka-2026")
JWT_ALGORITHM = "HS256"

# ===== SANITIZAÇÃO E VALIDAÇÃO =====

def sanitizar_entrada(entrada: str, max_length: int = 1000) -> str:
    """Sanitiza entrada de texto removendo caracteres potencialmente perigosos."""
    if not isinstance(entrada, str):
        raise TypeError("Entrada deve ser uma string")

    entrada = entrada[:max_length]
    entrada_limpa = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', entrada)

    logger.debug("Entrada sanitizada com sucesso")
    return entrada_limpa.strip()

def validar_hash_sha256(hash_str: str) -> bool:
    """Valida se uma string é um hash SHA-256 válido."""
    if not isinstance(hash_str, str):
        return False
    if len(hash_str)!= 64:
        logger.warning(f"Hash com comprimento inválido: {len(hash_str)}")
        return False
    if not all(c in '0123456789abcdef' for c in hash_str.lower()):
        logger.warning("Hash contém caracteres não hexadecimais")
        return False
    return True

def validar_documento_id(doc_id: str) -> bool:
    """Valida o formato de um identificador de documento."""
    if not isinstance(doc_id, str):
        return False
    padrao = r'^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$'
    if not re.match(padrao, doc_id.upper()):
        logger.warning(f"ID de documento inválido: {doc_id}")
        return False
    return True

def verificar_integridade_dados(dados: dict, campos_obrigatorios: list) -> bool:
    """Verifica se um dicionário contém todos os campos obrigatórios."""
    if not isinstance(dados, dict):
        logger.error("Dados devem ser um dicionário")
        return False
    for campo in campos_obrigatorios:
        if campo not in dados or dados[campo] is None or dados[campo] == "":
            logger.warning(f"Campo obrigatório ausente ou vazio: {campo}")
            return False
    return True

def criar_assinatura_segura(dados: str, chave_secreta: str) -> str:
    """Cria uma assinatura HMAC-SHA256 para dados."""
    import hmac
    import hashlib
    assinatura = hmac.new(
        chave_secreta.encode(),
        dados.encode(),
        hashlib.sha256
    ).hexdigest()
    logger.debug("Assinatura segura criada")
    return assinatura

def validar_assinatura(dados: str, assinatura: str, chave_secreta: str) -> bool:
    """Valida uma assinatura HMAC-SHA256."""
    assinatura_calculada = criar_assinatura_segura(dados, chave_secreta)
    return assinatura_calculada == assinatura

# ===== JWT AUTH =====

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifica token JWT Bearer para acesso B2G/B2B
    Fase 1: HS256 com secret key
    Fase 2: RS256 com certificado RSA institucional
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return {
            "institution": payload.get("sub", "txeka_system"),
            "role": payload.get("role", "institution"),
            "status": "authenticated"
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
    )
