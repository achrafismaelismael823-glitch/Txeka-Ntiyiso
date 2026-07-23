# Documentação Técnica — Txeka Ntiyiso

**Arquitetura, Stack e Decisões Técnicas**

| Versão | Estado | Última Atualização | Contacto |
|--------|--------|-------------------|----------|
| 2.0.0 | Final | 2026-07-23 | geral.txekantiyiso@gmail.com |

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Decisões Arquiteturais](#3-decisões-arquiteturais)
4. [Modelo de Dados](#4-modelo-de-dados)
5. [Fluxo de Dados](#5-fluxo-de-dados)
6. [Segurança](#6-segurança)
7. [Performance](#7-performance)
8. [Escalabilidade](#8-escalabilidade)
9. [Roadmap Técnico](#9-roadmap-técnico)
10. [Documentação Relacionada](#10-documentação-relacionada)

---

## 1. Visão Geral da Arquitetura

```
+--------------------------------------------------+
|                    CLIENTE                        |
|  (Instituição / Cidadão / Banco / Governo)      |
+----------+---------------------------------------+
           |
           | HTTPS (TLS 1.3)
           v
+----------+----------+     +---------------------+
|   Render.com        |     |  PostgreSQL         |
|   FastAPI + Uvicorn |<--->|  15 (managed)      |
|   Python 3.11       |     |  Hashes + Logs      |
+----------+----------+     +---------------------+
           |
           v
+----------+----------+
|  JWT + bcrypt       |
|  SHA-256 (in-memory)|
+---------------------+
```

**Princípio Zero-Knowledge:** A plataforma armazena apenas hashes SHA-256 (64 caracteres hexadecimais). Os documentos originais (PDF) nunca saem do ambiente do cliente.

---

## 2. Stack Tecnológico

### Backend

| Componente | Versão | Função |
|------------|--------|--------|
| Python | 3.11 | Linguagem principal |
| FastAPI | 0.110.0 | Framework web async |
| Uvicorn | 0.28.0 | Servidor ASGI |
| SQLAlchemy | 2.0.29 | ORM |
| Alembic | 1.12.1 | Migrations |
| Pydantic | 2.10.3 | Validação de dados |
| Pydantic-Settings | 2.2.1 | Configuração via `.env` |
| PyJWT | 2.8.0 | Tokens JWT |
| bcrypt | 5.0.0 | Hashing de passwords |
| slowapi | 0.1.9 | Rate limiting |
| structlog | 24.1.0 | Logging estruturado |

### Base de Dados

| Componente | Versão | Função |
|------------|--------|--------|
| PostgreSQL | 15 | Base de dados relacional |
| asyncpg | 0.29.0 | Driver async para PostgreSQL |
| psycopg2-binary | 2.9.9 | Driver sync para PostgreSQL |

### Infraestrutura

| Componente | Versão | Função |
|------------|--------|--------|
| Docker | 24.0+ | Containerização |
| Docker Compose | 2.20+ | Orquestração local |
| Nginx | 1.24+ | Reverse proxy (on-premise) |
| Render.com | — | PaaS (produção cloud) |

### DevOps / Qualidade

| Componente | Versão | Função |
|------------|--------|--------|
| Poetry | 2.1.3 | Gestão de dependências |
| pytest | 8.4.2 | Testes unitários |
| pytest-cov | 4.1.0 | Cobertura de testes |
| pytest-asyncio | 0.23.8 | Testes async |
| bandit | 1.9.4 | Análise de segurança estática |
| GitHub Actions | — | CI/CD |

---

## 3. Decisões Arquiteturais

### 3.1 Por que FastAPI?

| Critério | FastAPI | Django | Flask |
|----------|---------|--------|-------|
| Performance | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Async nativo | ✅ | ❌ | ⚠️ |
| Documentação automática | ✅ (Swagger) | ⚠️ (DRF) | ❌ |
| Type hints | ✅ | ❌ | ❌ |
| Curva de aprendizado | Média | Alta | Baixa |

**Decisão:** FastAPI oferece async nativo, documentação automática e performance superior para I/O-bound workloads (verificação de hashes).

### 3.2 Por que PostgreSQL?

| Critério | PostgreSQL | MongoDB | MySQL |
|----------|-----------|---------|-------|
| ACID | ✅ | ⚠️ | ✅ |
| JSONB | ✅ | ✅ | ⚠️ |
| Full-text search | ✅ | ✅ | ⚠️ |
| Extensões | ✅ (PostGIS, etc.) | ⚠️ | ⚠️ |
| Licença | Open Source | SSPL | GPL |

**Decisão:** PostgreSQL oferece ACID completo, suporte a JSONB para logs flexíveis, e é o padrão para aplicações governamentais em Moçambique.

### 3.3 Por que SHA-256?

| Algoritmo | Tamanho | Colisões | Performance | Uso |
|-----------|---------|----------|-------------|-----|
| SHA-256 | 256 bits | Improvável | Rápido | Padrão bancário |
| SHA-512 | 512 bits | Improvável | Médio | Militar |
| MD5 | 128 bits | Viável | Muito rápido | ❌ Obsoleto |
| BLAKE3 | 256 bits | Improvável | Muito rápido | Moderno |

**Decisão:** SHA-256 é amplamente auditado, suportado por todas as linguagens, e reconhecido legalmente em Moçambique (Lei 3/2017).

### 3.4 Por que JWT (stateless)?

| Critério | JWT | Sessions |
|----------|-----|----------|
| Escalabilidade | ✅ (sem estado) | ❌ (redis necessário) |
| Latência | ✅ (sem lookup) | ⚠️ (lookup DB) |
| Revogação | ⚠️ (blacklist) | ✅ (instantânea) |
| Complexidade | Média | Baixa |

**Decisão:** JWT oferece escalabilidade horizontal sem estado. Revogação é gerida via expiração curta (60 minutos) + refresh tokens (7 dias).

---

## 4. Modelo de Dados

### 4.1 Diagrama ER (Simplificado)

```
+----------------+       +------------------+       +----------------+
| institutions   |       | documents        |       | audit_logs     |
+----------------+       +------------------+       +----------------+
| id (PK)        |<-----| id (PK)          |       | id (PK)        |
| name           |       | doc_hash (UQ)    |       | action         |
| email          |       | doc_id           |       | entity_type    |
| api_key_hash   |       | institution_id   |------>| entity_id      |
| password_hash  |       | status           |       | institution_id |------> institutions
| credits        |       | created_at       |       | details (JSONB)|
| is_active      |       | revoked_at       |       | ip_address     |
| created_at     |       | revoked_reason   |       | created_at     |
+----------------+       +------------------+       +----------------+
        |                                              |
        |       +------------------+                  |
        +------>| institution_logs   |<-----------------+
                +------------------+
                | id (PK)          |
                | institution_id   |
                | action           |
                | details (JSONB)  |
                | created_at       |
                +------------------+
```

### 4.2 Tabelas Principais

#### `institutions`

| Coluna | Tipo | Restrição | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | Identificador único |
| name | VARCHAR(255) | NOT NULL | Nome da instituição |
| email | VARCHAR(255) | UQ, NOT NULL | Email de contacto |
| api_key_hash | VARCHAR(255) | — | Hash da API key (bcrypt) |
| password_hash | VARCHAR(255) | — | Hash da password (bcrypt) |
| credits | INTEGER | DEFAULT 0 | Créditos disponíveis |
| is_active | BOOLEAN | DEFAULT true | Estado da conta |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de criação |

#### `documents`

| Coluna | Tipo | Restrição | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | Identificador único |
| doc_hash | VARCHAR(64) | UQ, NOT NULL | Hash SHA-256 do PDF |
| doc_id | VARCHAR(50) | UQ, NOT NULL | ID legível (ex: DUAT-INAGE-20260604-A1B2C3D4) |
| institution_id | UUID | FK | Instituição emissora |
| status | ENUM | DEFAULT 'active' | active / revoked |
| created_at | TIMESTAMP | DEFAULT NOW() | Data de emissão |
| revoked_at | TIMESTAMP | — | Data de revogação |
| revoked_reason | TEXT | — | Motivo da revogação |

#### `audit_logs`

| Coluna | Tipo | Restrição | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | Identificador único |
| action | VARCHAR(50) | NOT NULL | EMIT / VERIFY / REVOKE / LOGIN |
| entity_type | VARCHAR(50) | — | document / institution |
| entity_id | VARCHAR(255) | — | ID do documento ou instituição |
| institution_id | UUID | FK | Instituição relacionada |
| details | JSONB | — | Metadados adicionais |
| ip_address | INET | — | IP do requisitante |
| created_at | TIMESTAMP | DEFAULT NOW() | Timestamp CAT (UTC+2) |

### 4.3 Índices

```sql
-- Performance crítica
CREATE INDEX idx_documents_doc_hash ON documents(doc_hash);
CREATE INDEX idx_documents_institution ON documents(institution_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_institution ON audit_logs(institution_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Busca de texto
CREATE INDEX idx_audit_logs_details ON audit_logs USING GIN(details);
```

---

## 5. Fluxo de Dados

### 5.1 Emissão de Documento

```
1. Instituição envia PDF via POST /api/v1/certify
   |
   v
2. API recebe ficheiro (UploadFile)
   |
   v
3. PDF é processado em memória (nunca persistido)
   |
   v
4. SHA-256 é calculado (64 caracteres hex)
   |
   v
5. Verifica duplicidade (doc_hash UNIQUE)
   |
   v
6. Regista em `documents` + `audit_logs`
   |
   v
7. Retorna: doc_id, hash, QR code, URL de verificação
```

### 5.2 Verificação de Documento

```
1. Cidadão envia hash via GET /api/v1/verify/{hash}
   |
   v
2. API valida formato (64 caracteres hex)
   |
   v
3. Pesquisa em `documents` por doc_hash
   |
   v
4. Verifica status (active / revoked)
   |
   v
5. Regista em `audit_logs` (VERIFY)
   |
   v
6. Retorna: status, instituição, timestamp, metadados
```

### 5.3 Revogação de Documento

```
1. Admin/Instituição envia POST /api/v1/emissions/{id}/revoke
   |
   v
2. API valida JWT + role
   |
   v
3. Atualiza `documents.status` = 'revoked'
   |
   v
4. Regista `documents.revoked_at` e `revoked_reason`
   |
   v
5. Regista em `audit_logs` (REVOKE)
   |
   v
6. Retorna: confirmação de revogação
```

---

## 6. Segurança

### 6.1 Modelo de Ameaças (STRIDE)

| Vetor | Descrição | Mitigação |
|-------|-----------|-----------|
| **S**poofing | Falsificar identidade | JWT + institution_id validado no servidor |
| **T**ampering | Alterar documento | SHA-256 imutável; qualquer alteração invalida hash |
| **R**epudiation | Negar emissão | Audit logs imutáveis com timestamp CAT |
| **I**nformation Disclosure | Vazamento | Zero-Knowledge: apenas hashes armazenados |
| **D**enial of Service | Sobrecarga | Rate limiting (100 req/min), resource limits |
| **E**levation of Privilege | Escalar privilégios | Roles server-side; usuário não-root no container |

### 6.2 Criptografia

| Algoritmo | Uso | Implementação |
|-----------|-----|---------------|
| SHA-256 | Hash de documentos | `hashlib.sha256()` |
| JWT (HS256) | Autenticação stateless | `pyjwt` com `JWT_SECRET_KEY` |
| bcrypt | Hashing de passwords | `bcrypt` com 12 rounds |
| TLS 1.3 | Cifragem em trânsito | Nginx / Render |

### 6.3 Autenticação e Autorização

```python
ROLES = {
    "admin":       ["verify", "emit", "revoke", "audit", "institution_manage", "credit_manage"],
    "institution": ["emit", "verify", "revoke"],
}
```

> **Regra crítica:** `user.role` é sempre forçado pelo servidor a partir do JWT decodificado. Nunca confiar no cliente.

---

## 7. Performance

### 7.1 Benchmarks

| Operação | Latência P95 | Throughput |
|----------|-------------|------------|
| Verificação (GET /verify/{hash}) | < 100ms | 1000 req/min |
| Emissão (POST /certify) | < 500ms | 60 req/min |
| Emissão em bulk (POST /certify/bulk) | < 2s (100 docs) | 1 req/min |
| Login (POST /auth/login) | < 200ms | 5 req/min |

### 7.2 Otimizações

| Estratégia | Implementação | Impacto |
|------------|--------------|---------|
| Índices PostgreSQL | `doc_hash`, `institution_id`, `status` | 10x faster lookups |
| Async I/O | FastAPI + asyncpg | 3x throughput vs sync |
| Connection pooling | SQLAlchemy `pool_size=20` | Reduz overhead de conexões |
| Rate limiting | slowapi (in-memory) | Proteção contra DoS |
| Workers Uvicorn | 4 workers (Docker) | Paralelismo de requests |

---

## 8. Escalabilidade

### 8.1 Horizontal (Fase 3)

```
+----------+     +----------+     +----------+
|  Nginx   |---->|  API 1   |---->|  PostgreSQL  |
|  (LB)    |     |  (FastAPI)|     |  (Primary)    |
+----------+     +----------+     +----------+
     |           |  API 2   |          |
     |           |  (FastAPI)|     +----------+
     |           +----------+     |  Replica  |
     |                            +----------+
     v
+----------+
|  Redis   |  <-- Cache de sessões / rate limiting distribuído
+----------+
```

### 8.2 Vertical (Atual)

| Recurso | Limite | Utilização Típica |
|---------|--------|------------------|
| CPU | 1.0 vCPU | 15-30% |
| RAM | 512 MB | 200-300 MB |
| Disco | 100 GB | 5-10 GB |
| Conexões DB | 100 | 10-20 |

---

## 9. Roadmap Técnico

| Fase | Período | Objectivo | Stack Adicional |
|------|---------|-----------|----------------|
| **Fase 1** | Q1 2026 | ✅ MVP: Emissão + Verificação + Revogação | FastAPI + PostgreSQL |
| **Fase 2** | Q2–Q3 2026 | 🔄 Instituições + Créditos + Dashboard | Pydantic-Settings + Alembic |
| **Fase 3** | Q3 2026 | ⏳ HA + Cache + Monitoramento | Redis + Prometheus + Grafana |
| **Fase 4** | Q4 2026 | ⏳ ML + OAuth2 + 2FA | scikit-learn + OAuth2 + TOTP |

---

## 10. Documentação Relacionada

- [README.md](../README.md) — Apresentação do projeto
- [Arquitetura Técnica](ARCHITECTURE.md) — Este documento
- [Guia de Deploy](DEPLOYMENT.md) — Docker, pipeline CI/CD e infraestrutura
- [Runbook de Produção](RUNBOOK.md) — Operações diárias e troubleshooting
- [API Reference](../guides/API_REFERENCE.md) — Contrato completo da API REST
- [Políticas de Segurança Cibernética](../legal/SECURITY.md) — Threat model e segurança
- [Dossiê de Conformidade Legal](../legal/COMPLIANCE.md) — Enquadramento jurídico completo

---

*Documento elaborado em alinhamento com a Lei n.º 3/2017, Decreto n.º 59/2019 e Resolução n.º 69/2021 (PENSC) da República de Moçambique.*
*Versão 2.0.0 — Julho 2026*
