# API Reference — Txeka Ntiyiso

> **Versão:** 2.0.0  
> **Base URL:** `https://txeka-ntiyiso-api.onrender.com`  
> **Ambiente Local:** `http://localhost:8000`  
> **Documentação Interativa:** `/docs` (Swagger UI) · `/redoc` (ReDoc)

---

## Índice

- [Autenticação](#autenticação)
- [Emissão de Documentos](#emissão-de-documentos)
- [Verificação](#verificação)
- [Gestão de Instituições](#gestão-de-instituicoes)
- [Dashboard e Créditos](#dashboard-e-creditos)
- [Auditoria](#auditoria)
- [Revogação](#revogação)
- [Schemas](#schemas)
- [Códigos de Erro](#códigos-de-erro)

---

## Autenticação

A API utiliza **JWT (JSON Web Tokens)** para autenticação stateless. Dois fluxos de login coexistem:

| Fluxo | Endpoint | Token | Expiração | Âmbito |
|-------|----------|-------|-----------|--------|
| **Admin** | `POST /api/v1/auth/admin/login` | Bearer | 90 dias | Gestão global do sistema |
| **Instituição** | `POST /api/v1/auth/login` | Bearer | 30 dias | Emissão, verificação, dashboard |

> **Header:** `Authorization: Bearer <token>`

### POST /api/v1/auth/admin/login

Login do administrador do sistema.

**Request:**
```json
{
  "email": "admin@txeka.co.mz",
  "password": "string"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "role": "admin",
  "message": "Login bem-sucedido"
}
```

**Erros:**
- `401 Unauthorized` — Credenciais inválidas
- `429 Too Many Requests` — Rate limit excedido

---

### POST /api/v1/auth/login

Login de instituição registrada.

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
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-07-20T14:22:00Z"
  },
  "message": "Login bem-sucedido"
}
```

**Erros:**
- `401 Unauthorized` — Credenciais inválidas ou instituição não aprovada
- `403 Forbidden` — Instituição suspensa ou inativa
- `429 Too Many Requests` — Rate limit excedido

---

## Emissão de Documentos

### POST /api/v1/certify

Emite um documento único (PDF). Gera hash SHA-256, QR code e regista audit log.

> **Requisitos:** Content-Type `multipart/form-data`  
> **Restrição:** APENAS ficheiros PDF  
> **Custo:** 1 crédito por documento

**Request:**
```http
POST /api/v1/certify
Authorization: Bearer <institution_token>
Content-Type: multipart/form-data

file: <arquivo.pdf>
document_type: "DUAT"          # Tipo do documento (ex: DUAT, CERTIDAO, ALVARA)
institution_id: "INAGE"         # ID da instituição emissora
```

**Response (201):**
```json
{
  "doc_id": "DOC-7f8a9b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
  "doc_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "document_type": "DUAT",
  "institution_id": "INAGE",
  "certificate_url": "https://txeka-ntiyiso-api.onrender.com/api/v1/verify/e3b0c44298fc...",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "file_name": "duat_2026_001.pdf",
  "file_size": 245760,
  "issued_by": "INAGE",
  "created_at": "2026-07-22T14:24:00Z",
  "message": "Documento emitido com sucesso"
}
```

**Erros:**
- `400 Bad Request` — Ficheiro não é PDF ou excede tamanho máximo
- `401 Unauthorized` — Token inválido ou expirado
- `402 Payment Required` — Créditos insuficientes
- `403 Forbidden` — Instituição não aprovada
- `409 Conflict` — Hash já existe (documento duplicado)
- `429 Too Many Requests` — Rate limit excedido

---

### POST /api/v1/certify/bulk

Emite múltiplos documentos em lote (até 100 por requisição).

> **Requisitos:** Content-Type `application/json`  
> **Custo:** 1 crédito por documento

**Request:**
```json
{
  "documents": [
    {
      "doc_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "document_type": "DUAT",
      "file_name": "duat_001.pdf",
      "file_size": 245760
    },
    {
      "doc_hash": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      "document_type": "CERTIDAO",
      "file_name": "certidao_002.pdf",
      "file_size": 180224
    }
  ]
}
```

**Response (201):**
```json
{
  "total_requested": 2,
  "successful": 2,
  "failed": 0,
  "credits_consumed": 2,
  "credits_remaining": 998,
  "documents": [
    {
      "doc_id": "DOC-7f8a9b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
      "doc_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "status": "success",
      "qr_code": "data:image/png;base64,..."
    }
  ],
  "message": "2 documentos emitidos com sucesso"
}
```

**Erros:**
- `400 Bad Request` — Payload inválido ou documentos mal formatados
- `401 Unauthorized` — Token inválido
- `402 Payment Required` — Créditos insuficientes para o lote completo
- `403 Forbidden` — Instituição não aprovada
- `429 Too Many Requests` — Rate limit excedido

---

## Verificação

### GET /api/v1/verify/{doc_hash}

Verificação pública via URL. Acessível sem autenticação — ideal para QR codes, WhatsApp e links diretos.

**Parâmetros:**
| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `doc_hash` | string (path) | ✅ | Hash SHA-256 de 64 caracteres |

**Response (200) — Documento Válido:**
```json
{
  "status": "valid",
  "dados_publicos": {
    "doc_id": "DOC-7f8a9b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
    "document_type": "DUAT",
    "institution_id": "INAGE",
    "created_at": "2026-07-22T14:24:00Z",
    "revoked": false,
    "revoked_at": null,
    "revoked_reason": null
  }
}
```

**Response (200) — Documento Revogado:**
```json
{
  "status": "revoked",
  "dados_publicos": {
    "doc_id": "DOC-7f8a9b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
    "document_type": "DUAT",
    "institution_id": "INAGE",
    "created_at": "2026-07-22T14:24:00Z",
    "revoked": true,
    "revoked_at": "2026-07-23T09:15:00Z",
    "revoked_reason": "Erro administrativo na emissão"
  }
}
```

**Response (200) — Documento Não Encontrado:**
```json
{
  "status": "not_found",
  "dados_publicos": null
}
```

**Erros:**
- `400 Bad Request` — Hash mal formatado (não tem 64 caracteres hexadecimais)
- `429 Too Many Requests` — Rate limit excedido

---

### POST /api/v1/verify

Verificação B2B/B2G via JSON. Mesma lógica do GET, mas com payload estruturado para integrações programáticas.

**Request:**
```json
{
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**Response:** Idêntico ao GET /api/v1/verify/{doc_hash}

**Erros:**
- `400 Bad Request` — Hash inválido ou ausente
- `429 Too Many Requests` — Rate limit excedido

---

## Gestão de Instituições

> **Acesso:** Endpoints abaixo requerem token de **Admin** (`verify_role("admin")`)

### POST /api/v1/institutions

Cria uma nova instituição no sistema.

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

**Response (201):**
```json
{
  "id": "INSS",
  "name": "Instituto Nacional de Segurança Social",
  "contact_email": "contacto@inss.gov.mz",
  "role": "institution",
  "subscription_plan": "standard",
  "credits": 500,
  "docs_emitted_month": 0,
  "status": "pending",
  "approved": false,
  "created_at": "2026-07-22T14:24:00Z",
  "updated_at": "2026-07-22T14:24:00Z",
  "message": "Instituição criada com sucesso. Aguarda aprovação do admin."
}
```

**Erros:**
- `400 Bad Request` — Dados inválidos ou ID já existe
- `401 Unauthorized` — Token inválido
- `403 Forbidden` — Sem permissão de admin
- `409 Conflict` — ID da instituição já existe

---

### GET /api/v1/institutions/{institution_id}

Obtém detalhes de uma instituição específica.

**Response (200):**
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
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-07-20T14:22:00Z"
}
```

**Erros:**
- `401 Unauthorized` — Token inválido
- `403 Forbidden` — Sem permissão
- `404 Not Found` — Instituição não existe

---

### PATCH /api/v1/institutions/{institution_id}

Atualiza dados de uma instituição.

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

**Response (200):**
```json
{
  "id": "INAGE",
  "name": "INAGE — Instituto Nacional de Gestão de Estabelecimentos",
  "contact_email": "novo@inage.gov.mz",
  "role": "institution",
  "subscription_plan": "premium",
  "credits": 1000,
  "docs_emitted_month": 45,
  "status": "active",
  "approved": true,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-07-22T14:30:00Z",
  "message": "Instituição atualizada com sucesso"
}
```

**Erros:**
- `400 Bad Request` — Dados inválidos
- `401 Unauthorized` — Token inválido
- `403 Forbidden` — Sem permissão
- `404 Not Found` — Instituição não existe

---

### POST /api/v1/institutions/{institution_id}/credits

Adiciona créditos à instituição (gestão de pagamentos).

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
  "docs_emitted_month": 45,
  "message": "1000 créditos adicionados com sucesso"
}
```

**Erros:**
- `400 Bad Request` — Quantidade inválida
- `401 Unauthorized` — Token inválido
- `403 Forbidden` — Sem permissão de admin
- `404 Not Found` — Instituição não existe

---

### GET /api/v1/institutions/{institution_id}/credit-history

Histórico de transações de créditos de uma instituição.

**Parâmetros de Query:**
| Nome | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `skip` | int | 0 | Offset para paginação |
| `limit` | int | 50 | Limite de resultados (1–100) |

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
    "created_at": "2026-01-15T10:30:00Z"
  }
]
```

---

### POST /api/v1/institutions/{institution_id}/reset-password

Reset da password de uma instituição. Gera nova password temporária.

**Response (200):**
```json
{
  "message": "Password resetada com sucesso",
  "temporary_password": "TempPass123!",
  "institution_id": "INAGE"
}
```

> **Atenção:** A instituição deve alterar a password no primeiro login.

**Erros:**
- `401 Unauthorized` — Token inválido
- `403 Forbidden` — Sem permissão
- `404 Not Found` — Instituição não existe

---

### POST /api/v1/institutions/{institution_id}/regenerate-api-key

Regenera a API key de uma instituição. A key anterior é invalidada imediatamente.

**Response (200):**
```json
{
  "message": "API key regenerada com sucesso",
  "api_key": "txk_live_7f8a9b2c3d4e5f6a7b8c9d0e",
  "institution_id": "INAGE"
}
```

> **Atenção:** Todas as integrações usando a key antiga irão falhar. Notifique a instituição antes de regenerar.

---

## Dashboard e Créditos

> **Acesso:** Endpoints abaixo requerem token de **Instituição**

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
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-07-22T14:24:00Z"
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
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "total_emitted": 1523,
  "total_verifications": 8942
}
```

---

### GET /api/v1/institutions/me/credits

Status rápido de créditos da instituição.

**Response (200):**
```json
{
  "credits": 998,
  "status": "active",
  "docs_emitted_month": 47
}
```

---

### GET /api/v1/institutions/me/credit-history

Histórico de transações de créditos da instituição autenticada.

**Parâmetros de Query:**
| Nome | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `skip` | int | 0 | Offset para paginação |
| `limit` | int | 50 | Limite de resultados (1–100) |

**Response:** Idêntico ao `GET /api/v1/institutions/{institution_id}/credit-history`, mas filtrado para a instituição autenticada.

---

## Auditoria

> **Acesso:** Endpoints abaixo requerem token de **Admin**

### GET /api/v1/logs

Consulta logs de auditoria com filtros avançados.

**Parâmetros de Query:**
| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `action` | string | ❌ | Filtrar por ação: `EMIT`, `VERIFY`, `REVOKE`, `LOGIN`, `BULK_EMIT` |
| `institution_id` | string | ❌ | Filtrar por instituição |
| `start_date` | datetime | ❌ | Data inicial (ISO 8601) |
| `end_date` | datetime | ❌ | Data final (ISO 8601) |
| `skip` | int | ❌ | Offset (padrão: 0) |
| `limit` | int | ❌ | Limite (padrão: 100, máx: 500) |

**Response (200):**
```json
{
  "total": 10547,
  "logs": [
    {
      "id": 1,
      "action": "EMIT",
      "institution_id": "INAGE",
      "doc_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "ip_address": "197.218.XX.XX",
      "user_agent": "Mozilla/5.0...",
      "details": "Documento emitido com sucesso",
      "created_at": "2026-07-22T14:24:00Z"
    }
  ]
}
```

---

### GET /api/v1/document/{doc_hash}/history

Histórico completo de auditoria de um documento específico.

**Response (200):**
```json
[
  {
    "id": 1,
    "action": "EMIT",
    "institution_id": "INAGE",
    "doc_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "ip_address": "197.218.XX.XX",
    "user_agent": "Mozilla/5.0...",
    "details": "Documento emitido com sucesso",
    "created_at": "2026-07-22T14:24:00Z"
  },
  {
    "id": 45,
    "action": "VERIFY",
    "institution_id": null,
    "doc_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "ip_address": "197.218.XX.XX",
    "user_agent": "Mozilla/5.0 (Linux; Android 14)...",
    "details": "Verificação pública via QR code",
    "created_at": "2026-07-22T15:30:00Z"
  }
]
```

---

### GET /api/v1/stats

Estatísticas agregadas para dashboards administrativos.

**Parâmetros de Query:**
| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `institution_id` | string | ❌ | Filtrar por instituição |
| `start_date` | datetime | ❌ | Data inicial |
| `end_date` | datetime | ❌ | Data final |

**Response (200):**
```json
{
  "total_emissions": 1523,
  "total_verifications": 8942,
  "total_revocations": 12,
  "active_institutions": 8,
  "pending_institutions": 3,
  "total_credits_consumed": 1535,
  "period": {
    "start_date": "2026-01-01T00:00:00Z",
    "end_date": "2026-07-22T23:59:59Z"
  }
}
```

---

## Revogação

### POST /api/v1/emissions/{doc_id}/revoke

Revoga (invalida) um documento emitido. Ação irreversível.

> **Acesso:** Admin ou a própria Instituição emissora  
> **Nota:** A revogação é permanente. O documento continua consultável, mas com status `revoked`.

**Request:**
```json
{
  "reason": "Erro administrativo na emissão — DUAT emitido para terreno errado"
}
```

**Response (200):**
```json
{
  "doc_id": "DOC-7f8a9b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
  "doc_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "revoked": true,
  "revoked_at": "2026-07-23T09:15:00Z",
  "revoked_reason": "Erro administrativo na emissão — DUAT emitido para terreno errado",
  "revoked_by": "admin@txeka.co.mz",
  "message": "Documento revogado com sucesso"
}
```

**Erros:**
- `400 Bad Request` — Motivo de revogação ausente
- `401 Unauthorized` — Token inválido
- `403 Forbidden` — Sem permissão (não é admin nem emissora)
- `404 Not Found` — Documento não existe
- `409 Conflict` — Documento já revogado

---

## Schemas

### DadosPublicos
```json
{
  "doc_id": "string",
  "document_type": "string",
  "institution_id": "string",
  "created_at": "2026-07-22T14:24:00Z",
  "revoked": false,
  "revoked_at": null,
  "revoked_reason": null
}
```

### VerifyRequest
```json
{
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

### VerifyResponse
```json
{
  "status": "valid | revoked | not_found",
  "dados_publicos": { /* DadosPublicos */ }
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
  "approved": true | false (opcional)
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
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-07-22T14:24:00Z"
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

### InstitutionDashboard
```json
{
  "institution": { /* InstitutionResponse */ },
  "credits_history": [ /* CreditTransactionResponse[] */ ],
  "total_emitted": 1523,
  "total_verifications": 8942
}
```

---

## Códigos de Erro

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| `400` | Bad Request | Payload inválido, hash mal formatado, ficheiro não-PDF |
| `401` | Unauthorized | Token ausente, inválido ou expirado |
| `402` | Payment Required | Créditos insuficientes para operação |
| `403` | Forbidden | Sem permissão (ex: institution tentando acesso admin) |
| `404` | Not Found | Recurso não existe (documento, instituição) |
| `409` | Conflict | Recurso já existe (hash duplicado, ID duplicado) ou já revogado |
| `422` | Unprocessable Entity | Dados não passaram na validação Pydantic |
| `429` | Too Many Requests | Rate limit excedido (slowapi) |
| `500` | Internal Server Error | Erro inesperado no servidor |

---

## Rate Limiting

A API implementa rate limiting via **slowapi**:

| Endpoint | Limite |
|----------|--------|
| `/api/v1/verify` (GET/POST) | 100 requisições / minuto |
| `/api/v1/certify` | 60 requisições / minuto |
| `/api/v1/certify/bulk` | 10 requisições / minuto |
| `/api/v1/login`, `/api/v1/admin/login` | 5 tentativas / minuto |
| Outros endpoints | 120 requisições / minuto |

> **Header de resposta:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

---

## Ambientes

| Ambiente | Base URL | Autenticação |
|----------|----------|--------------|
| **Produção** | `https://txeka-ntiyiso-api.onrender.com` | JWT obrigatório |
| **Local** | `http://localhost:8000` | JWT opcional (dev mode) |

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 2.0.0 | 2026-07-22 | Fase 2: Gestão de instituições, créditos, dashboard, bulk emission |
| 1.0.0 | 2026-04-15 | Fase 1: MVP core — emissão, verificação, revogação, audit logs |

---

> **Documentação gerada a partir do código-fonte real.**  
> Para reportar inconsistências: [GitHub Issues](https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues)
