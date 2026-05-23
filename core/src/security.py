"""
Security Module - Utilitários de segurança e proteção

Implementa camadas de validação e sanitização para garantir a integridade
e segurança dos dados processados pelo sistema DocVerify.
"""

import logging
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)


def sanitizar_entrada(entrada: str, max_length: int = 1000) -> str:
    """
    Sanitiza entrada de texto removendo caracteres potencialmente perigosos.
    
    Protege contra injecção de código e manipulação de dados.
    
    Args:
        entrada: String a sanitizar
        max_length: Comprimento máximo permitido
        
    Returns:
        String sanitizada
    """
    if not isinstance(entrada, str):
        raise TypeError("Entrada deve ser uma string")
    
    # Limitar comprimento
    entrada = entrada[:max_length]
    
    # Remover caracteres de controle e caracteres perigosos
    entrada_limpa = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', entrada)
    
    logger.debug("Entrada sanitizada com sucesso")
    
    return entrada_limpa.strip()


def validar_hash_sha256(hash_str: str) -> bool:
    """
    Valida se uma string é um hash SHA-256 válido.
    
    Um hash SHA-256 válido tem:
    - Exactamente 64 caracteres
    - Apenas caracteres hexadecimais (0-9, a-f)
    
    Args:
        hash_str: String a validar
        
    Returns:
        True se válido, False caso contrário
    """
    if not isinstance(hash_str, str):
        return False
    
    if len(hash_str) != 64:
        logger.warning(f"Hash com comprimento inválido: {len(hash_str)}")
        return False
    
    if not all(c in '0123456789abcdef' for c in hash_str.lower()):
        logger.warning("Hash contém caracteres não hexadecimais")
        return False
    
    return True


def validar_documento_id(doc_id: str) -> bool:
    """
    Valida o formato de um identificador de documento.
    
    Padrão esperado: XXX-XXXXX-XXXX (letras, números e hífenes)
    
    Args:
        doc_id: Identificador a validar
        
    Returns:
        True se válido, False caso contrário
    """
    if not isinstance(doc_id, str):
        return False
    
    # Padrão: 3+ caracteres, hífen, 3+ caracteres, hífen, 4+ caracteres
    padrao = r'^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$'
    
    if not re.match(padrao, doc_id.upper()):
        logger.warning(f"ID de documento inválido: {doc_id}")
        return False
    
    return True


def verificar_integridade_dados(dados: dict, campos_obrigatorios: list) -> bool:
    """
    Verifica se um dicionário contém todos os campos obrigatórios.
    
    Args:
        dados: Dicionário a verificar
        campos_obrigatorios: Lista de nomes de campos obrigatórios
        
    Returns:
        True se todos os campos estão presentes e não vazios
    """
    if not isinstance(dados, dict):
        logger.error("Dados devem ser um dicionário")
        return False
    
    for campo in campos_obrigatorios:
        if campo not in dados or dados[campo] is None or dados[campo] == "":
            logger.warning(f"Campo obrigatório ausente ou vazio: {campo}")
            return False
    
    return True


def criar_assinatura_segura(dados: str, chave_secreta: str) -> str:
    """
    Cria uma assinatura HMAC-SHA256 para dados (placeholder para futuro).
    
    Args:
        dados: Dados a assinar
        chave_secreta: Chave secreta para geração da assinatura
        
    Returns:
        String da assinatura em hexadecimal
        
    Note:
        Implementação futura com biblioteca hmac e hashlib
    """
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
    """
    Valida uma assinatura HMAC-SHA256.
    
    Args:
        dados: Dados originais
        assinatura: Assinatura a validar
        chave_secreta: Chave secreta utilizada na geração
        
    Returns:
        True se a assinatura é válida
    """
    assinatura_calculada = criar_assinatura_segura(dados, chave_secreta)
    
    # Comparação constante para evitar timing attacks
    return assinatura_calculada == assinatura
