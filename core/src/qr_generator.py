"""
QR Code Generator Module - Geração de códigos QR para custódia segura

Implementa a geração de códigos QR que encodam informações criptográficas
dos documentos, permitindo verificação rápida e confiável via dispositivos móveis.
"""

import logging
from typing import Optional
import qrcode
from io import BytesIO

logger = logging.getLogger(__name__)


def gerar_qr_code(
    doc_hash: str,
    doc_id: str,
    base_url: str = "https://docverify.mz"
) -> bytes:
    """
    Gera um código QR que encoda o hash e ID de um documento.
    
    O código QR, quando escaneado, direciona para uma URL de verificação
    que inclui o hash do documento para confirmação instantânea.
    
    Args:
        doc_hash: Hash SHA-256 do documento (64 caracteres)
        doc_id: Identificador legível do documento
        base_url: URL base para construir o link de verificação
        
    Returns:
        Bytes da imagem PNG do código QR
        
    Raises:
        ValueError: Se o hash não tiver 64 caracteres
    """
    if len(doc_hash) != 64:
        raise ValueError("Hash SHA-256 deve ter exactamente 64 caracteres")
    
    # Construir URL de verificação
    url_verificacao = f"{base_url}/api/v1/verify/{doc_hash}"
    
    logger.info(f"Gerando QR code para documento {doc_id}")
    
    # Criar instância de QR code com configurações otimizadas
    qr = qrcode.QRCode(
        version=1,  # Tamanho será ajustado automaticamente se necessário
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # 30% de recuperação
        box_size=10,  # Tamanho de cada caixa em pixels
        border=4,    # Margem em volta do código
    )
    
    # Adicionar dados e gerar
    qr.add_data(url_verificacao)
    qr.make(fit=True)
    
    # Converter para imagem PIL
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Converter para bytes PNG
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    qr_bytes = buffer.getvalue()
    
    logger.debug(f"QR code gerado com sucesso: {len(qr_bytes)} bytes")
    
    return qr_bytes


def validar_qr_code(data_qr: str) -> Optional[str]:
    """
    Valida e extrai o hash de um código QR decodificado.
    
    Args:
        data_qr: Dados decodificados do QR code
        
    Returns:
        Hash SHA-256 extraído ou None se inválido
    """
    try:
        # Esperamos que o QR contenha uma URL com o hash no final
        if "/verify/" in data_qr:
            hash_extraido = data_qr.split("/verify/")[-1]
            
            if len(hash_extraido) == 64 and all(c in "0123456789abcdef" for c in hash_extraido):
                logger.info(f"QR code validado com sucesso")
                return hash_extraido
        
        logger.warning(f"QR code inválido ou mal formatado")
        return None
        
    except Exception as e:
        logger.error(f"Erro ao validar QR code: {str(e)}")
        return None


def gerar_qr_code_ficheiro(
    doc_hash: str,
    doc_id: str,
    caminho_saida: str
) -> bool:
    """
    Gera um código QR e salva-o directamente num ficheiro.
    
    Args:
        doc_hash: Hash SHA-256 do documento
        doc_id: Identificador do documento
        caminho_saida: Caminho onde guardar a imagem PNG
        
    Returns:
        True se gerado com sucesso, False caso contrário
    """
    try:
        qr_bytes = gerar_qr_code(doc_hash, doc_id)
        
        with open(caminho_saida, 'wb') as f:
            f.write(qr_bytes)
        
        logger.info(f"QR code salvo em: {caminho_saida}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao guardar QR code: {str(e)}")
        return False
