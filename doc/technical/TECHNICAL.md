# Documentação Técnica — Txeka Ntiyiso

**Infraestrutura tecnológica para verificação da integridade e autenticidade documental em Moçambique**

---

| | |
|:---|:---|
| **Versão** | 1.2.0 |
| **Estado** | 🔄 Em curso (Fase 2) |
| **Última atualização** | 2026-07-12 |
| **Autor** | Equipa Txeka Ntiyiso |
| **Contacto técnico** | geral.txekantiyiso@gmail.com |

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Princípios Arquiteturais](#2-princípios-arquiteturais)
3. [Estrutura do Repositório](#3-estrutura-do-repositório)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Arquitetura de Dados](#5-arquitetura-de-dados)
6. [Fluxos de Operação](#6-fluxos-de-operação)
7. [Autenticação](#7-autenticação)
8. [Multi-Tenancy e Controlo de Créditos](#8-multi-tenancy-e-controlo-de-créditos)
9. [Segurança](#9-segurança)
10. [Deploy e Containerização](#10-deploy-e-containerização)
11. [Performance](#11-performance)
12. [Monitoramento](#12-monitoramento)
13. [Decisões Arquiteturais](#13-decisões-arquiteturais)
14. [Roadmap Técnico](#14-roadmap-técnico)
15. [Documentação Relacionada](#15-documentação-relacionada)

---

## 1. Visão Geral

Sistema distribuído B2G/B2B com componente principal:

- **API Gateway** (FastAPI + PostgreSQL)
- **Portal Web** (React + Tailwind CSS)
- **Motor de Hashing** (SHA-256 client-side/server-side)
- **Sistema de Auditoria** (logs imutáveis estruturados em JSON)

Deploy containerizado via **Docker** (multi-stage build) e orquestrado com **Docker Compose**. A produção cloud atual utiliza Render.com + Supabase; a produção nacional utiliza Docker on-premise em datacenters moçambicanos.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Portal Web    │────▶│   API Gateway    │────▶│   PostgreSQL    │
│  (React + TW)   │     │ (FastAPI + JWT)  │     │   (Supabase)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  SHA-256 +   │
                        │   QR Code    │
                        └──────────────┘
```

---

## 2. Princípios Arquiteturais

| Princípio | Descrição |
|-----------|-----------|
| **API First** | Toda a funcionalidade é exposta via API REST antes de ser consumida por qualquer interface. Documentação OpenAPI/Swagger gerada automaticamente. |
| **Security by Design** | Autenticação JWT stateless, bcrypt para passwords, rate limiting por tier, validação rigorosa de inputs, CORS restrito. |
| **Privacy by Design** | Zero retenção de documentos originais. Apenas hashes SHA-256 de 64 caracteres são persistidos. |
| **Zero-Knowledge** | O documento original é processado em memória e descartado. O servidor nunca vê, armazena ou transmite o conteúdo do ficheiro. |
| **Multi-Tenant** | Segregação lógica por `institution_id`. Cada instituição opera num tenant isolado com dados, créditos e dashboard próprios. |
| **Cloud Native** | Containerização Docker, healthchecks, auto-scaling ready, deploy em qualquer ambiente cloud ou on-premise. |
| **Auditabilidade** | Cada operação é registada imutavelmente em JSON com timestamp CAT (UTC+2), IP, user e resultado. Retenção mínima de 20 anos. |

---

## 3. Estrutura do Repositório

```
Txeka-Ntiyiso/
│
├── api-gateway/              # Backend FastAPI principal
│   ├── src/
│   │   ├── main.py          # Entry point: rotas, middlewares, CORS
│   │   ├── database.py       # AsyncSession, engine PostgreSQL
│   │   ├── settings.py       # Config centralizada: JWT, DB, env vars
│   │   ├── security.py       # JWT, bcrypt, verify_token, verify_role
│   │   ├── logger.py         # Structlog: correlation_id, JSON logging
│   │   ├── models/           # ORM SQLAlchemy + schemas Pydantic
│   │   ├── routes/           # Endpoints: auth, certify, verify, audit
│   │   ├── services/         # Lógica de negócio: emission, verification, audit
│   │   └── core/             # Utilitários: hashing, QR, sanitização
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── tests/
│
├── core/                     # Módulo compartilhado (workspace Poetry)
│   ├── src/                  # Hashing, QR generator, security utils
│   ├── tests/
│   └── pyproject.toml
│
├── portal-web/               # Frontend React + Tailwind CSS (Fase 2)
│
├── doc/                      # Documentação completa
│   ├── README.md            # Índice por perfil
│   ├── guides/              # API_REFERENCE.md, USER_GUIDE.md
│   ├── technical/           # TECHNICAL.md, DEPLOYMENT.md, RUNBOOK.md
│   └── legal/               # COMPLIANCE.md, SECURITY.md
│
├── assets/                   # Logos, imagens, recursos visuais
│
├── scripts/                  # Scripts de automação e utilitários
│
├── .github/                  # Workflows GitHub Actions
│
├── Dockerfile                # Multi-stage build (builder + runtime)
├── docker-compose.yml        # Orquestração PostgreSQL + API
├── pyproject.toml            # Workspace Poetry (api-gateway + core)
├── README.md                 # Apresentação do projeto (GitHub)
├── POSITIONING.md            # Posicionamento estratégico e regulatório
└── LICENSE                   # Proprietário — todos os direitos reservados
```

| Diretório | Função |
|-----------|--------|
| `api-gateway/` | Backend principal FastAPI — lógica de negócio, rotas, autenticação, auditoria |
| `core/` | Biblioteca compartilhada — hashing SHA-256, geração de QR codes, utilitários de segurança |
| `portal-web/` | Aplicação React — portal público de verificação e dashboard institucional |
| `doc/` | Documentação técnica, operacional, jurídica e de segurança |
| `assets/` | Recursos visuais do projeto (logos, badges, diagramas) |
| `scripts/` | Scripts de deploy, backup, migração e automação |
| `.github/` | CI/CD workflows e templates de issues/pull requests |

---

## 4. Stack Tecnológico

| Camada | Tecnologia | Versão | Função |
|--------|-----------|--------|--------|
| **Backend** | FastAPI | 0.110.0 | Framework web assíncrono, auto-documentação OpenAPI |
| **Linguagem** | Python | 3.11 | Runtime principal com type hints |
| **Database** | PostgreSQL | 15 | Persistência ACID, auditoria temporal |
| **Auth** | pyjwt | 2.8.0 | Tokens JWT stateless com expiração por role |
| **Hashing** | hashlib (SHA-256) | Nativo | Integridade criptográfica de documentos |
| **Passwords** | bcrypt | 4.1.0 | Hashing de passwords com 12 rounds |
| **QR Code** | qrcode + Pillow | 7.4.2 | Geração de QR codes verificáveis |
| **Rate Limit** | slowapi | 0.1.9 | Proteção contra abuso por IP e API key |
| **Logging** | structlog | 24.1.0 | Logs estruturados em JSON para auditoria forense |
| **Container** | Docker | 24.x | Multi-stage build, segurança não-root |
| **Orquestração** | Docker Compose | 3.9 | Ambiente completo com healthchecks |
| **Frontend** | React + Tailwind CSS | 18.x | Portal web, dashboard institucional |
| **Hosting Cloud** | Render.com | — | API em produção (fase atual) |
| **DB Cloud** | Supabase | — | PostgreSQL gerido com backups automáticos |

---

## 5. Arquitetura de Dados

### 5.1 Tabelas Principais

#### `documents`

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id VARCHAR(100) UNIQUE NOT NULL,
    doc_hash VARCHAR(64) UNIQUE NOT NULL,
    document_type VARCHAR(50),
    institution_id VARCHAR(50) NOT NULL,
    qr_code TEXT,
    file_size INTEGER,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_reason TEXT,
    revoked_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doc_hash ON documents(doc_hash);
CREATE INDEX idx_institution_id ON documents(institution_id);
CREATE INDEX idx_created_at ON documents(created_at);
CREATE INDEX idx_revoked ON documents(revoked) WHERE revoked = TRUE;
```

#### `institutions` (Fase 2 — Em curso)

```sql
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'institution',
    credits INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE INDEX idx_institution_api_key ON institutions(api_key);
CREATE INDEX idx_institution_active ON institutions(is_active) WHERE is_active = TRUE;
```

#### `users` (Fase 2 — Em curso)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'institution',
    institution_id VARCHAR(50),
    token_expiry_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id)
);

CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_user_institution ON users(institution_id);
```

#### `audit_logs`

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(100),
    action VARCHAR(20) NOT NULL,
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

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_institution ON audit_logs(institution_id);
CREATE INDEX idx_audit_ip_masked ON audit_logs(ip_address);
```

#### `credit_transactions` (Fase 2 — Em curso)

```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'purchase', 'consumption', 'refund'
    document_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id)
);

CREATE INDEX idx_credit_institution ON credit_transactions(institution_id);
CREATE INDEX idx_credit_type ON credit_transactions(type);
```

---

## 6. Fluxos de Operação

### 6.1 Emissão (Documento Único)

```
Cliente ──POST /certify (PDF + JWT)──▶ API
                                          │
                                          ▼
                                    ┌─────────────┐
                                    │ Validação   │
                                    │ JWT + role  │
                                    │ (institution│
                                    │  ou admin)  │
                                    └──────┬──────┘
                                           ▼
                                    ┌─────────────┐
                                    │ Validação   │
                                    │ PDF: tipo,  │
                                    │ tamanho,    │
                                    │ magic bytes │
                                    │ (%PDF-)     │
                                    └──────┬──────┘
                                           ▼
                                    ┌─────────────┐
                                    │ SHA-256     │
                                    │ (PDF bytes) │
                                    └──────┬──────┘
                                           ▼
                                    ┌─────────────┐
                                    │ Hash existe?│──SIM──▶ 409 Conflict
                                    └──────┬──────┘
                                           NÃO
                                           ▼
                                    ┌─────────────┐
                                    │ Consumir 1  │
                                    │ crédito da  │
                                    │ instituição │
                                    └──────┬──────┘
                                           ▼
                                    ┌─────────────┐
                                    │ Gerar QR    │
                                    │ + registo BD│
                                    └──────┬──────┘
                                           ▼
                                    ┌─────────────┐
                                    │ Audit log   │
                                    │ EMIT        │
                                    └──────┬──────┘
                                           ▼
                                    201 Created
```

**Tempo esperado:** < 500ms

### 6.2 Emissão em Bulk (B2B/B2G)

```
Cliente ──POST /certify/bulk (JSON + JWT)──▶ API
                                                  │
                                                  ▼
                                            ┌─────────────┐
                                            │ Validação   │
                                            │ JWT + role  │
                                            │ institution │
                                            └──────┬──────┘
                                                   ▼
                                            ┌─────────────┐
                                            │ Array de    │
                                            │ documentos  │
                                            │ (base64 PDF)│
                                            └──────┬──────┘
                                                   ▼
                                            ┌─────────────┐
                                            │ Para cada   │
                                            │ documento:  │
                                            │ - Validar   │
                                            │ - Hash      │
                                            │ - Consumir  │
                                            │   crédito   │
                                            └──────┬──────┘
                                                   ▼
                                            ┌─────────────┐
                                            │ Verificar   │
                                            │ créditos    │
                                            │ suficientes │
                                            │ (n docs)    │
                                            └──────┬──────┘
                                                   ▼
                                            ┌─────────────┐
                                            │ Transação   │
                                            │ atómica:    │
                                            │ tudo ou     │
                                            │ nada        │
                                            └──────┬──────┘
                                                   ▼
                                            ┌─────────────┐
                                            │ Audit log   │
                                            │ BULK_EMIT   │
                                            └──────┬──────┘
                                                   ▼
                                            201 Created + array
```

**Tempo esperado:** < 2s para 100 documentos

### 6.3 Verificação (Pública)

```
Cliente ──GET /verify/{hash}──▶ API
                                   │
                                   ▼
                             ┌────────────┐
                             │ Validação  │
                             │ (64 chars  │
                             │ hex)       │
                             └─────┬──────┘
                                   ▼
                             ┌────────────┐
                             │ Query BD   │
                             └─────┬──────┘
                                   ▼
                        ┌─────────┴─────────┐
                        │                   │
                     Não encontrado     Encontrado
                        │                   │
                        ▼                   ▼
                   INVALID           Revogado?──SIM──▶ REVOKED
                        │                   │
                        │                   NÃO
                        │                   ▼
                        │              VALID + metadados
                        │                   │
                        └─────────┬─────────┘
                                  ▼
                            Audit log VERIFY
```

**Tempo esperado:** < 100ms

### 6.4 Verificação (B2B/B2G)

```
Cliente ──POST /verify (JSON + API Key)──▶ API
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │ Validar     │
                                        │ API Key     │
                                        │ (institution)│
                                        └──────┬──────┘
                                               ▼
                                        ┌─────────────┐
                                        │ .strip()    │
                                        │ no hash     │
                                        └──────┬──────┘
                                               ▼
                                        Mesma lógica pública
                                               │
                                               ▼
                                        Audit log VERIFY
                                        + institution_id
```

### 6.5 Revogação

```
Admin/Inst ──POST /emissions/{id}/revoke + JWT──▶ API
                                                      │
                                                      ▼
                                                ┌─────────────┐
                                                │ Valida role │
                                                │ (admin ou   │
                                                │  institution│
                                                │  dono)      │
                                                └──────┬──────┘
                                                       ▼
                                                ┌─────────────┐
                                                │ Query doc   │
                                                └──────┬──────┘
                                                       ▼
                                              ┌────────┴────────┐
                                              │                 │
                                           Não existe      Já revogado
                                              │                 │
                                              ▼                 ▼
                                            404           already_revoked
                                              │
                                              │
                                              │    ┌─────────────┐
                                              └───▶│ Update BD   │
                                                   │ revoked=TRUE│
                                                   │ + reason    │
                                                   │ + autor     │
                                                   └──────┬──────┘
                                                          ▼
                                                   ┌─────────────┐
                                                   │ Audit log   │
                                                   │ REVOKE      │
                                                   └──────┬──────┘
                                                          ▼
                                                   200 OK revoked
```

**Tempo esperado:** < 150ms

### 6.6 Auditoria

```
Admin ──GET /audit/logs + JWT──▶ API
                                      │
                                      ▼
                                ┌─────────────┐
                                │ Filtros     │
                                │ opcionais:  │
                                │ - data      │
                                │ - ação      │
                                │ - instituição│
                                │ - IP        │
                                └──────┬──────┘
                                       ▼
                                ┌─────────────┐
                                │ Query       │
                                │ paginada    │
                                │ (limit/     │
                                │  offset)    │
                                └──────┬──────┘
                                       ▼
                                200 OK + logs JSON
```

---

## 7. Autenticação

### 7.1 JWT Flow

```
┌─────────┐    login     ┌─────────┐    encode     ┌─────────┐
│ Cliente │───────────────▶│  API    │─────────────▶│  JWT    │
└─────────┘              └─────────┘              └────┬────┘
                                                       │
                                                       │ Bearer token
                                                       ▼
                                               ┌─────────────┐
                                               │ Header:     │
                                               │ Authorization│
                                               │ Bearer {token}│
                                               └──────┬──────┘
                                                      │
                                                      ▼
                                               ┌─────────────┐
                                               │ jwt.decode()│
                                               │ + SECRET_KEY│
                                               └──────┬──────┘
                                                      │
                                               ┌──────┴──────┐
                                               │             │
                                            Válido       Inválido
                                               │             │
                                               ▼             ▼
                                           Continua      401 Unauthorized
```

### 7.2 Payload JWT

```json
{
  "sub": "admin@txeka.co.mz",
  "email": "admin@txeka.co.mz",
  "id": "uuid",
  "role": "admin",
  "institution": "txeka",
  "exp": 1719900000,
  "iat": 1719813600
}
```

### 7.3 Sistema Dual de Login

| Tipo | Endpoint | Expiração | Acesso | Uso |
|------|----------|-----------|--------|-----|
| **Admin** | `/api/v1/auth/admin/login` | 90 dias | Sistema completo: emit, revoke, manage_institutions, audit_logs | Equipa Txeka, gestão de plataforma |
| **Instituição** | `/api/v1/auth/login` | 30 dias | emit, verify, dashboard próprio | INAGE, bancos, universidades |

### 7.4 Roles e Permissões

```python
ROLES = {
    "system":    ["verify", "emit", "revoke", "manage_institutions", "audit_logs"],
    "admin":     ["verify", "emit", "revoke", "manage_institutions", "audit_logs"],
    "institution": ["emit", "verify", "dashboard", "credits"],
    "citizen":   ["verify"]
}
```

> **Regra de segurança crítica:** O campo `user.role` é **sempre forçado pelo servidor** a partir do JWT decodificado. Nunca confiar no cliente.

---

## 8. Multi-Tenancy e Controlo de Créditos

### 8.1 Arquitetura Multi-Tenant

Cada instituição opera num **tenant isolado** lógico:

- `institution_id` em todas as tabelas (documents, audit_logs, credit_transactions)
- Filtro automático em queries: `WHERE institution_id = 'INAGE'`
- API keys únicas por instituição
- Dashboard segregado por tenant

### 8.2 Controlo de Créditos

| Operação | Consumo | Descrição |
|----------|---------|-----------|
| Emissão única | 1 crédito | Por documento individual |
| Emissão em bulk | N créditos | 1 por documento no array |
| Verificação | 0 créditos | Gratuito para todos |
| Revogação | 0 créditos | Operação administrativa |

**Fluxo de créditos:**
```
Instituição ──compra créditos──▶ Admin
                                      │
                                      ▼
                                ┌─────────────┐
                                │ credit_     │
                                │ transactions│
                                │ type:       │
                                │ 'purchase'  │
                                └──────┬──────┘
                                       ▼
                                institutions.credits += N
                                       │
                                Emissão de documento
                                       │
                                institutions.credits -= 1
                                       │
                                credit_transactions
                                type: 'consumption'
```

---

## 9. Segurança

### 9.1 Criptografia

| Algoritmo | Tipo | Uso | Força |
|-----------|------|-----|-------|
| **SHA-256** | Hash criptográfico | Hash do PDF binário | 256 bits — padrão bancário |
| **JWT (HS256)** | HMAC + SHA-256 | Autenticação stateless | Alta (secret em .env) |
| **bcrypt** | Password hashing | Login de utilizadores | 12 rounds (~100ms) |
| **TLS 1.3** | Transporte | HTTPS obrigatório | Padrão bancário |

### 9.2 Validação de Entrada

| Regra | Implementação | Mitigação |
|-------|--------------|-----------|
| Formato | Exclusivamente PDF (.pdf) | Rejeita .png, .jpg, .svg disfarçados |
| MIME | `application/pdf` | Content-Type spoofing |
| Magic bytes | `%PDF-` (primeiros 4 bytes) | Falsificação de extensão |
| Limite | < 50MB | DoS por upload massivo |
| Nome suspeito | Rejeita `.pdf.png`, `.pdf.exe` | Double extension attacks |
| Rate limiting | 100 req/min (público) / 1000 req/min (B2B) | Brute force, scraping |

### 9.3 Rate Limiting por Tier

| Tier | Limite | Janela | Uso |
|------|--------|--------|-----|
| **Público** | 100 req/min | 60s | Verificação anónima via portal |
| **B2B/B2G** | 1000 req/min | 60s | Integração API com API key |
| **Admin** | 500 req/min | 60s | Gestão e auditoria |
| **Bulk** | 100 docs/min | 60s | Emissão em lote |

### 9.4 CORS

```python
ALLOWED_ORIGINS = [
    # Desenvolvimento local
    "http://localhost:3000",
    "http://localhost:5173",
    # Produção cloud atual
    "https://txeka-ntiyiso-portal.onrender.com",
    # Futuro: domínio próprio
    "https://txekantiyiso.co.mz",
    "https://www.txekantiyiso.co.mz",
    "https://api.txekantiyiso.co.mz",
]
```

---

## 10. Deploy e Containerização

### 10.1 Dockerfile (Multi-Stage Build)

O Dockerfile utiliza **multi-stage build** para otimizar segurança e tamanho:

- **Stage 1 (Builder):** Instala Poetry, compila dependências com `gcc` e `libpq-dev`
- **Stage 2 (Runtime):** Apenas runtime essencial (`libpq5`, `curl`, `locales`), usuário não-root `txeka`, locale `pt_MZ.UTF-8`, TZ `Africa/Maputo`

**Características de segurança:**
- Usuário não-root (`txeka:txeka`) — mitiga Elevation of Privilege
- Sem bytecode Python (`PYTHONDONTWRITEBYTECODE=1`)
- Healthcheck a cada 30s com 3 retries
- 4 workers Uvicorn para concorrência

### 10.2 Docker Compose

Orquestração completa com 2 serviços:

| Serviço | Imagem | Recursos | Função |
|---------|--------|----------|--------|
| `db` | `postgres:15-alpine` | 1.0 CPU, 512M RAM | Base de dados com healthcheck |
| `api` | Build do Dockerfile | 1.0 CPU, 512M RAM | API Gateway com auto-migração |

**Características:**
- Rede isolada `txeka-network` (subnet `172.20.0.0/16`)
- Volumes persistentes: `txeka-data` (BD) e `txeka-logs` (auditoria)
- `depends_on` com `condition: service_healthy` — API só inicia após DB pronto
- Resource limits em ambos os serviços
- Variáveis de ambiente via `.env` (segredos nunca hardcoded)

### 10.3 Deploy Pipeline

**Desenvolvimento Local:**
```bash
docker-compose up -d --build
# 2-3 minutos para primeiro build
```

**Produção Cloud (Render.com):**
1. Push ao GitHub → webhook Render
2. Deteta `Dockerfile` → build automático
3. `poetry install` + `alembic upgrade head`
4. Health check `GET /health` → deploy confirmado

**Produção Nacional (Docker On-Premise):**
```bash
# Servidor Ubuntu 22.04 LTS em datacenter INTIC
sudo docker-compose up -d --build
# + Nginx reverse proxy + SSL AC-MZ
```

| Ambiente | Build | Migração | Health Check | Tempo Total |
|----------|-------|----------|--------------|-------------|
| Local | `docker-compose up --build` | `alembic upgrade head` automático | `GET /health` | 2-3 min |
| Render | Automático via webhook | `alembic upgrade head` | `GET /health` | 2-3 min |
| Nacional | `docker-compose up --build` | `alembic upgrade head` | `GET /health` | 3-5 min |

---

## 11. Performance

| Operação | Tempo Médio | P95 | P99 | Notas |
|----------|-------------|-----|-----|-------|
| **Emit** | 450ms | 600ms | 850ms | Inclui validação PDF + hash + QR |
| **Emit Bulk (100 docs)** | 1.8s | 2.5s | 3.5s | Transação atómica |
| **Verify** | 85ms | 120ms | 180ms | Query indexada por hash |
| **Revoke** | 120ms | 180ms | 250ms | Update + audit |
| **Audit Logs** | 200ms | 350ms | 500ms | Com filtros e paginação |
| **Health Check** | 15ms | 25ms | 40ms | Sem query à BD |
| **Dashboard** | 300ms | 500ms | 800ms | Agregação de métricas |

---

## 12. Monitoramento

### 12.1 Logs (structlog JSON)

```json
{
  "event": "Documento emitido",
  "doc_id": "DUAT-INAGE-20260626-XXXXXX",
  "user_email": "admin@txeka.co.mz",
  "institution_id": "INAGE",
  "credits_remaining": 145,
  "timestamp": "2026-06-27T08:44:00+02:00",
  "environment": "production"
}
```

### 12.2 Health Check

```json
GET /health
{
  "status": "online",
  "project": "Txeka Ntiyiso",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-06-27T08:44:00+02:00",
  "database": "connected",
  "uptime_seconds": 86400
}
```

### 12.3 Métricas Futuras (Prometheus + Grafana)

| Métrica | Alerta | Severidade |
|---------|--------|------------|
| Latência P95 > 500ms | Warning | 🟡 |
| Erros 5xx > 1% | Critical | 🔴 |
| CPU > 80% | Warning | 🟡 |
| Disco > 85% | Critical | 🔴 |
| Conexões DB > 80% | Warning | 🟡 |
| Créditos instituição < 10 | Warning | 🟡 |

---

## 13. Decisões Arquiteturais

### 13.1 Por que FastAPI?

| Critério | FastAPI | Django | Flask |
|----------|---------|--------|-------|
| Performance | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Auto-docs | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Type hints | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Async nativo | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Curva aprendizagem | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**Decisão:** FastAPI oferece performance (uvicorn + asyncio) e documentação automática sem boilerplate.

### 13.2 Por que PostgreSQL?

| Critério | PostgreSQL | MongoDB |
|----------|-----------|---------|
| Transações ACID | ⭐⭐⭐ | ⭐⭐ |
| Auditoria temporal | ⭐⭐⭐ | ⭐⭐ |
| SQL nativo | ⭐⭐⭐ | ⭐ |
| Supabase (grátis) | ⭐⭐⭐ | ⭐⭐ |
| Lei 3/2017 (auditoria) | ⭐⭐⭐ | ⭐⭐ |

**Decisão:** PostgreSQL com Supabase oferece ACID + auditoria + escalabilidade sem custo inicial.

### 13.3 Por que SHA-256 em vez de Blockchain?

| Critério | SHA-256 + BD | Blockchain |
|----------|-------------|------------|
| Simplicidade | ⭐⭐⭐ | ⭐ |
| Custo | ⭐⭐⭐ | ⭐ |
| Velocidade | ⭐⭐⭐ | ⭐⭐ |
| Imutabilidade | ⭐⭐⭐ (logs) | ⭐⭐⭐ |
| Conformidade MZ | ⭐⭐⭐ | ⭐⭐ |

**Decisão:** SHA-256 com PostgreSQL oferece imutabilidade via audit logs sem complexidade de blockchain.

### 13.4 Zero-Knowledge: Client-Side vs Server-Side Hashing

| Abordagem | Privacidade | Complexidade | Conformidade |
|-----------|------------|--------------|--------------|
| **Server-Side** (atual) | Alta (não guarda PDF) | Baixa | Lei 3/2017 ✅ |
| **Client-Side** (futuro) | Máxima (nunca toca no PDF) | Média | Lei 3/2017 ✅ |

**Decisão atual:** Server-side hashing — o PDF é processado em memória, o hash é guardado, o PDF é descartado. Nunca persistido.

---

## 14. Roadmap Técnico

| Fase | Período | Itens Técnicos |
|------|---------|----------------|
| **Fase 2** (Atual) | Q2–Q3 2026 | Dashboard Web React, registo de instituições, emissão em bulk, controlo de créditos, relatórios analíticos, multi-tenant completo |
| **Fase 3** | Q3 2026 | 2FA (TOTP), OAuth2, queries agregadas `/audit/stats`, SDK Python/JS, Go-to-market técnico |
| **Fase 4** | Q4 2026 | ML fraud detection, multi-idioma (PT/EN), mobile app, API v2, escala empresarial |

---

## 15. Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [README.md](../../README.md) | Apresentação do projeto, proposta de valor, roadmap |
| [POSITIONING.md](../../POSITIONING.md) | Posicionamento estratégico, declaração regulatória, glossário |
| [API Reference](../guides/API_REFERENCE.md) | Referência completa da API REST (endpoints, schemas, exemplos) |
| [Estratégia de Implantação](DEPLOYMENT.md) | Docker, deploy nacional, infraestrutura, SSL, backup |
| [Runbook de Produção](RUNBOOK.md) | Operações diárias, troubleshooting, manutenção, contactos de emergência |
| [Dossiê de Conformidade](../legal/COMPLIANCE.md) | Lei 3/2017, Decreto 59/2019, mapeamento de requisitos |
| [Políticas de Segurança](../legal/SECURITY.md) | Threat model, ataques mitigados, incident response |

---

*Documento gerado em conformidade com os princípios da Lei n.º 3/2017, Decreto n.º 59/2019 e Resolução n.º 69/2021 (PENSC) da República de Moçambique.*
