"""Password Hashing Module — bcrypt utilities.

Responsabilidade: hashing e verificação de passwords com bcrypt.
Módulo de baixo nível, sem dependências do framework.
"""

import bcrypt


def get_password_hash(password: str) -> str:
    """Gera hash bcrypt de um password em plaintext."""
    password_bytes = password.encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se um password em plaintext corresponde ao hash."""
    plain_bytes = plain_password.encode("utf-8")
    hash_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(plain_bytes, hash_bytes)
