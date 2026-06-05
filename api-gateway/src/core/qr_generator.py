"""
QR Generator Core - Função utilitária para criação de QR Codes
"""

import io
import qrcode
from qrcode.image.pil import PilImage

def gerar_qr_code(doc_hash: str, doc_id: str) -> bytes:
    """
    Gera um QR Code em formato de imagem PNG contendo
    os dados de validação do documento.

    Args:
        doc_hash: Hash SHA256 do documento
        doc_id: ID único do documento

    Returns:
        bytes: Imagem PNG do QR Code
    """
    # Conteúdo que será codificado dentro do QR Code
    dados_qr = f"Documento ID: {doc_id}\nHash: {doc_hash}"
    
    # Configuração do gerador de QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    
    qr.add_data(dados_qr)
    qr.make(fit=True)
    
    # Cria a imagem com Pillow usando PilImage do qrcode
    img = qr.make_image(image_factory=PilImage)
    
    # Converte a imagem para bytes para poder ser enviada via API
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG", optimize=True)
    img_bytes.seek(0)
    
    return img_bytes.getvalue()
