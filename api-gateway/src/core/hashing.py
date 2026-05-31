"""
Hashing Module - Algoritmos criptográficos SHA-256

Implementa geração e validação de hashes SHA-256 para custódia segura de documentos.
"""

import hashlib
import logging
from typing import Union

logger = logging.getLogger(__name__)


def gerar_hash_sha256(conteudo: Union[bytes, str]) -> str:
    """
    Gera um hash SHA-256 a partir de conteúdo binário ou textual.
    
    Args:
        conteudo: Bytes ou string a ser hashificada
        
    Returns:
        String hexadecimal do hash SHA-256 (64 caracteres)
        
    Raises:
        TypeError: Se o conteúdo não for bytes ou string
    """
    if isinstance(conteudo, str):
        conteudo = conteudo.encode('utf-8')
    
    if not isinstance(conteudo, bytes):
        raise TypeError("Conteúdo deve ser bytes ou string")
    
    sha256_hash = hashlib.sha256()
    sha256_hash.update(conteudo)
    resultado = sha256_hash.hexdigest()
    
    logger.debug(f"Hash gerado: {resultado[:8]}...")
    
    return resultado


def validar_hash(conteudo: Union[bytes, str], hash_esperado: str) -> bool:
    """
    Valida se o conteúdo corresponde ao hash esperado.
    
    Args:
        conteudo: Conteúdo a validar
        hash_esperado: Hash SHA-256 esperado (64 caracteres hexadecimais)
        
    Returns:
        True se o hash corresponde, False caso contrário
    """
    hash_calculado = gerar_hash_sha256(conteudo)
    
    if hash_calculado == hash_esperado:
        logger.info("Validação de hash: SUCESSO")
        return True
    
    logger.warning("Validação de hash: FALHA")
    return False


def gerar_hash_ficheiro(caminho_ficheiro: str) -> str:
    """
    Gera um hash SHA-256 a partir de um ficheiro.
    
    Processa o ficheiro em chunks para economizar memória com ficheiros grandes.
    
    Args:
        caminho_ficheiro: Caminho do ficheiro
        
    Returns:
        String hexadecimal do hash SHA-256
    """
    sha256_hash = hashlib.sha256()
    
    with open(caminho_ficheiro, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha256_hash.update(chunk)
    
    resultado = sha256_hash.hexdigest()
    logger.info(f"Hash de ficheiro gerado: {resultado[:8]}...")
    
    return resultado
