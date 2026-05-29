"""
QR Generator Core - Função utilitária para criação de QR Codes
"""

import io
import qrcode

def gerar_qr_code(doc_hash: str, doc_id: str) -> bytes:
    """
    Gera um QR Code em formato de imagem (bytes PNG) contendo
    os dados de validação do documento.
    """
    # Conteúdo que será codificado dentro do QR Code
    dados_qr = f"Documento ID: {doc_id}\nHash: {doc_hash}"
    
    # Configuração do gerador de QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(dados_qr)
    qr.make(fit=True)
    
    # Cria a imagem em memória
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Converte a imagem para bytes para poder ser enviada via API
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    
    return img_bytes.getvalue()
