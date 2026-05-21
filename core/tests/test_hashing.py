import hashlib

def generate_document_hash(file_path: str) -> str:
    """
    Lê um ficheiro PDF localmente e gera o seu hash SHA-256 (Impressão digital).
    Garante o princípio de 'Privacy by Design', processando o arquivo sem expor dados.
    """
    sha256_hash = hashlib.sha256()
    
    # Leitura em blocos para suportar ficheiros grandes sem sobrecarregar a memória
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
            
    return sha256_hash.hexdigest()
