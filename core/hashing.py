import hashlib

def gerar_hash_sha256(conteudo_binario: bytes) -> str:
    """
    Recebe o arquivo em formato binário e calcula o hash SHA-256 único.
    Garante a imutabilidade do documento.
    """
    sha256_hash = hashlib.sha256()
    sha256_hash.update(conteudo_binario)
    return sha256_hash.hexdigest()
