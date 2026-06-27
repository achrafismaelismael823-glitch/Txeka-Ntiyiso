```markdown
# Documentação Técnica — Txeka Ntiyiso

Arquitetura, stack e decisões técnicas.

## Visão Geral

Sistema distribuído B2G/B2B com componente principal:

- API Gateway (FastAPI + PostgreSQL)

Deployado em Render.com com database em Supabase.

## Stack Tecnológico

### Backend

- Framework: FastAPI 0.110.0
- Linguagem: Python 3.11
- Database: PostgreSQL (Supabase)
- Autenticação: JWT (pyjwt 2.8.0)
- Criptografia: SHA-256, bcrypt
- QR Code: qrcode 7.4.2 + Pillow
- Rate Limiting: slowapi
- Logging: structlog (JSON)

### Infraestrutura

- Hosting API: Render.com (US)
- Database: Supabase PostgreSQL
- Monitoramento: Render logs + structlog

## Arquitetura de Dados

### Tabelas Principais

#### documents

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    doc_id VARCHAR(100) UNIQUE,
    doc_hash VARCHAR(64) UNIQUE,
    document_type VARCHAR(50),
    institution_id VARCHAR(50),
    qr_code TEXT,
    file_size INTEGER,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_reason TEXT,
    revoked_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

Índices:
- `doc_hash` (busca rápida na verificação)
- `institution_id` (filtrar por instituição)
- `created_at` (auditoria temporal)

audit_logs

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_email VARCHAR(100),
    action VARCHAR(20),
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    institution_id VARCHAR(50),
    ip_address VARCHAR(45),
    request_path TEXT,
    request_method VARCHAR(10),
    status_code INTEGER,
    success BOOLEAN,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

Fluxos

Emissão

1. Cliente `POST /api/v1/certify` com PDF
2. Validação: tamanho, tipo, extensão, magic bytes
3. SHA-256(PDF bytes) → hash_sha256
4. Verificação: hash já existe? → 409 Conflict
5. Gerar QR code: `qrcode(hash_sha256, doc_id)`
6. Criar registro BD: `documents`
7. Audit log: `EMIT`
8. Retornar: `{doc_id, hash, qr_code, certificate_url, timestamp}`

Tempo esperado: < 500ms

Verificação (Pública)

1. Cliente `GET /api/v1/verify/{doc_hash}`
2. Validação: hash tem 64 chars hexadecimais
3. Query BD: `SELECT * WHERE doc_hash = ?`
4. Se não encontrado: retorna `INVALID`
5. Se revogado: retorna `REVOKED` + metadados
6. Se válido: retorna `VALID` + dados públicos
7. Audit log: `VERIFY` (anonymous)

Tempo esperado: < 100ms

Verificação (B2B/B2G)

1. Cliente `POST /api/v1/verify` com JSON `{"hash": "..."}`
2. `.strip()` no hash (remove espaços)
3. Mesma lógica da verificação pública
4. Audit log: `VERIFY` (anonymous)

Revogação

1. Cliente `POST /api/v1/emissions/{doc_id}/revoke` + JWT admin
2. Validação: `role == "admin"` ou mesma instituição
3. Query BD: `SELECT * WHERE doc_id = ?`
4. Se já revogado: retorna `already_revoked`
5. Se não encontrado: 404
6. Atualiza: `revoked = TRUE`, `revoked_at = NOW()`, `revoked_reason`
7. Audit log: `REVOKE`
8. Retorna: `{status: "revoked", revoked_at, reason}`

Tempo esperado: < 150ms

Auditoria

1. Admin `GET /api/v1/audit/logs` + JWT admin
2. Filtros opcionais: action, institution_id, data, etc.
3. Retorna: lista de logs paginada

1. Admin `GET /api/v1/audit/document/{hash}/history`
2. Retorna: histórico completo do documento

Autenticação

JWT Flow

1. Login (futuro: endpoint dedicado)
2. Sistema cria token: `jwt.encode(payload, SECRET_KEY)`
3. Payload: `{sub, email, id, role, institution, exp, iat}`
4. Cliente envia: `Authorization: Bearer {token}`
5. `security.py`: `jwt.decode(token, SECRET_KEY)`
6. Se válido: continua. Se não: 401

Roles

```python
ROLES = {
    "system": ["verify", "emit", "revoke"],
    "admin": ["verify", "emit", "revoke", "manage_institutions"],
    "institution": ["emit", "verify"],
    "citizen": ["verify"]
}
```

Segurança

Criptografia

- SHA-256: Hash imutável do documento
- JWT (HS256): Autenticação stateless
- bcrypt: Password hashing (futuro)

Validação de Entrada

- Formato: Exclusivamente PDF (.pdf)
- MIME: `application/pdf`
- Magic bytes: `%PDF-` (mitiga falsificação)
- Limite: < 50MB
- Rate limiting: 100 req/min por IP

CORS

```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://txeka-ntiyiso-portal.onrender.com"
]
```

Deploy Pipeline

1. Developer faz push ao GitHub
2. Render webhook acionado
3. Render clona repo
4. `poetry lock && poetry install`
5. `alembic upgrade head`
6. `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
7. Health check: `GET /health`
8. Se 200: Deploy bem-sucedido

Tempo: 2-3 minutos

Performance

Operação	Tempo	
Emit	450ms	
Verify	85ms	
Revoke	120ms	

Monitoramento

Logs (structlog JSON)

```json
{
  "event": "Documento emitido",
  "doc_id": "DUAT-INAGE-20260626-XXXXXX",
  "user_email": "admin@txeka.co.mz",
  "timestamp": "2026-06-27T08:44:00+02:00"
}
```

Health Check

```json
GET /health
{
  "status": "online",
  "project": "Txeka Ntiyiso",
  "version": "1.0.0",
  "environment": "production"
}
```

Decisões Arquiteturais

Por que PostgreSQL?

- Transações ACID críticas
- Supabase é grátis e escalável
- Lei 3/2017 exige auditoria (SQL facilita)

Por que FastAPI?

- Type hints nativos
- Auto-documentation (/docs)
- Performance (uvicorn + asyncio)

Roadmap Técnico

- Fase 2: Dashboard + relatórios, registo de instituições
- Fase 3: 2FA, OAuth2, ML fraud detection
- Fase 4: Multi-language, mobile app, API v2

```
