# SECURITY_FIX.md — Txeka Ntiyiso

> **Versao:** 2.0.0  
> **Fase:** Fase 2 — Gestao de Instituicoes & Controlo de Creditos  
> **Ultima atualizacao:** 22/07/2026  
> **Classificacao:** CONFIDENCIAL — Uso interno da equipa de desenvolvimento

---

## Indice

- [Visao Geral](#visao-geral)
- [Hardening do JWT e Secrets](#hardening-do-jwt-e-secrets)
- [Hardening da Base de Dados](#hardening-da-base-de-dados)
- [Hardening da API](#hardening-da-api)
- [Hardening do Deploy](#hardening-do-deploy)
- [Checklist de Seguranca Pre-Deploy](#checklist-de-seguranca-pre-deploy)
- [Incident Response](#incident-response)
- [Referencias](#referencias)

---

## Visao Geral

Este documento consolida todas as medidas de hardening de seguranca aplicadas e pendentes no projeto Txeka Ntiyiso. A seguranca e tratada como **camada zero** da arquitetura — nao como feature adicional.

### Principios de Seguranca

| Principio | Implementacao |
|-----------|--------------|
| **Defense in Depth** | Multiplas camadas de protecao (rede, aplicacao, dados) |
| **Zero Trust** | Nenhuma entidade e confiavel por padrao |
| **Least Privilege** | Permissoes minimas necessarias para cada role |
| **Fail Secure** | Em caso de falha, o sistema nega acesso |
| **Observabilidade** | Toda acao e registada em logs imutaveis |

---

## Hardening do JWT e Secrets

### 1. Remover Segredos do Codigo-Fonte

**Problema:** `SECRET_KEY` e `ADMIN_PASSWORD_HASH` com fallbacks em texto claro.

**Arquivos afetados:**
- `api-gateway/src/security.py`
- `api-gateway/src/settings.py`

**Correcao em `settings.py`:**

```python
# ANTES (INSEGURO):
SECRET_KEY: str = os.getenv("SECRET_KEY", "txeka-dev-secret")

# DEPOIS (SEGURO):
SECRET_KEY: str = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required. "
                       "Generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'")
```

**Correcao em `security.py`:**

```python
# ANTES (INSEGURO):
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "fallback-hash")

# DEPOIS (SEGURO):
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")
if not ADMIN_PASSWORD_HASH:
    raise RuntimeError("ADMIN_PASSWORD_HASH environment variable is required")
```

### 2. Rotacao de Secrets

| Secret | Frequencia de Rotacao | Comando |
|--------|----------------------|---------|
| `SECRET_KEY` | A cada 90 dias | `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `ADMIN_PASSWORD_HASH` | A cada 90 dias | `python -c "import bcrypt; print(bcrypt.hashpw(b'nova-senha', bcrypt.gensalt()).decode())"` |
| API Keys de instituicoes | A pedido ou suspeita de comprometimento | Endpoint `POST /api/v1/institutions/{id}/regenerate-api-key` |

### 3. Validacao de JWT

```python
# Em security.py — validacao rigorosa
def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "require": ["exp", "iat", "sub", "role"]
            }
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")
```

---

## Hardening da Base de Dados

### 1. Conexao PostgreSQL

```python
# Em database.py — conexao segura
DATABASE_URL = os.getenv("DATABASE_URL")

# Validar SSL em producao
if ENVIRONMENT == "production":
    connect_args = {
        "sslmode": "require",
        "statement_cache_size": 0
    }
else:
    connect_args = {"statement_cache_size": 0}
```

### 2. SQL Injection Prevention

- **ORM:** Todas as queries via SQLAlchemy 2.0 (parametrizacao automatica)
- **Raw SQL:** NUNCA usar f-strings ou concatenacao em queries
- **Audit:** Todas as queries sao logadas via structlog

### 3. Retencao e Backup

| Dado | Retencao | Backup |
|------|----------|--------|
| Hashes de documentos | 20 anos (Decreto 59/2019) | Diario, criptografado |
| Logs de auditoria | 20 anos | Diario, criptografado |
| Dados de instituicoes | Indefinida | Semanal |
| Tokens JWT | 30-90 dias | Nao aplicavel (stateless) |

---

## Hardening da API

### 1. Rate Limiting (slowapi)

| Endpoint | Limite | Janela | Acao ao Exceder |
|----------|--------|--------|-----------------|
| `/api/v1/verify` | 100 req | 1 min | 429 + log de alerta |
| `/api/v1/certify` | 60 req | 1 min | 429 + notificacao admin |
| `/api/v1/certify/bulk` | 10 req | 1 min | 429 + review manual |
| `/api/v1/auth/login` | 5 req | 1 min | 429 + bloqueio IP 15 min |
| `/api/v1/auth/admin/login` | 5 req | 1 min | 429 + alerta critico |
| Outros | 120 req | 1 min | 429 |

### 2. Headers de Seguranca

```python
# Em main.py — middleware de seguranca
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["txeka-ntiyiso-api.onrender.com", "api.txeka-ntiyiso.co.mz"]
)

# Headers adicionais via Nginx (on-premise)
# add_header X-Content-Type-Options nosniff;
# add_header X-Frame-Options DENY;
# add_header X-XSS-Protection "1; mode=block";
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
# add_header Content-Security-Policy "default-src 'self'";
# add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### 3. Validacao de Upload (PDF)

```python
# Em emission_routes.py — validacao rigorosa
PDF_MAGIC = b"%PDF-"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def validate_pdf(file: UploadFile, content: bytes) -> None:
    # 1. Extensao obrigatoriamente .pdf
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Apenas PDF")

    # 2. MIME type obrigatoriamente application/pdf
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="MIME type invalido")

    # 3. Magic bytes obrigatoriamente %PDF-
    if not content.startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="Assinatura PDF invalida")

    # 4. Tamanho maximo 50MB
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Tamanho excedido")
```

### 4. Zero-Knowledge Architecture

```
Documento Original (PDF)
         |
         v
+---------------+
| Client-Side   |  <- Hash SHA-256 calculado no navegador
| SHA-256       |
+-------+-------+
    |  Apenas hash (64 chars) viaja
    v
+---------------+
| Servidor      |  <- NUNCA ve o documento original
| Txeka Ntiyiso |
+---------------+
```

**Garantias:**
- O servidor nunca processa o conteudo do documento
- Apenas o hash SHA-256 e persistido
- Zero risco de vazamento de dados pessoais via servidor

---

## Hardening do Deploy

### 1. Variaveis de Ambiente (Render / Docker)

```bash
# .env.example — NUNCA commitar .env real
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
SECRET_KEY=<gerar-com-secrets.token_urlsafe(32)>
ADMIN_EMAIL=admin@txeka.co.mz
ADMIN_PASSWORD_HASH=<bcrypt-hash>
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### 2. Docker Security

```dockerfile
# Dockerfile — non-root user
FROM python:3.11-slim

RUN groupadd -r txeka && useradd -r -g txeka txeka
WORKDIR /app
COPY --chown=txeka:txeka . .
RUN pip install --no-cache-dir -r requirements.txt

USER txeka
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3. CI/CD Security (GitHub Actions)

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Bandit (SAST)
        run: |
          pip install bandit
          bandit -r api-gateway/src/ -f json -o bandit-report.json || true

      - name: Safety (Dependency Scan)
        run: |
          pip install safety
          safety check || true

      - name: Secret Detection
        run: |
          pip install truffleHog
          truffleHog --regex --entropy=False . || true
```

---

## Checklist de Seguranca Pre-Deploy

### Antes de cada deploy em producao:

- [ ] `SECRET_KEY` tem >= 32 caracteres e NAO e "txeka-dev-secret"
- [ ] `ADMIN_PASSWORD_HASH` esta configurado e NAO e fallback
- [ ] `DATABASE_URL` usa SSL (`sslmode=require`)
- [ ] Bandit passa sem vulnerabilidades HIGH/CRITICAL
- [ ] Nenhum secret hardcoded no codigo (`git grep -i "secret\|password\|key"`)
- [ ] Rate limiting ativo em todos os endpoints publicos
- [ ] CORS origins restritas (sem `*`)
- [ ] Headers de seguranca configurados
- [ ] Logs de auditoria funcionando (`/api/v1/logs`)
- [ ] Backup do banco de dados testado
- [ ] Plano de rollback definido

---

## Incident Response

### Classificacao de Incidentes

| Nivel | Descricao | Exemplo | Tempo de Resposta |
|-------|-----------|---------|-------------------|
| **P1 — Critico** | Sistema inoperacional ou dados expostos | Vazamento de hashes, breach de admin | 15 min |
| **P2 — Alto** | Funcionalidade degradada | Rate limit bypass, DDoS | 1 hora |
| **P3 — Medio** | Problema isolado | Token expirado, 404 em massa | 4 horas |
| **P4 — Baixo** | Melhoria de seguranca | Atualizacao de dependencia | 1 semana |

### Playbook — Comprometimento de Secret

1. **Detetar:** Alerta de uso anomalo ou scan de leak
2. **Isolar:** Revogar tokens imediatamente (`SECRET_KEY` rotation)
3. **Investigar:** Analisar logs de auditoria (`/api/v1/logs`)
4. **Corrigir:** Gerar novo secret, forcar logout de todos os users
5. **Comunicar:** Notificar instituicoes afetadas
6. **Documentar:** Registar incidente em `incidents/YYYY-MM-DD-descricao.md`

---

## Referencias

- [OWASP Top 10 (2026)](https://owasp.org/Top10/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Decreto n. 59/2019 — Retencao de dados em Mocambique](doc/legal/COMPLIANCE.md)

---

> **Documentacao CONFIDENCIAL.**  
> Nao partilhar fora da equipa de desenvolvimento Txeka Ntiyiso.  
> Para reportar vulnerabilidades: geral.txekantiyiso@gmail.com

Txeka Ntiyiso — Orgulhosamente desenvolvido em Mocambique

Proprietary. All rights reserved. Txeka Ntiyiso, 2026.
