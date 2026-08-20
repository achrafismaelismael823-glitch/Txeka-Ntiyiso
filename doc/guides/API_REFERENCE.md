# API Reference — Txeka Ntiyiso

> **Versão:** 2.0.0  
> **Base URL:** `https://txeka-ntiyiso-api.onrender.com`  
> **Ambiente Local:** `http://localhost:8000`  
> **Documentação Interativa:** `/docs` (Swagger UI) · `/redoc` (ReDoc)  
> **Prefixo da API:** `/api/v1` — aplicado a todas as rotas listadas abaixo.

---

## Índice

- [Autenticação](#autenticação)
- [Emissão de Documentos](#emissão-de-documentos)
- [Verificação](#verificação)
- [Revogação](#revogação)
- [Gestão de Instituições](#gestão-de-instituicoes)
- [Dashboard e Créditos](#dashboard-e-creditos)
- [Auditoria](#auditoria)
- [Schemas](#schemas)
- [Formato de Erros](#formato-de-erros)
- [Rate Limiting](#rate-limiting)
- [Ambientes](#ambientes)
- [Changelog](#changelog)

---

## Autenticação

A API utiliza **JWT (JSON Web Tokens)** — algoritmo HS256 — com autenticação *stateless*.

| Fluxo | Endpoint | Expiração | Âmbito |
|-------|----------|-----------|--------|
| **Admin** | `POST /api/v1/auth/admin/login` | 90 dias | Gestão global do sistema |
| **Instituição** | `POST /api/v1/auth/login` | 30 dias | Emissão, verificação, revogação, dashboard |

> **Header de todas as rotas protegidas:** `Authorization: Bearer <access_token>`
>
> **Roles (RBAC):** `admin`, `institution`, `citizen`, `system`.
> - `verify_role("admin")` — apenas admin.
> - `verify_role("institution")` — instituição **ou** admin.
> - Modo anónimo (`TXEKA_ALLOW_ANONYMOUS=true`): requisições sem token recebem role `citizen` (apenas verificação pública).

---

### POST /api/v1/auth/admin/login

Login do administrador do sistema.

> **Atenção:** os parâmetros são passados como **query string**, não como body JSON.

**Request:**
```
POST /api/v1/auth/admin/login?email=admin@txeka.co.mz&password=s3nh4
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "role": "admin",
  "expires_in_days": 90,
  "message": "Bem-vindo, Administrador Txeka Ntiyiso!"
}
```

**Erros:**
- `401` — Credenciais inválidas
- `500` — `ADMIN_PASSWORD_HASH` não configurado

---

### POST /api/v1/auth/login

Login de instituição registada.

**Request:**
```json
{
  "institution_id": "INAGE",
  "password": "string"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "institution": {
    "id": "INAGE",
    "name": "Instituto Nacional de Gestão de Estabelecimentos",
    "contact_email": "contacto@inage.gov.mz",
    "role": "institution",
    "subscription_plan": "standard",
    "credits": 1000,
    "docs_emitted_month": 45,
    "status": "active",
    "approved": true,
    "created_at": "2026-01-15T10:30:00+02:00",
    "updated_at": "2026-07-20T14:22:00+02:00"
  },
  "expires_in_days": 30,
  "message": "Bem-vindo, Instituto Nacional de Gestão de Estabelecimentos!"
}
```

**Erros:**
- `401` — Credenciais inválidas
- `403` — Conta suspensa ou inativa

---

## Emissão de Documentos

### POST /api/v1/certify

Emite um documento único. Gera hash SHA-256, QR code e regista audit log.

> **Auth:** Bearer (instituição)  
> **Requisitos:** `Content-Type: multipart/form-data`  
> **Restrição:** APENAS ficheiros PDF  
> **Custo:** 1 crédito por documento

**Request:**
```http
POST /api/v1/certify
Authorization: Bearer <institution_token>
Content-Type: multipart/form-data

file: <arquivo.pdf>            # obrigatório
document_type: "DUAT"          # opcional, default "DUAT"
institution_id: "INAGE"        # opcional, default "INAGE"
```

Validação do ficheiro (em ordem): extensão `.pdf` → MIME `application/pdf` → magic bytes `%PDF-` → tamanho ≤ 50MB → nome sem extensões duplas suspeitas.

**Response (200):**
```json
{
  "status": "emitted",
  "doc_id": "DUAT-INAGE-20260820-A1B2C3",
  "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "certificate_url": "https://verify.txekantiyiso.co.mz/DUAT-INAGE-20260820-A1B2C3",
  "timestamp": "2026-08-20T21:30:00+02:00",
  "message": "Documento emitido com sucesso. Creditos restantes: 999"
}
```

**Erros:**
- `400` — Ficheiro ausente ou conteúdo sem assinatura PDF válida
- `401` — Token ausente/inválido
- `402` — Créditos insuficientes
- `403` — Instituição suspensa/inativa ou não aprovada
- `404` — Instituição não encontrada
- `409` — Hash já certificado no sistema (documento duplicado)
- `413` — Ficheiro excede 50MB
- `415` — Extensão/MIME inválido ou nome suspeito (ex: `.pdf.png`)
- `422` — Parâmetros de formulário inválidos

---

### POST /api/v1/certify/bulk

Emite múltiplos documentos em lote (B2B/B2G).

> **Auth:** Bearer (instituição)  
> **Requisitos:** `Content-Type: application/json`  
> **Custo:** 1 crédito por documento

**Request:**
```json
{
  "institution_id": "INAGE",
  "documents": [
    {
      "document_type": "DUAT",
      "file_name": "duat_001.pdf",
      "content": "<conteúdo em base64 ou texto>"
    },
    {
      "document_type": "CERTIDAO",
      "file_name": "certidao_002.pdf",
      "content": "<conteúdo em base64 ou texto>"
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Lote de 2 documentos processado com sucesso.",
  "documents": [
    {
      "doc_id": "DUAT-INAGE-20260820-C1D2E3",
      "certificate_url": "https://verify.txekantiyiso.co.mz/DUAT-INAGE-20260820-C1D2E3",
      "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  ],
  "credits_remaining": 998
}
```

**Erros:**
- `400` — Lista de documentos vazia
- `401` — Token ausente/inválido
- `402` — Créditos insuficientes para o lote completo
- `403` — Instituição suspensa/inativa ou não aprovada
- `404` — Instituição não encontrada
- `409` — Hash já certificado (duplicado no lote)
- `422` — Payload inválido

---

## Verificação

Público — **não requer autenticação**.

### GET /api/v1/verify/{doc_hash}

Verificação pública via URL (QR code, WhatsApp, links diretos).

**Parâmetros:**
| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `doc_hash` | string (path) | ✅ | Hash SHA-256 de **exatamente 64 caracteres** |

**Response (200) — Documento Válido:**
```json
{
  "status": "VALID",
  "dados_publicos": {
    "doc_id": "DUAT-INAGE-20260820-A1B2C3",
    "document_type": "DUAT",
    "institution_id": "INAGE",
    "created_at": "2026-08-20T21:30:00+02:00",
    "revoked": false,
    "revoked_at": null,
    "revoked_reason": null
  }
}
```

**Response (200) — Documento Revogado:**
```json
{
  "status": "REVOKED",
  "dados_publicos": {
    "doc_id": "DUAT-INAGE-20260820-A1B2C3",
    "document_type": "DUAT",
    "institution_id": "INAGE",
    "created_at": "2026-08-20T21:30:00+02:00",
    "revoked": true,
    "revoked_at": "2026-08-21T09:15:00+02:00",
    "revoked_reason": "Erro administrativo na emissão"
  }
}
```

**Response (200) — Documento Não Encontrado:**
```json
{
  "status": "INVALID",
  "dados_publicos": null
}
```

> **Valores possíveis de `status`:** `VALID` · `REVOKED` · `INVALID`

**Erros:**
- `400` — Hash não tem 64 caracteres
- `422` — Hash mal formatado (não hexadecimal)

---

### POST /api/v1/verify

Verificação B2B/B2G via JSON. Mesma lógica do GET, com payload estruturado.

**Request:**
```json
{
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**Response:** idêntico ao `GET /api/v1/verify/{doc_hash}`.

**Erros:**
- `422` — Hash inválido ou ausente (Pydantic exige 64 caracteres)

---

## Revogação

### POST /api/v1/emissions/{doc_id}/revoke

Revoga (invalida) um documento emitido. Ação **irreversível**.

> **Auth:** Bearer — Admin ou a própria Instituição emissora (RBAC por `institution_id`).

**Parâmetros:**
| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `doc_id` | string (path) | ✅ | ID do documento emitido (ex: `DUAT-INAGE-20260820-A1B2C3`) |

**Request:**
```json
{
  "reason": "Erro administrativo na emissão — DUAT emitido para terreno errado"
}
```

**Response (200):**
```json
{
  "status": "revoked",
  "doc_id": "DUAT-INAGE-20260820-A1B2C3",
  "revoked_at": "2026-08-21T09:15:00+02:00",
  "message": "Documento revogado com sucesso. Motivo: Erro administrativo na emissão — DUAT emitido para terreno errado"
}
```

**Response (200) — Já revogado:**
```json
{
  "status": "already_revoked",
  "doc_id": "DUAT-INAGE-20260820-A1B2C3",
  "message": "Documento ja se encontra revogado. Motivo: ..."
}
```

**Erros:**
- `401` — Token ausente/inválido
- `403` — Sem permissão (não é admin nem instituição emissora)
- `404` — Documento não encontrado
- `422` — `reason` ausente ou com mais de 255 caracteres

---

## Gestão de Instituições

> **Auth:** endpoints marcados como **Admin** exigem `verify_role("admin")`. Os de **Instituição** exigem token de instituição (ou admin).

### POST /api/v1/institutions

Cria uma nova instituição no sistema.

> **Auth:** Admin

**Request:**
```json
{
  "id": "INSS",
  "name": "Instituto Nacional de Segurança Social",
  "contact_email": "contacto@inss.gov.mz",
  "credits": 500,
  "subscription_plan": "standard"
}
```

> O `id` é convertido automaticamente para **MAIÚSCULAS**.

**Response (200):**
```json
{
  "success": true,
  "institution": {
    "id": "INSS",
    "name": "Instituto Nacional de Segurança Social",
    "contact_email": "contacto@inss.gov.mz",
    "credits": 500,
    "status": "pending"
  },
  "api_key": "txk_live_7f8a9b2c3d4e5f6a7b8c9d0e",
  "temp_password": "TempPass123!",
  "message": "Instituição criada. Aguarda aprovação do admin."
}
```

> **Atenção:** `api_key` e `temp_password` são mostrados **apenas uma vez**.

**Erros:**
- `400` — Dados inválidos ou ID já existe (`ValueError`)
- `401` — Token inválido
- `403` — Sem permissão de admin
- `422` — Validação Pydantic (email inválido, campos fora do tamanho mínimo, `credits < 0`)
- `500` — Erro interno

---

### GET /api/v1/institutions

Lista instituições com paginação e filtro de status.

> **Auth:** Admin

**Parâmetros de Query:**
| Nome | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `skip` | int | 0 | Offset |
| `limit` | int | 100 | Limite (1–500) |
| `status` | string | – | `pending` \| `active` \| `suspended` \| `inactive` |

**Response (200):**
```json
{
  "total": 8,
  "institutions": [
    {
      "id": "INAGE",
      "name": "Instituto Nacional de Gestão de Estabelecimentos",
      "contact_email": "contacto@inage.gov.mz",
      "role": "institution",
      "subscription_plan": "standard",
      "credits": 1000,
      "docs_emitted_month": 45,
      "status": "active",
      "approved": true,
      "created_at": "2026-01-15T10:30:00+02:00",
      "updated_at": "2026-07-20T14:22:00+02:00"
    }
  ]
}
```

**Erros:** `401` · `403` · `422` (status inválido)

---

### GET /api/v1/institutions/{institution_id}

Obtém detalhes de uma instituição específica.

> **Auth:** Admin

**Response (200):** `InstitutionResponse` (mesmo formato da listagem).

**Erros:**
- `401` · `403`
- `404` — Instituição não encontrada

---

### PATCH /api/v1/institutions/{institution_id}

Atualiza dados de uma instituição. Todos os campos são opcionais.

> **Auth:** Admin

**Request:**
```json
{
  "name": "INAGE — Instituto Nacional de Gestão de Estabelecimentos",
  "contact_email": "novo@inage.gov.mz",
  "status": "active",
  "subscription_plan": "premium",
  "approved": true
}
```

**Response (200):** `InstitutionResponse` atualizado.

**Erros:**
- `400` — Status fora de `pending|active|suspended|inactive`
- `401` · `403`
- `404` — Instituição não encontrada
- `422` — `status` não casa com o padrão permitido

---

### POST /api/v1/institutions/{institution_id}/credits

Adiciona créditos à instituição (gestão de pagamentos).

> **Auth:** Admin

**Request:**
```json
{
  "amount": 1000,
  "type": "manual_add",
  "description": "Pagamento referente ao pacote Q3 2026",
  "payment_method": "bank_transfer",
  "payment_reference": "TRX-2026-07-001",
  "notes": "Transferência bancária confirmada"
}
```

**Response (200):**
```json
{
  "credits": 2000,
  "status": "active",
  "docs_emitted_month": 45
}
```

**Erros:**
- `401` · `403`
- `404` — Instituição não encontrada
- `422` — `amount` ≤ 0, `type`/`payment_method` fora do padrão

---

### GET /api/v1/institutions/{institution_id}/credit-history

Histórico de transações de créditos de uma instituição.

> **Auth:** Admin

**Parâmetros de Query:**
| Nome | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `skip` | int | 0 | Offset |
| `limit` | int | 50 | Limite (1–100) |

**Response (200):**
```json
[
  {
    "id": 1,
    "institution_id": "INAGE",
    "amount": 1000,
    "type": "manual_add",
    "description": "Pacote inicial",
    "payment_method": "bank_transfer",
    "payment_reference": "TRX-2026-01-001",
    "notes": "Setup inicial",
    "created_by": "admin@txeka.co.mz",
    "created_at": "2026-01-15T10:30:00+02:00"
  }
]
```

**Erros:** `401` · `403` · `404` (instituição não encontrada)

---

### POST /api/v1/institutions/{institution_id}/reset-password

Reseta a password de uma instituição e gera uma nova temporária.

> **Auth:** Admin

**Response (200):**
```json
{
  "success": true,
  "institution_id": "INAGE",
  "temp_password": "TempPass123!",
  "message": "Password resetada. Guarde esta senha temporária — não será mostrada novamente."
}
```

**Erros:** `401` · `403` · `404` (instituição não encontrada)

---

### POST /api/v1/institutions/{institution_id}/regenerate-api-key

Regenera a API key de uma instituição. A key anterior é invalidada imediatamente.

> **Auth:** Admin  
> **Atenção:** todas as integrações que usem a key antiga falharão.

**Response (200):**
```json
{
  "success": true,
  "api_key": "txk_live_7f8a9b2c3d4e5f6a7b8c9d0e",
  "message": "Guarde esta chave — não será mostrada novamente!"
}
```

**Erros:** `401` · `403` · `404` (instituição não encontrada)

---

## Dashboard e Créditos

> **Auth:** token de Instituição ou Admin (`verify_token`)

### GET /api/v1/institutions/me/dashboard

Dashboard completo da instituição autenticada.

**Response (200):**
```json
{
  "institution": {
    "id": "INAGE",
    "name": "Instituto Nacional de Gestão de Estabelecimentos",
    "contact_email": "contacto@inage.gov.mz",
    "role": "institution",
    "subscription_plan": "standard",
    "credits": 998,
    "docs_emitted_month": 47,
    "status": "active",
    "approved": true,
    "created_at": "2026-01-15T10:30:00+02:00",
    "updated_at": "2026-07-22T14:24:00+02:00"
  },
  "credits_history": [
    {
      "id": 1,
      "institution_id": "INAGE",
      "amount": 1000,
      "type": "manual_add",
      "description": "Pacote inicial",
      "payment_method": "bank_transfer",
      "payment_reference": "TRX-2026-01-001",
      "notes": "Setup inicial",
      "created_by": "admin@txeka.co.mz",
      "created_at": "2026-01-15T10:30:00+02:00"
    }
  ],
  "total_emitted": 47,
  "total_verifications": 0
}
```

> `credits_history` retorna os últimos **20** registos. `total_emitted` é o valor de `docs_emitted_month`. `total_verifications` está fixo em `0`.

**Erros:**
- `400` — Sem instituição associada ao token
- `403` — Role não permitida, ou instituição tentando aceder dados de outra
- `404` — Instituição não encontrada

---

### GET /api/v1/institutions/me/credits

Status rápido de créditos da instituição autenticada.

**Response (200):**
```json
{
  "credits": 998,
  "status": "active",
  "docs_emitted_month": 47
}
```

**Erros:** `400` (sem instituição associada) · `403` (role não permitida) · `404` (não encontrada)

---

### GET /api/v1/institutions/me/credit-history

Histórico de transações de créditos da **instituição autenticada**.

> **Auth:** token de Instituição (admin usa `/institutions/{institution_id}/credit-history`)

**Parâmetros de Query:**
| Nome | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `skip` | int | 0 | Offset |
| `limit` | int | 50 | Limite (1–100) |

**Response (200):** `[CreditTransactionResponse]` — mesmo formato de `/institutions/{institution_id}/credit-history`.

**Erros:** `400` (sem instituição associada) · `403` (não é instituição)

---

## Auditoria

> **Auth:** **Admin** em todos os endpoints (`verify_role("admin")`).  
> Todos os timestamps são devolvidos em **CAT (UTC+2)**.

### GET /api/v1/audit/logs

Consulta logs de auditoria com filtros e paginação.

**Parâmetros de Query (todos opcionais):**
| Nome | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `action` | string | – | `EMIT` \| `VERIFY` \| `REVOKE` \| `LOGIN` \| `EXPORT` |
| `resource_type` | string | – | `DOCUMENT` \| `CERTIFICATE` \| `INSTITUTION` |
| `user_email` | string | – | Email do utilizador |
| `institution_id` | string | – | ID da instituição |
| `start_date` | string | – | Data início (ISO 8601), ex: `2026-01-01T00:00:00` |
| `end_date` | string | – | Data fim (ISO 8601), ex: `2026-12-31T23:59:59` |
| `limit` | int | 100 | Limite (1–1000) |
| `offset` | int | 0 | Offset para paginação |

**Response (200):**
```json
{
  "success": true,
  "count": 1,
  "limit": 100,
  "offset": 0,
  "timezone": "CAT (UTC+2)",
  "logs": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "user_email": "contacto@inage.gov.mz",
      "action": "EMIT",
      "resource_type": "DOCUMENT",
      "resource_id": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "institution_id": "INAGE",
      "ip_address": "197.218.10.20",
      "request_path": "/api/v1/certify",
      "request_method": "POST",
      "status_code": 200,
      "success": true,
      "details": "{\"document_type\": \"DUAT\", \"file_name\": \"duat.pdf\", \"file_size\": 245760, \"doc_id\": \"DUAT-INAGE-20260820-A1B2C3\"}",
      "timestamp": "2026-08-20T21:30:00+02:00",
      "created_at": "2026-08-20T21:30:00+02:00"
    }
  ]
}
```

**Erros:** `401` (autenticação obrigatória) · `403` (requer admin) · `422` (limit/offset fora do intervalo)

---

### GET /api/v1/audit/document/{doc_hash}/history

Histórico completo de auditoria de um documento específico.

**Response (200):**
```json
{
  "success": true,
  "doc_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "total_actions": 2,
  "timezone": "CAT (UTC+2)",
  "history": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "user_email": "contacto@inage.gov.mz",
      "action": "EMIT",
      "resource_type": "DOCUMENT",
      "resource_id": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "institution_id": "INAGE",
      "ip_address": "197.218.10.20",
      "request_path": "/api/v1/certify",
      "request_method": "POST",
      "status_code": 200,
      "success": true,
      "details": null,
      "timestamp": "2026-08-20T21:30:00+02:00",
      "created_at": "2026-08-20T21:30:00+02:00"
    }
  ]
}
```

**Erros:** `401` · `403`

---

### GET /api/v1/audit/stats

Estatísticas agregadas para dashboards administrativos.

**Parâmetros de Query (opcionais):**
| Nome | Tipo | Descrição |
|------|------|-----------|
| `institution_id` | string | Filtrar por instituição |
| `start_date` | string | Data início (ISO 8601) |
| `end_date` | string | Data fim (ISO 8601) |

**Response (200):**
```json
{
  "success": true,
  "period": {
    "start": "2026-01-01T00:00:00",
    "end": "2026-07-22T23:59:59"
  },
  "institution_id": null,
  "timezone": "CAT (UTC+2)",
  "stats": {
    "summary": {
      "total_logs": 10547,
      "recent_logs_7d": 312,
      "total_emitted_documents": 1523,
      "total_revoked_documents": 12,
      "active_documents": 1511,
      "total_verifications": 8942,
      "verification_success_rate": 98.45
    },
    "actions_by_type": {
      "EMIT": 1523,
      "VERIFY": 8942,
      "REVOKE": 12,
      "LOGIN": 210
    },
    "verifications": {
      "success": 8802,
      "failed": 140,
      "success_rate_percent": 98.43
    },
    "verifications_by_day": [
      { "date": "2026-07-22", "count": 412 }
    ],
    "top_institutions": [
      { "institution_id": "INAGE", "count": 5210 }
    ],
    "period": {
      "start": "2026-01-01T00:00:00",
      "end": "2026-07-22T23:59:59",
      "last_30_days": 30
    }
  }
}
```

**Erros:** `401` · `403`

---

## Schemas

### DadosPublicos
```json
{
  "doc_id": "string",
  "document_type": "string",
  "institution_id": "string",
  "created_at": "2026-08-20T21:30:00+02:00",
  "revoked": false,
  "revoked_at": null,
  "revoked_reason": null
}
```

### VerifyRequest / VerifyResponse
```json
{
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```
```json
{
  "status": "VALID | REVOKED | INVALID",
  "dados_publicos": { "DadosPublicos ou null" }
}
```

### EmitResponse
```json
{
  "status": "emitted",
  "doc_id": "string",
  "hash_sha256": "string (64 hex)",
  "qr_code": "data:image/png;base64,...",
  "certificate_url": "string",
  "timestamp": "ISO 8601 (CAT)",
  "message": "string"
}
```

### BulkEmissionInput / BulkDocumentItem
```json
{
  "institution_id": "INAGE",
  "documents": [
    {
      "document_type": "DUAT",
      "file_name": "doc.pdf",
      "content": "<base64 ou texto>"
    }
  ]
}
```

### RevokeRequest
```json
{
  "reason": "string (máx 255 caracteres)"
}
```

### InstitutionCreate
```json
{
  "id": "INAGE",
  "name": "Instituto Nacional de Gestão de Estabelecimentos",
  "contact_email": "contacto@inage.gov.mz",
  "credits": 0,
  "subscription_plan": "standard"
}
```

### InstitutionUpdate
```json
{
  "name": "string (opcional)",
  "contact_email": "email@exemplo.mz (opcional)",
  "status": "pending | active | suspended | inactive (opcional)",
  "subscription_plan": "string (opcional)",
  "approved": true
}
```

### InstitutionResponse
```json
{
  "id": "INAGE",
  "name": "Instituto Nacional de Gestão de Estabelecimentos",
  "contact_email": "contacto@inage.gov.mz",
  "role": "institution",
  "subscription_plan": "standard",
  "credits": 1000,
  "docs_emitted_month": 45,
  "status": "active",
  "approved": true,
  "created_at": "2026-01-15T10:30:00+02:00",
  "updated_at": "2026-07-22T14:24:00+02:00"
}
```

### CreditTransactionCreate
```json
{
  "amount": 1000,
  "type": "manual_add | bonus | refund",
  "description": "string (opcional)",
  "payment_method": "bank_transfer | cash | mpesa | bonus | none (opcional)",
  "payment_reference": "string (opcional)",
  "notes": "string (opcional)"
}
```

### CreditTransactionResponse
```json
{
  "id": 1,
  "institution_id": "INAGE",
  "amount": 1000,
  "type": "manual_add",
  "description": "string | null",
  "payment_method": "string | null",
  "payment_reference": "string | null",
  "notes": "string | null",
  "created_by": "string | null",
  "created_at": "2026-01-15T10:30:00+02:00"
}
```

### InstitutionLoginRequest
```json
{
  "institution_id": "INAGE",
  "password": "string"
}
```

---

## Formato de Erros

### Erros customizados da plataforma (`TxekaNtiyisoException`)
```json
{
  "success": false,
  "error_type": "InsufficientCreditsError",
  "message": "Instituição 'INAGE' sem créditos.",
  "path": "/api/v1/certify"
}
```

`error_type` pode ser: `TxekaNtiyisoException`, `InsufficientCreditsError` (402), `DocumentNotFoundError` (404), `InvalidDocumentContentError` (400), `RevocationError` (403).

### Erros FastAPI (validação Pydantic)
```json
{
  "detail": [
    {
      "loc": ["body", "hash"],
      "msg": "String should have at least 64 characters",
      "type": "string_too_short"
    }
  ]
}
```

### Erros HTTP padrão
```json
{ "detail": "Token inválido ou expirado" }
```

### Rate limit (slowapi)
```json
{
  "detail": "Rate limit exceeded: ...",
  "error_type": "rate_limit"
}
```

### Códigos de erro

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| `400` | Bad Request | Payload inválido, ficheiro não-PDF, hash mal formatado |
| `401` | Unauthorized | Token ausente, inválido ou expirado |
| `402` | Payment Required | Créditos insuficientes para operação |
| `403` | Forbidden | Sem permissão, instituição suspensa/não aprovada |
| `404` | Not Found | Recurso não existe (documento, instituição) |
| `409` | Conflict | Hash já certificado (documento duplicado) |
| `413` | Payload Too Large | Ficheiro excede 50MB |
| `415` | Unsupported Media Type | Extensão/MIME não é PDF |
| `422` | Unprocessable Entity | Falha na validação Pydantic |
| `429` | Too Many Requests | Rate limit excedido (slowapi) |
| `500` | Internal Server Error | Erro inesperado no servidor |

---

## Rate Limiting

O `slowapi` está inicializado na aplicação (`main.py`) com um handler global para `RateLimitExceeded`, mas **não existem decoradores `@limiter.limit(...)` aplicados a nenhuma rota** — ou seja, **não há limites por endpoint efetivamente ativos** neste momento.

Se forem adicionados no futuro, a resposta será `429` no formato slowapi (ver [Formato de Erros](#formato-de-erros)).

---

## Ambientes

| Ambiente | Base URL | Autenticação |
|----------|----------|--------------|
| **Produção** | `https://txeka-ntiyiso-api.onrender.com` | JWT obrigatório |
| **Local** | `http://localhost:8000` | JWT (token anónimo opcional via `TXEKA_ALLOW_ANONYMOUS=true`) |

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 2.0.0 | 2026-07-22 | Fase 2: gestão de instituições, créditos, dashboard, bulk emission |
| 1.0.0 | 2026-04-15 | Fase 1: MVP core — emissão, verificação, revogação, audit logs |

---

> **Documentação gerada a partir do código-fonte real** (`api-gateway/src`).  
> Para reportar inconsistências: [GitHub Issues](https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues)
