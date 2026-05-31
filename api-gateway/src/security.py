"""
Módulo: security.py
Descrição: Autenticação JWT para instituições B2B e B2G
Versão: 1.0.0 - Fase 1 | Fase 2: Migração para RSA 2048
Licença: Todos Direitos Reservados © 2026 Txeka Ntiyiso LDA
Uso: Licenciamento Institucional B2G/B2B. Proibida cópia sem autorização.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

security = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-txeka-2026")
JWT_ALGORITHM = "HS256"

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
