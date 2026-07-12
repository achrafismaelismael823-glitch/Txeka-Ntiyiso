# ARCHITECTURE.md

## Diagramas e Fluxos de Arquitetura — Txeka Ntiyiso

**Infraestrutura tecnológica para verificação da integridade e autenticidade documental em Moçambique**

| Versão | Estado | Última Atualização | Contacto |
|--------|--------|-------------------|----------|
| 1.0 | Final | 2026-07-12 | geral.txekantiyiso@gmail.com |

Documento visual de arquitetura, fluxos de dados, padrões de design e pipeline de deploy.

---

## Índice

1. [Stack Completa](#1-stack-completa)
2. [Fluxo de Emissão de Documento](#2-fluxo-de-emissão-de-documento)
3. [Fluxo de Verificação de Documento](#3-fluxo-de-verificação-de-documento)
4. [Fluxo de Reset de Password](#4-fluxo-de-reset-de-password)
5. [Segurança em Camadas](#5-segurança-em-camadas)
6. [Padrões de Design](#6-padrões-de-design)
7. [Pipeline de Deploy](#7-pipeline-de-deploy)
8. [Escalabilidade](#8-escalabilidade)
9. [Métricas de Performance](#9-métricas-de-performance)
10. [Documentação Relacionada](#10-documentação-relacionada)

---

## 1. Stack Completa

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Portal Web │  │  Mobile App │  │   QR Code   │  │  API B2B    │ │
│  │  (React+TW) │  │  (Futuro)   │  │   Scanner   │  │  (ERP/CRM)  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┼────────────────┼────────────────┼────────────────┼──────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   Cloudflare      │
                          │   (CDN + DNS)     │
                          │  txekantiyiso     │
                          │     .co.mz        │
                          └─────────┬─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
          │  www.          │ │  api.       │ │ verify.     │
          │  (Portal)      │ │  (API)      │ │ (URL curta) │
          └─────────┬──────┘ └──────┬──────┘ └──────┬──────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   Render.com      │
                          │   (Web Service)   │
                          │  Docker + Uvicorn │
                          └─────────┬─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
          │   FastAPI      │ │  Redis      │ │  Structlog  │
          │   (Python)     │ │ (Cache)     │ │   (Logs)    │
          │   JWT + RBAC   │ │ (Futuro)    │ │   JSON      │
          └─────────┬──────┘ └─────────────┘ └─────────────┘
                    │
          ┌─────────▼───────────────────────────────────────┐
          │         Supabase (PostgreSQL)                     │
          │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
          │  │documents│ │ audit   │ │institu- │            │
          │  │         │ │  logs   │ │  tions  │            │
          │  └─────────┘ └─────────┘ └─────────┘            │
          │         SHA-256 + Zero-Knowledge                │
          └─────────────────────────────────────────────────┘
```

**Camadas:**

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| **Edge** | Cloudflare | CDN, DNS, DDoS protection, WAF |
| **Compute** | Render.com + Docker | Containerização, auto-deploy, health checks |
| **Application** | FastAPI + Python 3.11 | API REST, lógica de negócio, JWT, RBAC |
| **Cache** | Redis (futuro) | Rate limiting distribuído, sessões temporárias |
| **Observability** | Structlog (JSON) | Logs estruturados, correlation ID, auditoria |
| **Persistence** | PostgreSQL 15 (Supabase) | ACID, hashes imutáveis, audit logs, multi-tenant |

---

## 2. Fluxo de Emissão de Documento

```
Instituição (Admin)
│
▼
POST /api/v1/certify
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
│
▼
┌──────────────┐
│  FastAPI     │
│  Router      │
│  (emission)  │
└──────┬───────┘
│
▼
┌──────────────┐
│  Validação   │ ──► PDF? MIME application/pdf? Tamanho < 50MB?
│  de Entrada  │ ──► Magic bytes %PDF-? Extensão .pdf?
└──────┬───────┘
│
▼
┌──────────────┐
│  SHA-256     │ ──► Hash do PDF (64 caracteres hexadecimais)
│  (hashlib)   │
└──────┬───────┘
│
▼
┌──────────────┐
│  Verifica    │ ──► Hash já existe? → 409 Conflict
│  Duplicado   │
└──────┬───────┘
│
▼
┌──────────────┐
│  Gera QR     │ ──► QR Code com URL de verificação pública
│  Code        │
└──────┬───────┘
│
▼
┌──────────────┐
│  Consome     │ ──► 1 crédito da instituição
│  Crédito     │
└──────┬───────┘
│
▼
┌──────────────┐
│  Persiste    │ ──► INSERT documents + INSERT audit_logs
│  na BD       │
└──────┬───────┘
│
▼
┌──────────────┐
│  Retorna     │
│  201 Created │
│  + cert_url  │
└──────────────┘
```

**Performance:** ~450 ms (média) | P95: 600 ms | P99: 850 ms

---

## 3. Fluxo de Verificação de Documento

```
Cidadão / Parceiro
│
▼
GET /api/v1/verify/{hash}
ou
POST /api/v1/verify (JSON)
│
▼
┌──────────────┐
│  FastAPI     │
│  Router      │
│  (verify)    │
└──────┬───────┘
│
▼
┌──────────────┐
│  Validação   │ ──► Hash = 64 caracteres hexadecimais?
│  de Entrada  │
└──────┬───────┘
│
▼
┌──────────────┐
│  Query BD    │ ──► SELECT * FROM documents WHERE doc_hash = ?
│  (asyncpg)   │
└──────┬───────┘
│
▼
┌──────────────┐
│  Verifica    │ ──► Não encontrado? → INVALID
│  Status      │ ──► Revogado? → REVOKED
│              │ ──► Ativo? → VALID
└──────┬───────┘
│
▼
┌──────────────┐
│  Audit Log   │ ──► INSERT audit_logs (action=VERIFY)
│  (assíncrono)│
└──────┬───────┘
│
▼
┌──────────────┐
│  Retorna     │
│  200 OK      │
│  + metadados │
└──────────────┘
```

**Performance:** ~85 ms (média) | P95: 120 ms | P99: 180 ms

---

## 4. Fluxo de Reset de Password

```
Admin do Sistema
│
▼
POST /api/v1/institutions/{CFN}/reset-password
Authorization: Bearer <admin_JWT>
│
▼
┌──────────────┐
│  FastAPI     │
│  Router      │
│(institution) │
└──────┬───────┘
│
▼
┌──────────────┐
│  Verifica    │ ──► JWT válido? Role = admin?
│  Permissão   │
└──────┬───────┘
│
▼
┌──────────────┐
│  Gera Nova   │ ──► Password temporária (12 caracteres aleatórios)
│  Password    │
└──────┬───────┘
│
▼
┌──────────────┐
│  Hash com    │ ──► bcrypt(password, rounds=12)
│  bcrypt      │
└──────┬───────┘
│
▼
┌──────────────┐
│  Atualiza    │ ──► UPDATE institutions SET password_hash = ?
│  na BD       │
└──────┬───────┘
│
▼
┌──────────────┐
│  Audit Log   │ ──► INSERT audit_logs (action=PASSWORD_RESET)
│              │
└──────┬───────┘
│
▼
┌──────────────┐
│  Retorna     │
│  200 OK      │
│  + password  │ ──► (temporária, mostrar uma única vez)
└──────────────┘
```

---

## 5. Segurança em Camadas

```
┌─────────────────────────────────────────┐
│  Layer 1: Network                       │
│  • HTTPS/TLS 1.3 obrigatório            │
│  • Cloudflare (DDoS + WAF)              │
│  • Rate limiting por IP (100 req/min)   │
├─────────────────────────────────────────┤
│  Layer 2: Application                   │
│  • JWT (HS256, expiração dual)          │
│  • RBAC (admin, institution, citizen)   │
│  • CORS restrito a domínios autorizados │
│  • Input validation (Pydantic schemas)  │
├─────────────────────────────────────────┤
│  Layer 3: Data                          │
│  • SHA-256 (integridade documental)       │
│  • bcrypt (passwords, rounds=12)        │
│  • Zero-Knowledge (não armazena PDFs)   │
│  • Audit logs imutáveis (apenas INSERT) │
├─────────────────────────────────────────┤
│  Layer 4: Infrastructure                │
│  • Docker (multi-stage, non-root user)  │
│  • PostgreSQL ACID + backups            │
│  • Rede isolada (subnet 172.20.0.0/16)  │
│  • Resource limits (CPU 1.0, RAM 512M)  │
└─────────────────────────────────────────┘
```

---

## 6. Padrões de Design

| Padrão | Implementação | Onde |
|--------|--------------|------|
| **MVC** | Models → Views (schemas) → Controllers (routes) | `models/`, `routes/` |
| **Dependency Injection** | `get_db()` injetado nos routers via FastAPI Depends | `database.py` |
| **Factory** | `_create_engine_safe()` para criação segura de engine | `database.py` |
| **Strategy** | Diferentes validações por tipo de documento | `emission_service.py` |
| **Repository** | Services isolam acesso à base de dados | `services/*.py` |
| **Singleton** | `settings = Settings()` carregado uma vez | `settings.py` |

---

## 7. Pipeline de Deploy

```
┌─────────┐    push     ┌─────────┐    build     ┌─────────┐
│  Dev    │────────────▶│  GitHub │────────────▶│  Render │
│ (local) │             │ (main)  │   webhook    │  Build  │
└─────────┘             └─────────┘              └────┬────┘
                                                      │
                                                      ▼
                                              ┌─────────────┐
                                              │  Docker     │
                                              │  Build      │
                                              │  (multi-    │
                                              │   stage)    │
                                              └──────┬──────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │  Alembic    │
                                              │  upgrade    │
                                              │  head       │
                                              └──────┬──────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │  Health     │
                                              │  Check      │
                                              │  /health    │
                                              └──────┬──────┘
                                                     │
                                          ┌──────────┴──────────┐
                                          │                     │
                                        PASS                   FAIL
                                          │                     │
                                          ▼                     ▼
                                    ┌─────────┐           ┌─────────┐
                                    │  LIVE   │           │Rollback │
                                    │         │           │         │
                                    └─────────┘           └─────────┘
```

---

## 8. Escalabilidade

### Horizontal (Futuro — Fase 3)

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Render  │     │ Render  │     │ Render  │
│Instance │◄───►│Instance │◄───►│Instance │
│   #1    │     │   #2    │     │   #3    │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
             ┌───────▼───────┐
             │  PostgreSQL   │
             │   (Primary)   │
             └───────┬───────┘
                     │
             ┌───────▼───────┐
             │  PostgreSQL   │
             │   (Replica)   │
             └───────────────┘
```

### Vertical (Atual — Render.com)

| Plano | CPU | RAM | Conexões BD | Custo |
|-------|-----|-----|-------------|-------|
| **Free** | 0.1 | 512 MB | 60 | $0 |
| **Starter** | 1.0 | 2 GB | 200 | ~$7/mês |
| **Pro** | 2.0 | 4 GB | 500 | ~$25/mês |

---

## 9. Métricas de Performance (Produção)

| Operação | Média | P95 | P99 | SLA |
|----------|-------|-----|-----|-----|
| **Emit** | 450 ms | 600 ms | 850 ms | < 1 s |
| **Verify** | 85 ms | 120 ms | 180 ms | < 200 ms |
| **Revoke** | 120 ms | 180 ms | 250 ms | < 500 ms |
| **Audit Stats** | 200 ms | 350 ms | 500 ms | < 1 s |
| **Health Check** | 15 ms | 25 ms | 40 ms | < 100 ms |

---

## 10. Documentação Relacionada

- [README.md](../../README.md) — Apresentação do projeto
- [POSITIONING.md](../../POSITIONING.md) — Posicionamento estratégico e regulatório
- [Arquitetura Técnica](TECHNICAL.md) — Stack, schema SQL e decisões técnicas
- [Guia de Deploy](DEPLOYMENT.md) — Docker, pipeline CI/CD e infraestrutura
- [Runbook de Produção](RUNBOOK.md) — Operações diárias e troubleshooting
- [API Reference](../guides/API_REFERENCE.md) — Contrato completo da API REST
- [Políticas de Segurança](../legal/SECURITY.md) — Modelo de ameaças STRIDE

---

*Txeka Ntiyiso — Arquitetura de Confiança para Moçambique 🇲🇿*
*Versão 1.0 — Julho 2026*
