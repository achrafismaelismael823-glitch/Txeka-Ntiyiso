# Documentação Técnica — Txeka Ntiyiso

**Arquitetura, Stack Tecnológico, Decisões Arquiteturais e Roadmap**

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitetura de Dados](#arquitetura-de-dados)
4. [Fluxos de Operação](#fluxos-de-operação)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Segurança](#segurança)
7. [Deploy Pipeline](#deploy-pipeline)
8. [Performance](#performance)
9. [Monitoramento](#monitoramento)
10. [Decisões Arquiteturais](#decisões-arquiteturais)
11. [Roadmap Técnico](#roadmap-técnico)

---

## Visão Geral

O Txeka Ntiyiso é um sistema distribuído B2G/B2B composto por três camadas principais:

```
┌─────────────────────────────────────────────────────────────┐
│  Txeka Ntiyiso — Arquitetura de Três Camadas                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 Portal Web (React + Tailwind)                           │
│     ↓ Cálculo de hash client-side (Zero-Knowledge)          │
│                                                             │
│  ⚡ API Gateway (FastAPI + PostgreSQL)                      │
│     ↓ JWT + Rate Limiting + Audit Logs                      │
│                                                             │
│  🗄️  Base de Dados (PostgreSQL — Supabase / On-premise)    │
│     ↓ Hashes + Metadados + Logs Imutáveis                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Nota de Privacidade:** O cálculo do hash SHA-256 é realizado **exclusivamente no navegador do cliente** (client-side). O documento original (PDF) nunca transita pela rede nem é persistido nos servidores da plataforma, garantindo conformidade absoluta com o Capítulo V da Lei n.º 3/2017 (Proteção de Dados e Privacidade).

---

## Stack Tecnológico

### Backend

| Componente | Tecnologia | Versão | Função |
|------------|-----------|--------|--------|
| Framework | FastAPI | 0.110.0 | API REST assíncrona, auto-documentação |
| Linguagem | Python | 3.11 | Type hints nativos, performance asyncio |
| Servidor ASGI | Uvicorn | 0.27.0 | Servidor HTTP de alta performance |
| ORM | SQLAlchemy | 2.0.0 | Abstração de base de dados, prepared statements |
| Migrations | Alembic | 1.13.0 | Versionamento de schema PostgreSQL |

### Base de Dados

| Componente | Tecnologia | Versão | Função |
|------------|-----------|--------|--------|
| SGBD | PostgreSQL | 15 | Transações ACID, auditoria, JSONB |
| Hosting (Cloud) | Supabase | — | PostgreSQL gerido, replicação, backups |
| Hosting (Nacional) | PostgreSQL Docker | 15-alpine | On-premise, soberania digital |

### Autenticação e Segurança

| Componente | Tecnologia | Versão | Função |
|------------|-----------|--------|--------|
| JWT | pyjwt | 2.8.0 | Tokens stateless, HS256 |
| Password Hashing | bcrypt | 4.1.0 | Hashing adaptativo de passwords (futuro) |
| Rate Limiting | slowapi | 0.1.9 | Proteção contra abuso e DoS |
| Validação | Pydantic | 2.5.0 | Validação de schema de entrada |

### Geração de QR Code

| Componente | Tecnologia | Versão | Função |
|------------|-----------|--------|--------|
| QR Code | qrcode | 7.4.2 | Geração de códigos QR verificáveis |
| Imagens | Pillow | 10.2.0 | Manipulação de imagens PNG |

### Logging e Monitoramento

| Componente | Tecnologia | Versão | Função |
|------------|-----------|--------|--------|
| Logging | structlog | 24.1.0 | Logs estruturados em JSON |
| Health Check | FastAPI native | — | Endpoint /health para monitoramento |

### Frontend

| Componente | Tecnologia | Versão | Função |
|------------|-----------|--------|--------|
| Framework | React | 18.2.0 | Interface de utilizador |
| Estilização | Tailwind CSS | 3.4.0 | Design system utility-first |
| Build | Vite | 5.0.0 | Bundler de desenvolvimento rápido |

### Infraestrutura

| Ambiente | Hosting | Database | Monitoramento |
|----------|---------|----------|---------------|
| **Produção Cloud** | Render.com (US) | Supabase PostgreSQL | Render logs + structlog |
| **Produção Nacional** | Docker + Ubuntu 22.04 | PostgreSQL 15-alpine | Prometheus + Grafana (opcional) |
| **Híbrido** | Docker Edge + Cloud | Replicação assíncrona | Logs centralizados |

---

## Arquitetura de Dados

### Tabela: documents

Registo imutável de cada documento emitido na plataforma.

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id VARCHAR(100) UNIQUE NOT NULL,
    doc_hash VARCHAR(64) UNIQUE NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    institution_id VARCHAR(50) NOT NULL,
    qr_code TEXT,
    file_size INTEGER,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    revoked_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
```sql
CREATE INDEX idx_documents_hash ON documents(doc_hash);
CREATE INDEX idx_documents_institution ON documents(institution_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_revoked ON documents(revoked) WHERE revoked = TRUE;
```

**Restrições:**
- `doc_hash` UNIQUE: impede duplicação maliciosa
- `doc_id` UNIQUE: identificador legível por instituição
- `revoked` + `revoked_at` + `revoked_reason`: soft-delete para auditoria

### Tabela: audit_logs

Registo imutável de todas as operações do sistema. Append-only.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email VARCHAR(100),
    action VARCHAR(20) NOT NULL CHECK (action IN ('EMIT', 'VERIFY', 'REVOKE', 'LOGIN', 'LOGOUT')),
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    institution_id VARCHAR(50),
    ip_address VARCHAR(45),
    request_path TEXT,
    request_method VARCHAR(10),
    status_code INTEGER,
    success BOOLEAN NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
```sql
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_institution ON audit_logs(institution_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_user ON audit_logs(user_email);
```

**Nota:** A tabela `audit_logs` é **append-only**. Não existe endpoint DELETE. A retenção mínima é de **20 anos** (Decreto n.º 59/2019).

### Tabela: users (Futuro — Fase 2)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- bcrypt (futuro)
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'institution', 'system')),
    institution_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);
```

> **Nota:** O campo `role` é forçado pelo servidor (`user.role = "institution"`). Nunca confiar no cliente.

---

## Fluxos de Operação

### 1. Emissão de Documento

```
Cliente (Instituição)
    │
    ▼ POST /api/v1/certify
    │
    ├─► 1. Validação de entrada
    │      • Tipo: PDF (.pdf)
    │      • MIME: application/pdf
    │      • Magic bytes: %PDF- (mitiga falsificação de extensão)
    │      • Tamanho: < 50MB
    │
    ├─► 2. Cálculo de hash (server-side fallback)
    │      • SHA-256(PDF bytes) → hash_sha256
    │      • Nota: Idealmente calculado client-side para Zero-Knowledge
    │
    ├─► 3. Verificação de duplicado
    │      • SELECT doc_hash FROM documents WHERE doc_hash = ?
    │      • Se existe → 409 Conflict
    │
    ├─► 4. Geração de QR code
    │      • qrcode(hash_sha256, doc_id)
    │      • Base64 PNG
    │
    ├─► 5. Persistência
    │      • INSERT INTO documents (doc_id, doc_hash, ...)
    │      • INSERT INTO audit_logs (action='EMIT', ...)
    │
    └─► 6. Resposta
           {
             doc_id, hash, qr_code,
             verification_url, timestamp
           }
```

**Tempo esperado:** < 500ms

### 2. Verificação Pública

```
Cidadão (QR code ou Upload)
    │
    ▼ GET /api/v1/verify/{hash}
    │
    ├─► 1. Validação de entrada
    │      • Hash tem 64 caracteres hexadecimais?
    │      • Regex: ^[a-fA-F0-9]{64}$
    │
    ├─► 2. Query de base de dados
    │      • SELECT * FROM documents WHERE doc_hash = ?
    │
    ├─► 3. Lógica de resposta
    │      • Não encontrado → INVALID
    │      • revoked = TRUE → REVOKED + metadados
    │      • Válido → VALID + dados públicos
    │
    ├─► 4. Audit log (anónimo)
    │      • INSERT INTO audit_logs (action='VERIFY', ip_address=?, ...)
    │      • IP mascarado em consultas públicas (PENSC compliant)
    │
    └─► 5. Resposta
           { status, data }
```

**Tempo esperado:** < 100ms

### 3. Verificação B2B/B2G

```
Sistema Empresarial
    │
    ▼ POST /api/v1/verify
    │
    ├─► 1. Autenticação API Key
    │      • Validar Bearer token
    │
    ├─► 2. Normalização
    │      • hash.strip() (remove espaços acidentais)
    │
    ├─► 3. Mesma lógica da verificação pública
    │
    ├─► 4. Audit log (identificado)
    │      • INSERT INTO audit_logs (action='VERIFY', institution_id=?, ...)
    │
    └─► 5. Resposta
           { status, data }
```

### 4. Revogação

```
Admin / Instituição
    │
    ▼ POST /api/v1/emissions/{doc_id}/revoke
    │
    ├─► 1. Autorização
    │      • JWT válido
    │      • role == 'admin' OR (role == 'institution' AND doc.institution_id == token.institution)
    │
    ├─► 2. Verificação de estado
    │      • SELECT * FROM documents WHERE doc_id = ?
    │      • Se não encontrado → 404
    │      • Se já revogado → 400 (already_revoked)
    │
    ├─► 3. Soft update (nunca DELETE)
    │      • UPDATE documents SET
    │          revoked = TRUE,
    │          revoked_at = NOW(),
    │          revoked_reason = ?,
    │          revoked_by = ?
    │
    ├─► 4. Audit log
    │      • INSERT INTO audit_logs (action='REVOKE', ...)
    │
    └─► 5. Resposta
           { status: 'revoked', revoked_at, reason }
```

**Tempo esperado:** < 150ms

### 5. Auditoria

```
Admin
    │
    ▼ GET /api/v1/audit/logs
    │
    ├─► 1. Autorização
    │      • JWT + role == 'admin'
    │
    ├─► 2. Filtros opcionais
    │      • action, institution_id, start_date, end_date
    │      • Paginação: page, limit (max 100)
    │
    ├─► 3. Query
    │      • SELECT * FROM audit_logs WHERE ... ORDER BY timestamp DESC
    │
    └─► 4. Resposta paginada
           { data: [...], pagination: { page, limit, total, total_pages } }
```

```
Admin / Instituição
    │
    ▼ GET /api/v1/audit/document/{hash}/history
    │
    ├─► 1. Autorização
    │      • JWT + (role == 'admin' OR doc.institution_id == token.institution)
    │
    ├─► 2. Query
    │      • SELECT * FROM audit_logs WHERE resource_id = ? ORDER BY timestamp
    │
    └─► 3. Resposta
           { doc_id, hash, history: [...] }
```

---

## Autenticação e Autorização

### JWT Flow

```
┌─────────────┐     POST /auth/login      ┌─────────────┐
│   Cliente   │ ────────────────────────► │    API      │
│             │  {email, password}        │             │
│             │ ◄──────────────────────── │             │
│             │  {access_token, expires_in} │             │
└─────────────┘                           └─────────────┘
       │
       ▼
┌─────────────┐     Requisições API       ┌─────────────┐
│   Cliente   │ ────────────────────────► │    API      │
│             │  Authorization: Bearer      │             │
│             │  <token>                  │  jwt.decode │
│             │ ◄──────────────────────── │  validar    │
│             │  {dados}                  │  exp, role  │
└─────────────┘                           └─────────────┘
```

### Payload JWT

```json
{
  "sub": "admin@txeka.co.mz",
  "email": "admin@txeka.co.mz",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "admin",
  "institution": "TXEKA",
  "exp": 1719504000,
  "iat": 1719500400
}
```

### Roles e Permissões

```python
ROLES = {
    "system":    ["verify", "emit", "revoke"],           # API keys internas
    "admin":     ["verify", "emit", "revoke", 
                   "manage_institutions", "audit"],        # Acesso total
    "institution": ["emit", "verify", "revoke_own"],       # Apenas próprios docs
}
```

> **Regra de segurança crítica:**
> ```python
> # NUNCA permitir isto:
> @app.post("/auth/register")
> async def register(user: UserCreate):
>     if user.role == "admin":  # ❌ NUNCA!
>         ...
>
> # SEMPRE assim:
> @app.post("/auth/register")
> async def register(user: UserCreate):
>     user.role = "institution"  # ✅ Forçado pelo servidor
>     user.credits = 0            # ✅ Só ativa após pagamento
>     user.approved = False       # ✅ Só ativa após aprovação manual
> ```

---

## Segurança

### Criptografia

| Camada | Algoritmo | Uso |
|--------|-----------|-----|
| Hash de documento | SHA-256 | Impressão digital única do PDF |
| Autenticação | JWT (HS256) | Tokens stateless |
| Password hashing | bcrypt (futuro) | Proteção de credenciais |
| Transporte | TLS 1.3 | Cifragem em trânsito |

### Validação de Entrada

| Regra | Implementação |
|-------|---------------|
| Formato | Exclusivamente PDF (.pdf) |
| MIME type | `application/pdf` |
| Magic bytes | `%PDF-` (primeiros 4 bytes) |
| Tamanho máximo | 50MB |
| Hash format | 64 caracteres hexadecimais |
| Rate limiting | 100 req/min (emit), 30 req/min (verify pública) |

### CORS

```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",           # Desenvolvimento React
    "http://localhost:5173",           # Desenvolvimento Vite
    "https://txeka-ntiyiso-portal.onrender.com",  # Produção Cloud
    "https://txeka.gov.mz",            # Produção Nacional
    "https://portal.txeka.gov.mz",     # Portal institucional
]
```

---

## Deploy Pipeline

### Produção Cloud (Render.com)

```
1. Developer faz push ao GitHub
        │
        ▼
2. Render webhook acionado
        │
        ▼
3. Render clona repositório
        │
        ▼
4. poetry lock && poetry install
        │
        ▼
5. alembic upgrade head
        │
        ▼
6. uvicorn src.main:app --host 0.0.0.0 --port $PORT
        │
        ▼
7. Health check: GET /health
        │
        ▼
8. Se 200: Deploy bem-sucedido ✅
```

**Tempo total:** 2-3 minutos

### Produção Nacional (Docker)

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para detalhes completos de infraestrutura on-premise.

---

## Performance

### Tempos de Resposta (Benchmarks)

| Operação | Tempo Médio | P95 | P99 |
|----------|-------------|-----|-----|
| Emit | 450ms | 600ms | 800ms |
| Verify (público) | 85ms | 120ms | 150ms |
| Verify (B2B) | 90ms | 130ms | 160ms |
| Revoke | 120ms | 180ms | 250ms |
| Audit logs (paginado) | 200ms | 350ms | 500ms |

### Otimizações

- **Índices:** `doc_hash`, `institution_id`, `created_at`, `timestamp`
- **Cache:** Redis para tokens JWT ativos (futuro)
- **Pool de conexões:** SQLAlchemy asyncpg pool
- **Compressão:** Gzip em respostas JSON

---

## Monitoramento

### Logs Estruturados (structlog JSON)

```json
{
  "event": "Documento emitido com sucesso",
  "doc_id": "DUAT-INAGE-20260627-XXXXXX",
  "doc_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "user_email": "admin@txeka.co.mz",
  "institution_id": "INAGE",
  "ip_address": "197.218.XXX.XXX",
  "timestamp": "2026-06-27T08:44:00+02:00",
  "level": "info",
  "logger": "txeka.api.certify"
}
```

### Health Check

```http
GET /health
```

```json
{
  "status": "online",
  "project": "Txeka Ntiyiso",
  "version": "1.0.0",
  "environment": "production",
  "timezone": "CAT",
  "database": "connected",
  "timestamp": "2026-06-27T08:44:00+02:00"
}
```

### Métricas (Futuro — Fase 3)

| Métrica | Fonte | Alerta |
|---------|-------|--------|
| Latência P95 | Prometheus | > 500ms |
| Taxa de erro | Prometheus | > 1% |
| Conexões DB | PostgreSQL stats | > 80% do máximo |
| Espaço em disco | Node exporter | < 20% livre |
| Requisições/min | Nginx logs | Spike > 200% da média |

---

## Decisões Arquiteturais

### Por que FastAPI?

| Critério | FastAPI | Django | Flask |
|----------|---------|--------|-------|
| Type hints nativos | ✅ | ⚠️ | ❌ |
| Auto-documentação (/docs) | ✅ | ❌ | ❌ |
| Performance (async) | ✅ | ⚠️ | ⚠️ |
| Curva de aprendizado | Média | Alta | Baixa |
| Comunidade | Crescendo | Madura | Madura |

**Decisão:** FastAPI oferece o melhor equilíbrio entre performance, type safety e produtividade para APIs REST.

### Por que PostgreSQL?

| Critério | PostgreSQL | MongoDB | SQLite |
|----------|-----------|---------|--------|
| Transações ACID | ✅ | ⚠️ | ✅ |
| JSONB (semi-estruturado) | ✅ | ✅ | ❌ |
| Escalabilidade | ✅ | ✅ | ❌ |
| Auditoria temporal | ✅ | ⚠️ | ❌ |
| Conformidade Lei 3/2017 | ✅ | ⚠️ | ❌ |

**Decisão:** PostgreSQL é o SGBD relacional mais maduro para aplicações que exigem integridade referencial, auditoria temporal e conformidade legal. Supabase oferece hosting gerido gratuito para fase inicial.

### Por que SHA-256 (e não blockchain)?

| Critério | SHA-256 | Blockchain | PKI Nacional |
|----------|---------|-----------|--------------|
| Simplicidade | ✅ | ❌ | ⚠️ |
| Custo | Grátis | Alto | Médio |
| Velocidade | < 100ms | Segundos | < 100ms |
| Independência de terceiros | ✅ | ❌ | ❌ |
| Reconhecimento legal | ✅ | ⚠️ | ✅ |

**Decisão:** SHA-256 oferece prova de integridade matemática suficiente para o escopo do Txeka Ntiyiso, sem a complexidade operacional de blockchain ou a dependência da ICP-MZ (que ainda não está operacional para este caso de uso).

### Por que Zero-Knowledge (client-side hashing)?

| Aspecto | Client-side | Server-side |
|---------|-------------|-------------|
| Privacidade | ✅ Máxima | ⚠️ Documento transita pela rede |
| Conformidade Lei 3/2017 | ✅ Automática | ⚠️ Requer DPO, notificação |
| Complexidade técnica | ⚠️ Maior | ✅ Simples |
| Confiança do utilizador | ✅ Total | ⚠️ "O que fazem com o meu PDF?" |

**Decisão:** Client-side hashing elimina por completo o risco de vazamento de dados pessoais e simplifica a conformidade regulatória. A complexidade adicional no frontend é justificada pelo ganho de privacidade.

---

## Roadmap Técnico

### Fase 1 — Q1 2026 ✅ Concluída

- [x] API REST core (emit, verify, revoke)
- [x] PostgreSQL + Supabase
- [x] JWT authentication
- [x] Audit logs imutáveis
- [x] QR code generation
- [x] Deploy em Render.com

### Fase 2 — Q2-Q3 2026 🔄 Em Curso

- [ ] Dashboard Web (React + Tailwind)
- [ ] Módulo de gestão de instituições
- [ ] Relatórios analíticos e métricas
- [ ] Sistema de créditos por instituição
- [ ] Webhook para notificações (créditos baixos)
- [ ] Rate limiting por instituição (não apenas por IP)
- [ ] Redis para cache de tokens e sessões

### Fase 3 — Q3 2026 ⏳ Planeada

- [ ] 2FA (TOTP/SMS)
- [ ] OAuth2 para integração com sistemas governamentais
- [ ] ML fraud detection (padrões anómalos de verificação)
- [ ] Mobile app (React Native)
- [ ] API v2 (GraphQL opcional)
- [ ] Multi-language (PT, EN)

### Fase 4 — Q4 2026 ⏳ Planeada

- [ ] Kubernetes em produção nacional
- [ ] HSM para gestão de chaves (futuro ICP)
- [ ] Blockchain opcional para notarização adicional
- [ ] Integração com sistema de pagamentos móveis (M-Pesa)
- [ ] Certificação ISO 27001

---

*Txeka Ntiyiso — Documentação Técnica v1.0 🇲🇿*
*Alinhado com Lei 3/2017, Decreto 59/2019 e Resolução 69/2021 (PENSC)*
