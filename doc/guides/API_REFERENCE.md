```markdown
# API Reference — Txeka Ntiyiso

**Documentação completa da API REST v1.0**

**Baseado em testes reais de produção** | Última atualização: 2026-06-28

---

## Índice

1. [Base URL](#base-url)
2. [Escopo Legal e Isenção](#escopo-legal-e-isenção)
3. [Autenticação](#autenticação)
4. [Endpoints](#endpoints)
   - 4.1 [Emitir Documento](#1-emitir-documento)
   - 4.2 [Verificar Documento (Público)](#2-verificar-documento-público)
   - 4.3 [Verificar Documento (B2B/B2G)](#3-verificar-documento-b2bb2g)
   - 4.4 [Revogar Documento](#4-revogar-documento)
   - 4.5 [Listar Logs de Auditoria](#5-listar-logs-de-auditoria)
   - 4.6 [Histórico de Documento](#6-histórico-de-documento)
   - 4.7 [Estatísticas do Sistema](#7-estatísticas-do-sistema)
5. [Códigos de Erro](#códigos-de-erro)
6. [Rate Limiting](#rate-limiting)
7. [SDKs e Exemplos](#sdks-e-exemplos)
8. [Health Check](#health-check)

---

## Base URL

```

Produção:  https://txeka-ntiyiso-api.onrender.com/api/v1
Local:     http://localhost:8000/api/v1

```

---

## Escopo Legal e Isenção

O Txeka Ntiyiso opera em total conformidade com a **Lei n.º 3/2017 (Transações Eletrónicas)** e o **Decreto n.º 59/2019**.

* **Não-Repúdio:** O serviço atesta a integridade cronológica e a imutabilidade do documento a partir do momento do seu registo.
* **Isenção de Atividade:** O Txeka Ntiyiso não emite certificados digitais de chave pública nem assinaturas eletrónicas qualificadas, não competindo com as competências da infraestrutura ICP-MZ gerida pelo INTIC.
* **Privacidade:** Nenhum documento submetido através dos endpoints de emissão é armazenado nos servidores da plataforma. Apenas o hash criptográfico SHA-256 de 64 caracteres é persistido no container `txeka-ntiyiso-api`.

---

## Autenticação

A API utiliza **JWT (JSON Web Tokens)** via header `Authorization`.

```http
Authorization: Bearer <token_jwt>
```

Obter Token

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@txeka.co.mz",
  "password": "sua_senha_segura"
}
```

Resposta:

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

Endpoints

1. Emitir Documento

```http
POST /certify
```

Regista a integridade de um documento gerando hash SHA-256 e QR code.

Headers:

```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Body:

Campo	Tipo	Obrigatório	Descrição	
`file`	File	Sim	Documento PDF (máx. 50MB)	
`document_type`	String	Sim	Tipo: DUAT, CERTIDAO, LICENCA, DIPLOMA	
`institution_id`	String	Sim	Identificador da instituição	

> Nota de Privacidade: O ficheiro PDF enviado é processado estritamente em memória no container `txeka-ntiyiso-api` para a extração do hash criptográfico SHA-256 e geração do QR code. O binário nunca é persistido em disco ou base de dados, garantindo conformidade absoluta com o princípio de minimização da Lei de Proteção de Dados Pessoais em Moçambique.

Exemplo cURL:

```bash
curl -X POST "https://txeka-ntiyiso-api.onrender.com/api/v1/certify" \
  -H "Authorization: Bearer eyJhbG..." \
  -F "file=@documento.pdf" \
  -F "document_type=DUAT" \
  -F "institution_id=INAGE"
```

Resposta 200:

```json
{
  "success": true,
  "data": {
    "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
    "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "qr_code": "data:image/png;base64,iVBORw0KGgo...",
    "verification_url": "https://txeka.mz/verify/e3b0c44...",
    "institution_id": "INAGE",
    "document_type": "DUAT",
    "created_at": "2026-06-27T14:32:15+02:00",
    "expires_at": null
  }
}
```

> Nota sobre terminologia: O campo `verification_url` aponta para a URL pública de validação da integridade do registo. Não se trata de um "certificado digital" no sentido da ICP-MZ, mas sim de uma prova de existência cronológica verificável.

Resposta 409 (Conflict):

```json
{
  "success": false,
  "error": "DOCUMENT_ALREADY_EXISTS",
  "message": "Este documento já foi emitido anteriormente.",
  "existing_doc_id": "DUAT-INAGE-20260620-XXXXXX"
}
```

---

2. Verificar Documento (Público)

```http
GET /verify/{hash}
```

Verificação pública sem autenticação. Ideal para QR codes.

Parâmetros URL:

Campo	Tipo	Descrição	
`hash`	String	Hash SHA-256 de 64 caracteres hexadecimais	

Exemplo:

```bash
curl "https://txeka-ntiyiso-api.onrender.com/api/v1/verify/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
```

Resposta 200 (Válido):

```json
{
  "success": true,
  "status": "VALID",
  "dados_publicos": {
    "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
    "document_type": "DUAT",
    "institution_id": "INAGE",
    "created_at": "2026-06-27T14:32:15+02:00",
    "revoked": false,
    "revoked_at": null,
    "revoked_reason": null
  }
}
```

Resposta 200 (Revogado):

```json
{
  "success": true,
  "status": "REVOKED",
  "dados_publicos": {
    "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
    "document_type": "DUAT",
    "institution_id": "INAGE",
    "created_at": "2026-06-27T14:32:15+02:00",
    "revoked": true,
    "revoked_at": "2026-06-28T09:15:00+02:00",
    "revoked_reason": "expirado"
  }
}
```

Resposta 404 (Inválido):

```json
{
  "success": false,
  "status": "INVALID",
  "message": "Documento não encontrado no sistema."
}
```

> Nota: O campo `dados_publicos` contém apenas metadados públicos do documento. O campo `revoked` (boolean) está presente em todas as respostas de verificação — `false` para documentos válidos, `true` para revogados. Os campos `revoked_at` e `revoked_reason` são `null` quando o documento não foi revogado.

---

3. Verificar Documento (B2B/B2G)

```http
POST /verify
```

Verificação para integração com sistemas empresariais e governamentais.

Headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

Resposta 200 (Válido):

```json
{
  "success": true,
  "status": "VALID",
  "dados_publicos": {
    "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
    "document_type": "DUAT",
    "institution_id": "INAGE",
    "created_at": "2026-06-27T14:32:15+02:00",
    "revoked": false,
    "revoked_at": null,
    "revoked_reason": null
  }
}
```

Resposta 200 (Revogado):

```json
{
  "success": true,
  "status": "REVOKED",
  "dados_publicos": {
    "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
    "document_type": "DUAT",
    "institution_id": "INAGE",
    "created_at": "2026-06-27T14:32:15+02:00",
    "revoked": true,
    "revoked_at": "2026-06-28T09:15:00+02:00",
    "revoked_reason": "expirado"
  }
}
```

> Nota: A resposta é idêntica ao GET /verify/{hash}, com a diferença de que esta verificação B2B/B2G é registada nos logs de auditoria com `user_email: "anonymous"` e `institution_id: null`.

---

4. Revogar Documento

```http
POST /emissions/{doc_id}/revoke
```

Invalida um documento emitido. Requer role `admin` ou `institution` dona do documento.

Headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "reason": "expirado"
}
```

Resposta 200:

```json
{
  "success": true,
  "status": "revoked",
  "doc_id": "DUAT-INAGE-20260627-A1B2C3D4",
  "revoked_at": "2026-06-28T09:15:00+02:00",
  "reason": "expirado",
  "revoked_by": null
}
```

> Nota: O campo `revoked_by` pode ser `null` quando a revogação é efetuada via API sem identificação explícita do utilizador no payload.

Resposta 400 (Já revogado):

```json
{
  "success": false,
  "error": "ALREADY_REVOKED",
  "message": "Este documento já foi revogado em 2026-06-28T09:15:00+02:00."
}
```

---

5. Listar Logs de Auditoria

```http
GET /audit/logs
```

Retorna logs de auditoria paginados. Apenas administradores.

Parâmetros Query:

Campo	Tipo	Obrigatório	Descrição	
`action`	String	Não	Filtrar por: EMIT, VERIFY, REVOKE	
`institution_id`	String	Não	Filtrar por instituição	
`start_date`	Date	Não	Data inicial (YYYY-MM-DD)	
`end_date`	Date	Não	Data final (YYYY-MM-DD)	
`limit`	Integer	Não	Itens por página (default: 50, max: 100)	
`offset`	Integer	Não	Offset para paginação (default: 0)	

> Nota: A paginação utiliza `limit`/`offset` (não `page`). Por exemplo: `limit=50&offset=0` retorna os primeiros 50 registos; `limit=50&offset=50` retorna os seguintes 50.

Exemplo:

```bash
curl "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/logs?action=EMIT&institution_id=INAGE&limit=50&offset=0" \
  -H "Authorization: Bearer eyJhbG..."
```

Resposta:

```json
{
  "success": true,
  "count": 7,
  "limit": 50,
  "offset": 0,
  "timezone": "CAT (UTC+2)",
  "logs": [
    {
      "id": "dd828173-e002-4efd-8267-acef79147513",
      "user_email": "admin@txeka.co.mz",
      "action": "EMIT",
      "resource_type": "DOCUMENT",
      "resource_id": "989deabdd8d5c184d7aa4d53c18a3fb8fe511324e39f563e16d13e89ff30bc58",
      "institution_id": "INAGE",
      "ip_address": "197.218.118.251",
      "request_path": "/api/v1/certify",
      "request_method": "POST",
      "status_code": 200,
      "success": true,
      "details": "{\"document_type\": \"DUAT\", \"file_name\": \"Documento_Simulacao.pdf\", \"file_size\": 33508, \"doc_id\": \"DUAT-INAGE-20260626-74F8C0\"}",
      "timestamp": "2026-06-26T12:32:06.315930+02:00",
      "created_at": "2026-06-26T12:32:06.315935+02:00"
    }
  ]
}
```

> Nota sobre campos:
- `resource_id`: Para ação `EMIT`, este campo contém o hash SHA-256 (64 caracteres) do documento, não o `doc_id`.
- `details`: É uma string JSON serializada (não um objeto). Use `JSON.parse()` ou equivalente no cliente.
- `user_email`: Pode ser `"anonymous"` (verificação pública sem autenticação), `"unknown"` (request sem token JWT válido), ou o email do utilizador autenticado.
- `institution_id`: Pode ser `null` em verificações públicas (VERIFY sem autenticação).
- `timestamp` e `created_at`: São praticamente idênticos (diferença de microssegundos). Ambos representam o momento exacto da operação.

> Nota de Privacidade: Os endereços IP nos logs de auditoria são armazenados completos para fins forenses internos. Em consultas públicas, alinhamo-nos com a Política Nacional de Segurança Cibernética (PENSC) e garantimos a proteção de identidade dos cidadãos em verificações anónimas via QR code.

---

6. Histórico de Documento

```http
GET /audit/document/{hash}/history
```

Retorna histórico completo de ações sobre um documento específico, identificado pelo seu hash SHA-256.

Parâmetros URL:

Campo	Tipo	Descrição	
`hash`	String	Hash SHA-256 de 64 caracteres hexadecimais	

Exemplo:

```bash
curl "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/document/1cf504d0fffaf523c93f4c3b7532f46f549a719f6f6872b0fac4643ea55d2297/history" \
  -H "Authorization: Bearer eyJhbG..."
```

Resposta:

```json
{
  "success": true,
  "doc_hash": "1cf504d0fffaf523c93f4c3b7532f46f549a719f6f6872b0fac4643ea55d2297",
  "total_actions": 11,
  "timezone": "CAT (UTC+2)",
  "history": [
    {
      "id": "f75529b2-9438-4590-bbf6-9de4cb5e915c",
      "user_email": "anonymous",
      "action": "VERIFY",
      "resource_type": "DOCUMENT",
      "resource_id": "1cf504d0fffaf523c93f4c3b7532f46f549a719f6f6872b0fac4643ea55d2297",
      "institution_id": null,
      "ip_address": "41.220.200.217",
      "request_path": "/api/v1/verify",
      "request_method": "POST",
      "status_code": 200,
      "success": true,
      "details": "{\"method\": \"POST\", \"verified\": \"REVOKED\"}",
      "timestamp": "2026-06-28T06:53:12.674466+02:00",
      "created_at": "2026-06-28T06:53:12.674469+02:00"
    },
    {
      "id": "45ceff45-2afb-4f3c-9ad6-6e7c19565aa4",
      "user_email": "unknown",
      "action": "REVOKE",
      "resource_type": "DOCUMENT",
      "resource_id": "1cf504d0fffaf523c93f4c3b7532f46f549a719f6f6872b0fac4643ea55d2297",
      "institution_id": "INAGE",
      "ip_address": "197.218.120.65",
      "request_path": "/api/v1/emissions/DUAT-INAGE-20260624-5F7A16/revoke",
      "request_method": "POST",
      "status_code": 200,
      "success": true,
      "details": "{\"reason\": \"expirado\", \"revoked_by\": null}",
      "timestamp": "2026-06-26T04:29:26.652813+02:00",
      "created_at": "2026-06-26T04:29:26.652819+02:00"
    }
  ]
}
```

> Nota: O campo `total_actions` indica o número total de ações registadas para este documento. Cada entrada no array `history` segue o mesmo schema dos logs de auditoria (Secção 5).

---

7. Estatísticas do Sistema

```http
GET /audit/stats
```

Métricas agregadas do sistema. Apenas administradores.

> Estado atual: As queries agregadas estão em desenvolvimento. O endpoint retorna uma estrutura base com informação de período e timezone.

Parâmetros Query:

Campo	Tipo	Obrigatório	Descrição	
`institution_id`	String	Não	Filtrar por instituição	
`start_date`	Date	Não	Data inicial (YYYY-MM-DD)	
`end_date`	Date	Não	Data final (YYYY-MM-DD)	

Exemplo:

```bash
curl "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/stats?institution_id=INAGE&start_date=2026-06-26" \
  -H "Authorization: Bearer eyJhbG..."
```

Resposta (placeholder):

```json
{
  "success": true,
  "period": {
    "start": "2026-06-26",
    "end": null
  },
  "institution_id": "INAGE",
  "timezone": "CAT (UTC+2)",
  "stats": {
    "note": "Implementar queries agregadas no proximo sprint"
  }
}
```

> Nota: Este endpoint está planeado para retornar métricas como `total_documents`, `total_verifications`, `total_revocations`, `documents_by_institution`, `verifications_today`, e `average_verification_time_ms`. Consulte a documentação futura para a versão completa.

---

Códigos de Erro

Código	HTTP	Descrição	Ação	
`INVALID_HASH`	400	Hash não tem 64 caracteres hexadecimais	Verificar formato do hash	
`DOCUMENT_NOT_FOUND`	404	Hash não existe no sistema	Verificar se documento foi emitido	
`DOCUMENT_ALREADY_EXISTS`	409	Hash já registado	Verificar duplicação	
`ALREADY_REVOKED`	400	Documento já revogado	Nenhuma ação necessária	
`UNAUTHORIZED`	401	Token inválido ou expirado	Renovar token JWT	
`FORBIDDEN`	403	Sem permissão para esta ação	Verificar role do utilizador	
`RATE_LIMIT_EXCEEDED`	429	Limite de requisições excedido	Aguardar 1 minuto	
`FILE_TOO_LARGE`	413	PDF excede 50MB	Comprimir documento	
`INVALID_FILE_TYPE`	415	Ficheiro não é PDF válido	Verificar magic bytes `%PDF-`	
`INTERNAL_ERROR`	500	Erro interno do servidor	Contactar suporte	

---

Rate Limiting

Endpoint	Limite	Janela	
`POST /certify`	100	por minuto	
`GET /verify/{hash}`	30	por minuto	
`POST /verify`	100	por minuto	
`GET /audit/logs`	60	por minuto	

---

SDKs e Exemplos

Python

```python
import requests
import json

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

def get_audit_logs(action=None, institution_id=None, limit=50, offset=0):
    params = {"limit": limit, "offset": offset}
    if action:
        params["action"] = action
    if institution_id:
        params["institution_id"] = institution_id
    response = requests.get(
        f"{BASE_URL}/audit/logs",
        headers={"Authorization": f"Bearer {TOKEN}"},
        params=params
    )
    return response.json()

def get_document_history(doc_hash):
    response = requests.get(
        f"{BASE_URL}/audit/document/{doc_hash}/history",
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    return response.json()

# Uso
result = emit_document("duat.pdf", "DUAT", "INAGE")
print(result["data"]["qr_code"])

# Verificar documento
verify = verify_document("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
print(verify["dados_publicos"]["status"])

# Auditoria
logs = get_audit_logs(action="EMIT", institution_id="INAGE", limit=50, offset=0)
for log in logs["logs"]:
    details = json.loads(log["details"])  # details é string JSON
    print(f"{log['action']} | {log['user_email']} | {details.get('doc_id')}")
```

JavaScript (Node.js)

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

async function getAuditLogs(action = null, institutionId = null, limit = 50, offset = 0) {
  const params = { limit, offset };
  if (action) params.action = action;
  if (institutionId) params.institution_id = institutionId;
  
  const response = await axios.get(`${BASE_URL}/audit/logs`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    params
  });
  return response.data;
}

async function getDocumentHistory(docHash) {
  const response = await axios.get(`${BASE_URL}/audit/document/${docHash}/history`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  return response.data;
}

// Uso
(async () => {
  const result = await emitDocument('duat.pdf', 'DUAT', 'INAGE');
  console.log(result.data.qr_code);
  
  const verify = await verifyDocument('e3b0c44...');
  console.log(verify.dados_publicos.status);
  
  const logs = await getAuditLogs('EMIT', 'INAGE', 50, 0);
  logs.logs.forEach(log => {
    const details = JSON.parse(log.details);
    console.log(`${log.action} | ${log.user_email} | ${details.doc_id}`);
  });
})();
```

---

Health Check

```http
GET /health
```

Resposta:

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

Txeka Ntiyiso — API Reference v2.0 🇲🇿
Baseado em testes reais de produção | Alinhado com Lei 3/2017, Decreto 59/2019 e Resolução 69/2021 (PENSC)

```
