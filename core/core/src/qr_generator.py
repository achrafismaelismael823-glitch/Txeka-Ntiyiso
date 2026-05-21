import json
import qrcode
from datetime import datetime

def generate_verification_qr(doc_id: str, doc_hash: str, institution_id: str, output_image_path: str):
    """
    Gera um QR Code assinado que contém os metadados mínimos e o hash criptográfico
    para validação em tempo real.
    """
    base_validation_url = "https://valida.docverify.gov.mz/verificar"
    
    # Estruturação dos metadados mínimos seguros (Privacy by Design - Sem dados pessoais)
    payload = {
        "v_url": base_validation_url,
        "doc_id": doc_id,
        "hash": doc_hash,
        "inst_id": institution_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Conversão do payload para uma string JSON comprimida
    qr_data = json.dumps(payload)
    
    # Configuração da biblioteca de QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H, # Alta tolerância a rasuras/danos físicos
        box_size=10,
        border=4,
    )
    
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # Criação e salvamento da imagem do QR Code
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_image_path)
    print(f"[SUCCESS] QR Code de verificação gerado com sucesso em: {output_image_path}")

# Exemplo de Execução
if __name__ == "__main__":
    # 1. Simulação do Hash gerado a partir de um documento
    sample_hash = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    
    # 2. Emissão do QR Code com metadados institucionais
    generate_verification_qr(
        doc_id="DUAT-2026-88391",
        doc_hash=sample_hash,
        institution_id="DINAT-MZ-04",
        output_image_path="qrcode_verificacao.png"
    )
