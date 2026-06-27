# API Reference — Txeka Ntiyiso

**Documentação completa da API REST v1.0**

---

## Base URL

```
Produção:  https://txeka-ntiyiso-api.onrender.com/api/v1
Local:     http://localhost:8000/api/v1
```

## Autenticação

A API utiliza **JWT (JSON Web Tokens)** via header `Authorization`.

```http
Authorization: Bearer <token_jwt>
```

### Obter Token

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@txeka.co.mz",
  "password": "sua_senha_segura"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "role": "admin",
  "institution": "TXEKA"
}
```

---

## Endpoints

### 1. Emitir Documento

```http
POST /certify
```

Regista a integridade de um documento gerando hash SHA-256 e QR code.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `file` | File | Sim | Documento PDF (máx. 50MB) |
| `document_type` | String | Sim | Tipo: DUAT, CERTIDAO, LICENCA, DIPLOMA |
| `institution_id` | String | Sim | Identificador da instituição |

**Exemplo cURL:**
```bash
curl -X POST "https://txeka-ntiyiso-api.onrender.com/api/v1/certify" \
  -H "Authorization: Bearer eyJhbG..." \
  -F "file=@documento.pdf" \
  -F "document_type=DUAT" \
  -F "institution_id=INAGE"
```

**Resposta 201:**
```json
{
  "success": true,
  "data": {
    "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
    "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "qr_code": "data:image/png;base64,iVBORw0KGgo...",
    "certificate_url": "https://txeka.mz/verify/e3b0c44...",
    "institution_id": "INAGE",
    "document_type": "DUAT",
    "created_at": "2026-06-27T14:32:15+02:00",
    "expires_at": null
  }
}
```

**Resposta 409 (Conflict):**
```json
{
  "success": false,
  "error": "DOCUMENT_ALREADY_EXISTS",
  "message": "Este documento já foi emitido anteriormente.",
  "existing_doc_id": "DUAT-INAGE-20260620-XXXXXX"
}
```

---

### 2. Verificar Documento (Público)

```http
GET /verify/{hash}
```

Verificação pública sem autenticação. Ideal para QR codes.

**Parâmetros URL:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `hash` | String | Hash SHA-256 de 64 caracteres hexadecimais |

**Exemplo:**
```bash
curl "https://txeka-ntiyiso-api.onrender.com/api/v1/verify/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
```

**Resposta 200 (Válido):**
```json
{
  "success": true,
  "status": "VALID",
  "data": {
    "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
    "document_type": "DUAT",
    "institution_id": "INAGE",
    "institution_name": "Instituto Nacional de Gestão de Terras",
    "created_at": "2026-06-27T14:32:15+02:00",
    "verified_at": "2026-06-27T16:45:22+02:00"
  }
}
```

**Resposta 200 (Revogado):**
```json
{
  "success": true,
  "status": "REVOKED",
  "data": {
    "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
    "revoked_at": "2026-06-28T09:15:00+02:00",
    "revoked_reason": "Documento falsificado detectado em auditoria interna",
    "revoked_by": "admin@inage.gov.mz"
  }
}
```

**Resposta 404 (Inválido):**
```json
{
  "success": false,
  "status": "INVALID",
  "message": "Documento não encontrado no sistema."
}
```

---

### 3. Verificar Documento (B2B/B2G)

```http
POST /verify
```

Verificação em lote para integração com sistemas empresariais.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**Resposta:** Idêntica ao GET /verify/{hash}, com audit log identificado.

---

### 4. Revogar Documento

```http
POST /emissions/{doc_id}/revoke
```

Invalida um documento emitido. Requer role `admin` ou `institution` dona do documento.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "reason": "Documento falsificado detectado em auditoria interna"
}
```

**Resposta 200:**
```json
{
  "success": true,
  "status": "revoked",
  "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
  "revoked_at": "2026-06-28T09:15:00+02:00",
  "reason": "Documento falsificado detectado em auditoria interna",
  "revoked_by": "admin@inage.gov.mz"
}
```

**Resposta 400 (Já revogado):**
```json
{
  "success": false,
  "error": "ALREADY_REVOKED",
  "message": "Este documento já foi revogado em 2026-06-28T09:15:00+02:00."
}
```

---

### 5. Listar Logs de Auditoria

```http
GET /audit/logs
```

Retorna logs de auditoria paginados. Apenas administradores.

**Parâmetros Query:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `action` | String | Não | Filtrar por: EMIT, VERIFY, REVOKE |
| `institution_id` | String | Não | Filtrar por instituição |
| `start_date` | Date | Não | Data inicial (YYYY-MM-DD) |
| `end_date` | Date | Não | Data final (YYYY-MM-DD) |
| `page` | Integer | Não | Página (default: 1) |
| `limit` | Integer | Não | Itens por página (default: 50, max: 100) |

**Exemplo:**
```bash
curl "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/logs?action=EMIT&institution_id=INAGE&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbG..."
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_email": "admin@inage.gov.mz",
      "action": "EMIT",
      "resource_type": "document",
      "resource_id": "DUAT-INAGE-20260627-A1B2C3D4",
      "institution_id": "INAGE",
      "ip_address": "197.218.XXX.XXX",
      "request_path": "/api/v1/certify",
      "request_method": "POST",
      "status_code": 201,
      "success": true,
      "details": {"doc_type": "DUAT", "file_size": 245760},
      "timestamp": "2026-06-27T14:32:15+02:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15230,
    "total_pages": 762
  }
}
```

---

### 6. Histórico de Documento

```http
GET /audit/document/{hash}/history
```

Retorna histórico completo de um documento específico.

**Resposta:**
```json
{
  "success": true,
  "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "history": [
    {
      "action": "EMIT",
      "timestamp": "2026-06-27T14:32:15+02:00",
      "actor": "admin@inage.gov.mz",
      "details": "Documento emitido com sucesso"
    },
    {
      "action": "VERIFY",
      "timestamp": "2026-06-27T16:45:22+02:00",
      "actor": "anonymous",
      "ip": "197.218.XXX.XXX",
      "details": "Verificação pública via QR code"
    },
    {
      "action": "REVOKE",
      "timestamp": "2026-06-28T09:15:00+02:00",
      "actor": "admin@inage.gov.mz",
      "details": "Documento falsificado detectado em auditoria interna"
    }
  ]
}
```

---

### 7. Estatísticas do Sistema

```http
GET /audit/stats
```

Métricas agregadas. Apenas administradores.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total_documents": 15230,
    "total_verifications": 89420,
    "total_revocations": 145,
    "documents_by_institution": {
      "INAGE": 5120,
      "MINJUST": 3890,
      "BANCO_MZ": 2100
    },
    "verifications_today": 1250,
    "average_verification_time_ms": 85
  }
}
```

---

## Códigos de Erro

| Código | HTTP | Descrição | Ação |
|--------|------|-----------|------|
| `INVALID_HASH` | 400 | Hash não tem 64 caracteres hexadecimais | Verificar formato do hash |
| `DOCUMENT_NOT_FOUND` | 404 | Hash não existe no sistema | Verificar se documento foi emitido |
| `DOCUMENT_ALREADY_EXISTS` | 409 | Hash já registado | Verificar duplicação |
| `ALREADY_REVOKED` | 400 | Documento já revogado | Nenhuma ação necessária |
| `UNAUTHORIZED` | 401 | Token inválido ou expirado | Renovar token JWT |
| `FORBIDDEN` | 403 | Sem permissão para esta ação | Verificar role do utilizador |
| `RATE_LIMIT_EXCEEDED` | 429 | Limite de requisições excedido | Aguardar 1 minuto |
| `FILE_TOO_LARGE` | 413 | PDF excede 50MB | Comprimir documento |
| `INVALID_FILE_TYPE` | 415 | Ficheiro não é PDF válido | Verificar magic bytes `%PDF-` |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor | Contactar suporte |

---

## Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `POST /certify` | 100 | por minuto |
| `GET /verify/{hash}` | 30 | por minuto |
| `POST /verify` | 100 | por minuto |
| `GET /audit/logs` | 60 | por minuto |

---

## SDKs e Exemplos

### Python

```python
import requests

BASE_URL = "https://txeka-ntiyiso-api.onrender.com/api/v1"
TOKEN = "seu_token_jwt"

def emit_document(file_path, doc_type, institution):
    with open(file_path, 'rb') as f:
        response = requests.post(
            f"{BASE_URL}/certify",
            headers={"Authorization": f"Bearer {TOKEN}"},
            files={"file": f},
            data={"document_type": doc_type, "institution_id": institution}
        )
    return response.json()

def verify_document(hash_str):
    response = requests.get(f"{BASE_URL}/verify/{hash_str}")
    return response.json()

# Uso
result = emit_document("duat.pdf", "DUAT", "INAGE")
print(result["data"]["qr_code"])
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://txeka-ntiyiso-api.onrender.com/api/v1';
const TOKEN = 'seu_token_jwt';

async function emitDocument(filePath, docType, institution) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('document_type', docType);
  form.append('institution_id', institution);

  const response = await axios.post(`${BASE_URL}/certify`, form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  return response.data;
}

async function verifyDocument(hash) {
  const response = await axios.get(`${BASE_URL}/verify/${hash}`);
  return response.data;
}
```

---

## Health Check

```http
GET /health
```

**Resposta:**
```json
{
  "status": "online",
  "project": "Txeka Ntiyiso",
  "version": "1.0.0",
  "environment": "production",
  "timezone": "CAT",
  "timestamp": "2026-06-27T16:45:22+02:00"
}
```

---

*Txeka Ntiyiso — API Reference v1.0 🇲🇿*
"""
