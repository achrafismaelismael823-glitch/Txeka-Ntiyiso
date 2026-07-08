# Txeka Ntiyiso — Diagrama de Arquitetura

**Infraestrutura tecnológica nacional de verificação da integridade e autenticidade documental**

---

## 🏗️ Stack Completa (Visão Geral)

```

┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Portal Web │  │  Mobile App │  │   QR Code   │  │  API B2B    │   │
│  │  (React+TW) │  │  (Futuro)   │  │   Scanner   │  │  (ERP/CRM)  │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
└─────────┼────────────────┼────────────────┼────────────────┼──────────┘
│                │                │                │
└────────────────┴────────────────┴────────────────┘
│
┌────────▼────────┐
│   Cloudflare    │
│   (CDN + DNS)   │
│  txekantiyiso   │
│     .co.mz      │
└────────┬────────┘
│
┌──────────────┼──────────────┐
│              │              │
┌───────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│  www.        │ │  api.     │ │ verify.   │
│  (Portal)    │ │  (API)    │ │ (URL curta)│
└───────┬──────┘ └─────┬─────┘ └─────┬─────┘
│              │              │
└──────────────┼──────────────┘
│
┌────────▼────────┐
│   Render.com    │
│   (Web Service) │
│  Docker + Uvicorn│
└────────┬────────┘
│
┌──────────────┼──────────────┐
│              │              │
┌───────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
│   FastAPI    │ │  Redis    │ │  Structlog │
│   (Python)   │ │ (Cache)   │ │   (Logs)   │
│   JWT + RBAC │ │ (Futuro)  │ │   JSON     │
└───────┬──────┘ └───────────┘ └───────────┘
│
┌───────▼───────────────────────────────┐
│         Supabase (PostgreSQL)         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │documents│ │audit   │ │institu- │  │
│  │         │ │  logs   │ │  tions  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│         SHA-256 + Zero-Knowledge      │
└───────────────────────────────────────┘

```

---

## 🔄 Fluxos de Dados

### 1. Emissão de Documento (B2G/B2B)

```

Instituição (Admin)
│
▼
POST /api/v1/certify
Authorization: Bearer 
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
│  Validação   │ ──► PDF? MIME? Tamanho < 50MB?
│  de Entrada  │
└──────┬───────┘
│
▼
┌──────────────┐
│  SHA-256     │ ──► Hash do PDF (64 chars hex)
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
│  Gera QR     │ ──► QR Code com URL verify
│  Code        │
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

**Tempo:** ~450ms (P95: 600ms)

---

### 2. Verificação de Documento (Pública)

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
│  Validação   │ ──► Hash = 64 chars hex?
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

**Tempo:** ~85ms (P95: 120ms)

---

### 3. Reset de Password (Instituição CFM)

```

Admin do Sistema
│
▼
POST /api/v1/institutions/CFN/reset-password
Authorization: Bearer <admin_JWT>
│
▼
┌──────────────┐
│  FastAPI     │
│  Router      │
│  (institution)│
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
│  Gera Nova   │ ──► Password temporária (12 chars)
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
│  + password  │ ──► (temp, mostrar uma vez)
└──────────────┘

```

---

## 🛡️ Segurança em Camadas

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
│  • CORS restrito                        │
│  • Input validation (Pydantic)          │
├─────────────────────────────────────────┤
│  Layer 3: Data                          │
│  • SHA-256 (integridade documental)       │
│  • bcrypt (passwords, rounds=12)        │
│  • Zero-Knowledge (não guarda PDFs)     │
│  • Audit logs imutáveis                 │
├─────────────────────────────────────────┤
│  Layer 4: Infrastructure                │
│  • Docker (multi-stage, non-root)       │
│  • PostgreSQL ACID                      │
│  • Backup automático (futuro)           │
└─────────────────────────────────────────┘

```

---

## 🎨 Padrões de Design

| Padrão | Implementação | Onde |
|--------|--------------|------|
| **MVC** | Models → Views (schemas) → Controllers (routes) | `models/`, `routes/` |
| **Dependency Injection** | `get_db()` injetado nos routers | `database.py` |
| **Factory** | `_create_engine_safe()` | `database.py` |
| **Strategy** | Diferentes validações por tipo de documento | `emission_service.py` |
| **Repository** | Services isolam acesso à BD | `services/*.py` |
| **Singleton** | `settings = Settings()` | `settings.py` |

---

## 📦 Deployment Pipeline

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
┌───────┴───────┐
│               │
PASS            FAIL
│               │
▼               ▼
┌─────────┐     ┌─────────┐
│  LIVE   │     │ Rollback│
│         │     │         │
└─────────┘     └─────────┘

```

---

## 📈 Escalabilidade

### Horizontal (Futuro)
```

┌─────────┐     ┌─────────┐     ┌─────────┐
│ Render  │     │ Render  │     │ Render  │
│ Instance│     │ Instance│     │ Instance│
│   #1    │◄───►│   #2    │◄───►│   #3    │
└────┬────┘     └────┬────┘     └────┬────┘
│               │               │
└───────────────┼───────────────┘
│
┌──────▼──────┐
│  PostgreSQL │
│  (Primary)  │
└──────┬──────┘
│
┌──────▼──────┐
│  PostgreSQL   │
│  (Replica)    │
└─────────────┘

```

### Vertical (Atual)
| Recurso | Free | Starter | Pro |
|---------|------|---------|-----|
| CPU | 0.1 | 1.0 | 2.0 |
| RAM | 512 MB | 2 GB | 4 GB |
| Conexões BD | 60 | 200 | 500 |

---

## 📊 Métricas de Performance (Produção)

| Operação | Média | P95 | P99 |
|----------|-------|-----|-----|
| **Emit** | 450ms | 600ms | 850ms |
| **Verify** | 85ms | 120ms | 180ms |
| **Revoke** | 120ms | 180ms | 250ms |
| **Audit Stats** | 200ms | 350ms | 500ms |
| **Health Check** | 15ms | 25ms | 40ms |

---

## 🔗 Referências

- [TECHNICAL.md](TECHNICAL.md) — Stack completo e decisões técnicas
- [DEPLOYMENT.md](DEPLOYMENT.md) — Pipeline CI/CD e Docker
- [SECURITY.md](../legal/SECURITY.md) — Modelo de ameaças STRIDE
- [API_REFERENCE.md](../guides/API_REFERENCE.md) — Contrato da API

---

*Txeka Ntiyiso — Arquitetura de Confiança para Moçambique 🇲🇿*
```
