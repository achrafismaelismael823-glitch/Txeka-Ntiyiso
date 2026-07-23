# Arquitetura Tecnica - Txeka Ntiyiso

> **Versao:** 2.0.0  
> **Ultima atualizacao:** 22/07/2026  
> **Fase:** Fase 2 - Gestao de Instituicoes & Controlo de Creditos

---

## Indice

- [Visao Geral](#visao-geral)
- [Stack Tecnologica](#stack-tecnologica)
- [Arquitetura em Camadas](#arquitetura-em-camadas)
- [Fluxos de Dados](#fluxos-de-dados)
- [Modelo de Dados](#modelo-de-dados)
- [Seguranca](#seguranca)
- [Pipeline de Deploy](#pipeline-de-deploy)
- [Escalabilidade](#escalabilidade)
- [Metricas e SLA](#metricas-e-sla)

---

## Visao Geral

O Txeka Ntiyiso e uma plataforma de infraestrutura digital B2G/B2B para verificacao da integridade e autenticidade de documentos em Mocambique. A arquitetura segue os principios de:

- **Zero-Knowledge:** Documentos originais nunca saem do dispositivo do utilizador
- **Multi-tenant:** Suporte a multiplas instituicoes com isolamento logico
- **Stateless:** API REST sem estado, escalavel horizontalmente
- **Auditavel:** Toda operacao e registada em logs imutaveis

---

## Stack Tecnologica

| Camada | Tecnologia | Versao | Funcao |
|--------|-----------|--------|--------|
| Linguagem | Python | 3.11 | Backend, logica de negocio |
| Framework | FastAPI | 0.110.0 | API REST, validacao, documentacao auto |
| Servidor ASGI | Uvicorn | 0.28.0 | Servidor HTTP assincrono |
| ORM | SQLAlchemy | 2.0.29 | Mapeamento objeto-relacional |
| Migrations | Alembic | 1.12.1 | Versionamento de schema |
| Base de Dados | PostgreSQL | 15 | Persistencia ACID |
| Driver Async | asyncpg | 0.29.0 | Conexao assincrona com PostgreSQL |
| Driver Sync | psycopg2-binary | 2.9.9 | Conexao sincrona (Alembic) |
| Hashing | bcrypt | 5.0.0 | Hash de passwords |
| JWT | python-jose + PyJWT | 3.5.0 / 2.8.0 | Tokens de autenticacao |
| Rate Limiting | slowapi + limits | 0.1.9 / 3.8.0 | Protecao contra abuso |
| Logging | structlog | 24.1.0 | Logs estruturados JSON |
| QR Code | qrcode + Pillow | 7.4.2 / 11.0.0 | Geracao de QR codes verificaveis |
| PDF | PyPDF2 | 3.0.1 | Validacao de ficheiros PDF |
| Config | pydantic-settings | 2.2.1 | Gestao de configuracoes |
| Frontend | React + Tailwind CSS | 18.x | Portal web |
| Deploy | Render + Docker | - | Cloud e on-premise |
| CI/CD | GitHub Actions | - | Testes, lint, deploy |

---

## Arquitetura em Camadas

```
+---------------------+
|    Cliente          |  <- Navegador, App Mobile, Sistema Externo
|  (React / Mobile)     |
+----------+----------+
           |
           | HTTPS
           v
+---------------------+
|   Nginx / Render    |  <- SSL, Reverse Proxy, Rate Limiting
|   (Edge Layer)      |
+----------+----------+
           |
           v
+---------------------+
|   FastAPI Gateway   |  <- Rotas, Middleware, Auth, Validacao
|   (API Layer)       |
+----------+----------+
           |
     +-----+-----+
     |           |
     v           v
+---------+  +---------+
|Business |  |Business |
|Logic    |  |Logic    |  <- Services, Use Cases, Rules
|Layer    |  |Layer    |
+----+----+  +----+----+
     |            |
     v            v
+---------+  +---------+
| Data    |  | Audit   |  <- Repositorios, Queries
| Access  |  | Logs    |
| Layer   |  | Layer   |
+----+----+  +----+----+
     |            |
     v            v
+---------+  +---------+
|PostgreSQL|  |PostgreSQL|  <- Dados + Logs imutaveis
|  Dados   |  |  Logs    |
+---------+  +---------+
```

### Camadas Detalhadas

#### 1. Edge Layer (Nginx / Render)
- Terminacao SSL/TLS
- Reverse proxy para o Uvicorn
- Headers de seguranca (HSTS, CSP, X-Frame-Options)
- Compressao gzip

#### 2. API Layer (FastAPI)
- **Roteamento:** Prefixo `/api/v1` com include_router
- **Middleware:**
  - CORS para origens permitidas
  - Rate limiting (slowapi)
  - Logging de requests (structlog)
  - Tratamento global de excecoes
- **Dependencias:**
  - `get_db()` - Sessao de base de dados
  - `get_current_user()` - Extracao e validacao de JWT
  - `verify_role("admin")` - Verificacao de permissao

#### 3. Business Logic Layer
- **Services:**
  - `AuthService` - Login, tokens, password reset
  - `CertifyService` - Emissao de documentos, hash SHA-256
  - `VerifyService` - Verificacao publica e privada
  - `InstitutionService` - CRUD de instituicoes, creditos
  - `AuditService` - Registo de logs, queries agregadas
- **Use Cases:**
  - Emissao unica e em bulk
  - Verificacao via QR code ou API
  - Revogacao administrativa
  - Gestao de creditos e planos

#### 4. Data Access Layer
- **Repositorios:**
  - `DocumentRepository` - CRUD de documentos
  - `InstitutionRepository` - CRUD de instituicoes
  - `CreditRepository` - Transacoes de creditos
  - `AuditLogRepository` - Logs de auditoria
- **Queries:**
  - Queries agregadas para `/stats`
  - Filtros avancados para `/logs`
  - Historico cronologico por documento

#### 5. Audit Logs Layer
- Tabela separada `audit_logs` com trigger de imutabilidade
- Registo de toda operacao: EMIT, VERIFY, REVOKE, LOGIN, BULK_EMIT
- Retencao minima de 20 anos (Decreto 59/2019)
- Acesso exclusivo via token de Admin

---

## Fluxos de Dados

### Fluxo 1: Emissao de Documento (Fase 2)

```
Utilizador (Portal Web)
    |
    | 1. Anexa PDF
    v
+---------------+
| Client-Side   |  <- Hash SHA-256 calculado no navegador (Zero-Knowledge)
| SHA-256       |
+-------+-------+
    | 2. Envia hash (64 chars)
    v
+---------------+
| POST /certify |  <- FastAPI valida token, creditos, PDF
|               |
| - Verifica    |  <- InstitutionService: creditos > 0?
|   creditos    |
| - Gera hash   |  <- CertifyService: SHA-256 do ficheiro
| - Cria doc    |  <- DocumentRepository: INSERT
| - Debita      |  <- CreditRepository: UPDATE credits -= 1
|   credito     |
| - Gera QR     |  <- qrcode library
| - Regista log |  <- AuditLogRepository: INSERT audit_logs
+-------+-------+
    | 3. Resposta JSON
    v
+---------------+
| Resposta com  |  <- doc_id, doc_hash, qr_code, certificate_url
| doc_id, hash, |
| QR code       |
+---------------+
```

### Fluxo 2: Verificacao Publica (Anonima)

```
Cidadao / Parceiro
    |
    | 1. Escaneia QR code ou acede URL
    v
+---------------+
| GET /verify/  |  <- Sem autenticacao (publico)
| {doc_hash}    |
|               |
| - Valida hash |  <- VerifyService: regex SHA-256
| - Consulta BD |  <- DocumentRepository: SELECT
| - Verifica    |  <- Se revoked=true, retorna status
|   revogacao   |
| - Regista log |  <- AuditLogRepository: INSERT VERIFY
+-------+-------+
    | 2. Resposta JSON
    v
+---------------+
| Status: valid |  <- Dados publicos (tipo, instituicao, data)
| ou revoked    |
+---------------+
```

### Fluxo 3: Gestao de Instituicoes (Admin)

```
Administrador
    |
    | 1. Login com credenciais admin
    v
+---------------+
| POST /admin/  |  <- AuthService: valida, gera JWT (90 dias)
| login         |
+-------+-------+
    | 2. Token JWT
    v
+---------------+
| CRUD          |  <- InstitutionService
| Instituicoes  |
|               |
| - Criar       |  <- POST /{institution_id}
| - Ler         |  <- GET /{institution_id}
| - Atualizar   |  <- PATCH /{institution_id}
| - Creditos    |  <- POST /{institution_id}/credits
| - Reset pass  |  <- POST /{institution_id}/reset-password
| - Regen key   |  <- POST /{institution_id}/regenerate-api-key
+-------+-------+
    | 3. Resposta
    v
+---------------+
| JSON com      |  <- InstitutionResponse
| dados da      |
| instituicao   |
+---------------+
```

### Fluxo 4: Dashboard da Instituicao

```
Instituicao (logada)
    |
    | 1. Token JWT (30 dias)
    v
+---------------+
| GET /me/      |  <- InstitutionService: dados da instituicao
| dashboard     |  <- CreditRepository: historico de creditos
|               |  <- DocumentRepository: total_emitted
|               |  <- AuditLogRepository: total_verifications
+-------+-------+
    | 2. Resposta
    v
+---------------+
| Dashboard     |  <- InstitutionDashboard
| completo com  |  <- institution + credits_history + metricas
| metricas      |
+---------------+
```

---

## Modelo de Dados

### Diagrama Entidade-Relacao

```
+----------------+       +-------------------+       +------------------+
| institutions   |<----->| credit_transactions|       | documents        |
+----------------+       +-------------------+       +------------------+
| id (PK)        |       | id (PK)           |       | id (PK)          |
| name           |       | institution_id(FK) |       | doc_id (unique)  |
| contact_email  |       | amount            |       | doc_hash (unique)|
| password_hash  |       | type              |       | document_type    |
| api_key_hash   |       | description       |       | institution_id   |
| role           |       | payment_method    |       | file_name        |
| subscription   |       | payment_reference |       | file_size        |
| credits        |       | notes             |       | issued_by        |
| docs_emitted   |       | created_by        |       | created_at       |
| status         |       | created_at        |       | revoked          |
| approved       |       +-------------------+       | revoked_at       |
| created_at     |                                    | revoked_reason   |
| updated_at     |<----------------------------------| revoked_by       |
+----------------+                                    +------------------+
         |                                                     |
         |                                                     |
         v                                                     v
+----------------+                                    +------------------+
| audit_logs     |<-----------------------------------| (triggers)       |
+----------------+                                    +------------------+
| id (PK)        |
| action         |
| institution_id |
| doc_hash       |
| ip_address     |
| user_agent     |
| details        |
| created_at     |
+----------------+
```

### Tabelas

#### institutions
- **id:** VARCHAR(PK) - Identificador unico (ex: "INAGE", "INSS")
- **name:** VARCHAR - Nome completo da instituicao
- **contact_email:** VARCHAR - Email de contacto
- **password_hash:** VARCHAR - Hash bcrypt da password
- **api_key_hash:** VARCHAR - Hash da API key (para futuras integracoes)
- **role:** VARCHAR - "institution" | "admin"
- **subscription_plan:** VARCHAR - "free" | "standard" | "premium"
- **credits:** INTEGER - Creditos disponiveis para emissao
- **docs_emitted_month:** INTEGER - Documentos emitidos no mes atual
- **status:** VARCHAR - "pending" | "active" | "suspended" | "inactive"
- **approved:** BOOLEAN - Aprovacao manual pelo admin
- **created_at:** TIMESTAMP - Data de criacao
- **updated_at:** TIMESTAMP - Data de ultima atualizacao

#### documents
- **id:** SERIAL (PK)
- **doc_id:** VARCHAR (unique) - UUID formatado (DOC-xxx)
- **doc_hash:** VARCHAR (unique, 64 chars) - SHA-256 do documento
- **document_type:** VARCHAR - Tipo (DUAT, CERTIDAO, ALVARA, etc.)
- **institution_id:** VARCHAR (FK -> institutions.id)
- **file_name:** VARCHAR - Nome original do ficheiro
- **file_size:** INTEGER - Tamanho em bytes
- **issued_by:** VARCHAR - ID da instituicao emissora
- **created_at:** TIMESTAMP - Data de emissao
- **revoked:** BOOLEAN - Status de revogacao
- **revoked_at:** TIMESTAMP - Data de revogacao
- **revoked_reason:** TEXT - Motivo da revogacao
- **revoked_by:** VARCHAR - Quem revogou

#### credit_transactions
- **id:** SERIAL (PK)
- **institution_id:** VARCHAR (FK -> institutions.id)
- **amount:** INTEGER - Quantidade de creditos (positivo/negativo)
- **type:** VARCHAR - "manual_add" | "bonus" | "refund" | "consumption"
- **description:** TEXT - Descricao da transacao
- **payment_method:** VARCHAR - "bank_transfer" | "cash" | "mpesa" | "bonus" | "none"
- **payment_reference:** VARCHAR - Referencia do pagamento
- **notes:** TEXT - Notas internas
- **created_by:** VARCHAR - Email do admin que criou
- **created_at:** TIMESTAMP - Data da transacao

#### audit_logs
- **id:** SERIAL (PK)
- **action:** VARCHAR - "EMIT" | "VERIFY" | "REVOKE" | "LOGIN" | "BULK_EMIT" | "CREDIT_ADD"
- **institution_id:** VARCHAR (FK, nullable) - Instituicao envolvida
- **doc_hash:** VARCHAR (64 chars, nullable) - Hash do documento
- **ip_address:** VARCHAR - IP do cliente
- **user_agent:** TEXT - User-Agent do navegador
- **details:** JSONB - Detalhes adicionais
- **created_at:** TIMESTAMP - Data do evento

---

## Seguranca

### Autenticacao

| Mecanismo | Implementacao | Detalhes |
|-----------|-------------|----------|
| JWT | python-jose + PyJWT | HS256, secret de 32+ chars |
| Passwords | bcrypt | Custo 12, salt auto |
| Tokens | Stateless | Expiracao: 30 dias (inst) / 90 dias (admin) |
| API Keys | Hash SHA-256 | Para futuras integracoes B2B |

### Autorizacao

```python
# Decorador de verificacao de role
@router.post("/{institution_id}")
async def create_institution(
    current_user = Depends(get_current_user),
    ...
):
    verify_role("admin")  # Levanta 403 se nao for admin
    ...
```

### Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/v1/verify` | 100 req | 1 minuto |
| `/api/v1/certify` | 60 req | 1 minuto |
| `/api/v1/certify/bulk` | 10 req | 1 minuto |
| `/api/v1/login` | 5 req | 1 minuto |
| Outros | 120 req | 1 minuto |

### Headers de Seguranca

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### Zero-Knowledge

```
Documento Original (PDF)
         |
         v
+---------------+
| Client-Side   |  <- Hash calculado no navegador (JavaScript)
| SHA-256       |
+-------+-------+
    |  Apenas hash viaja
    v
+---------------+
| Servidor      |  <- Nunca ve o documento original
| Txeka Ntiyiso |
+---------------+
```

---

## Pipeline de Deploy

### Render.com (Producao Atual)

```
Git Push main
    |
    v
+---------------+
| GitHub        |
| Actions       |  <- pytest, bandit, lint
+-------+-------+
    | (se passar)
    v
+---------------+
| Render.com    |
| Web Service   |
|               |
| 1. poetry     |  <- Instala dependencias
|    install    |
| 2. alembic    |  <- Aplica migrations
|    upgrade    |
| 3. uvicorn    |  <- Inicia servidor
|    start      |
+-------+-------+
    |
    v
+---------------+
| PostgreSQL    |  <- Render managed
| (Managed)     |
+---------------+
```

**Log de deploy confirmado (22/07/2026):**
```
==> Build successful
==> Deploying...
==> Setting WEB_CONCURRENCY=1 by default
==> Running 'poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT'
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO:     DATABASE.PY LOADED - connect_args: statement_cache_size=0
INFO:     Rotas registadas: /api/v1
INFO:     Started server process [60]
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
==> Your service is live
==> Available at https://txeka-ntiyiso-api.onrender.com
```

### Docker (Local & On-premise)

```
docker-compose up --build
    |
    v
+---------------+
| Build         |  <- Dockerfile: Python 3.11 + Poetry
| Image         |
+-------+-------+
    |
    v
+---------------+
| Containers    |
|               |
| api-gateway   |  <- Porta 8000, Uvicorn
| postgres      |  <- Porta 5432, PostgreSQL 15
+---------------+
```

---

## Escalabilidade

### Horizontal (Adicionar Instancias)

```
+---------------+     +---------------+     +---------------+
|   Nginx       |---->|  API Instance |---->|  API Instance |
|  (Load Balancer)|   |     #1        |     |     #2        |
+---------------+     +-------+-------+     +-------+-------+
                              |                     |
                              +----------+----------+
                                         |
                                         v
                              +---------------------+
                              |  PostgreSQL         |
                              |  (Primary-Replica)  |
                              +---------------------+
```

**Requisitos para escala horizontal:**
- Stateless API (sem sessoes no servidor)
- JWT para autenticacao (sem estado)
- PostgreSQL com read replicas
- Redis para cache de verificacoes (futuro)

### Vertical (Aumentar Recursos)

| Recurso | Atual | Alvo (Fase 4) |
|---------|-------|---------------|
| CPU | 1 core (Render Free) | 4+ cores |
| RAM | 512 MB | 8+ GB |
| PostgreSQL | Render Free | Render Pro / RDS |
| Storage | 1 GB | 100+ GB (20 anos de logs) |

---

## Metricas e SLA

### Service Level Agreement (SLA)

| Metrica | Valor | Monitoramento |
|---------|-------|---------------|
| **Uptime** | 99.9% | Render dashboard + /health |
| **Latencia (p95)** | < 100 ms | Logs de request |
| **Latencia (p99)** | < 200 ms | Logs de request |
| **Throughput** | 1000 req/s | Render metrics |
| **RTO** | 4 horas | Backup + redeploy |
| **RPO** | 1 hora | Backups incrementais |

### Metricas de Negocio

| Metrica | Fonte | Frequencia |
|---------|-------|------------|
| Documentos emitidos | `/api/v1/stats` | Diaria |
| Verificacoes | `/api/v1/stats` | Diaria |
| Instituicoes ativas | Query SQL | Diaria |
| Creditos consumidos | `/api/v1/stats` | Mensal |
| Taxa de revogacao | Query SQL | Mensal |

### Alertas

| Condicao | Acao |
|----------|------|
| Health check falha 3x | Email + SMS para on-call |
| Erros 5xx > 1% | Escalar para senior dev |
| Latencia p95 > 200ms | Analisar query plan |
| Creditos instituicao < 10 | Notificar admin |
| Tentativas login falhadas > 10/min | Bloquear IP temporariamente |

---

## Roadmap Tecnico

| Fase | Periodo | Mudancas Arquiteturais |
|------|---------|------------------------|
| **Fase 2** | Q2-Q3 2026 | Multi-tenant, creditos, dashboard |
| **Fase 3** | Q3 2026 | Redis cache, queries agregadas, analytics |
| **Fase 4** | Q4 2026 | 2FA (TOTP), OAuth2, ML fraud detection, read replicas |

---

## Contacto

- **Email:** geral.txekantiyiso@gmail.com
- **GitHub:** [github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso](https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso)
- **API Health:** [https://txeka-ntiyiso-api.onrender.com/health](https://txeka-ntiyiso-api.onrender.com/health)

---

Txeka Ntiyiso - Orgulhosamente desenvolvido em Mocambique

Proprietary. All rights reserved. Txeka Ntiyiso, 2026.
