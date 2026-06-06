# Documentação Técnica — Txeka Ntiyiso

Arquitetura, stack e decisões técnicas.

## Visão Geral

Sistema distribuído B2G com dois componentes principais:

1. API Gateway (FastAPI + PostgreSQL)
2. Web Portal (React + Tailwind)

Ambos deployados em Render.com com database em Supabase.

## Stack Tecnológico

### Backend

- Framework: FastAPI 0.110.0
- Linguagem: Python 3.11
- Database: PostgreSQL (Supabase)
- Autenticação: JWT (pyjwt 2.8.0)
- Criptografia: SHA-256, bcrypt
- QR Code: qrcode 7.4.2 + Pillow

### Frontend

- Framework: React 18
- Styling: Tailwind CSS
- HTTP Client: Axios
- Icons: Lucide React
- Estado: React Hooks

### Infraestrutura

- Hosting API: Render.com (US)
- Hosting Frontend: Render.com (US)
- Database: Supabase PostgreSQL
- CDN: Render.com built-in
- Monitoramento: Render logs

## Arquitetura de Dados

### Tabelas Principais

#### emitted_documents

```sql
CREATE TABLE emitted_documents (
    id INTEGER PRIMARY KEY,
    doc_id VARCHAR(100) UNIQUE,
    doc_hash VARCHAR(64) UNIQUE,
    document_type VARCHAR(50),
    institution_id VARCHAR(50),
    issued_by VARCHAR(255),
    certificate_url VARCHAR(255),
    qr_code TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revocation_reason TEXT
);
Índices:
doc_hash (busca rápida na verificação)
institution_id (filtrar por instituição)
created_at (auditoria temporal)
Fluxo de Emissão
Cliente POST /api/v1/emit com PDF
Validação: tamanho, tipo, extensão
SHA-256(PDF bytes) → hash_sha256
Verificação: hash já existe?
SIM: 409 Conflict (documento já emitido)
NÃO: Continua
Gerar QR code: qrcode(hash_sha256, doc_id)
Criar registro BD: emitted_documents
Retornar: {doc_id, hash, qr_code, certificate_url}
Tempo esperado: menos de 500ms
Fluxo de Verificação
Cliente GET /api/v1/verify/{doc_hash}
Validação: hash tem 64 chars hexadecimais?
NÃO: 400 Bad Request
SIM: Continua
Query BD: SELECT * WHERE doc_hash = ?
Se não encontrado: 404 Not Found
Se encontrado: Retornar documento + status
Gerar novo QR para exibição
Tempo esperado: menos de 100ms
Fluxo de Revogação
Cliente POST /api/v1/emissions/{doc_id}/revoke
Validação: token JWT admin?
NÃO: 403 Forbidden
SIM: Continua
Query BD: SELECT * WHERE doc_id = ?
Se não encontrado: 404 Not Found
Se encontrado: UPDATE status = 'revoked'
Registo permanece em BD (não apagado)
revoked_at = NOW()
revocation_reason = fornecido
Log auditoria: quem revogou, quando, por quê
Retornar: {status='revoked', ...}
Garantia: Não-repúdio mantido (Lei 3/2017)
Tempo esperado: menos de 150ms
Autenticação
JWT Flow
Utilizador login (mock: system@txeka.co.mz)
Sistema cria token: jwt.encode(payload, SECRET_KEY)
Cliente armazena em localStorage
Cada request: Authorization: Bearer {token}
security.py: jwt.decode(token, SECRET_KEY)
Se válido: Continua. Se não: 401 Unauthorized
Roles e Scopes
ROLES = {
    "system": ["verify", "emit", "revoke"],
    "admin": ["verify", "emit", "revoke", "manage"],
    "institution": ["emit", "verify"],
    "citizen": ["verify"]
}
Segurança
Criptografia
SHA-256: Hash imutável do documento
JWT (HS256): Autenticação stateless
bcrypt: Password hashing (futuro)
Validação e Restrição de Entrada
Formato de Arquivo: Exclusivamente PDF (.pdf).
Tipo MIME Autorizado: application/pdf.
Assinatura Mágica (Magic Numbers): Verificação mandatória dos bytes iniciais (%PDF-) para mitigação de falsificação de extensão.
Limite de Volume: menos de 50MB por requisição.
Controlo de Fluxo (Rate Limiting): Parametrizado para 1.000 requisições por minuto por IP ao nível do API Gateway.
CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://txeka-ntiyiso-portal.onrender.com"
]
Database Connection
Desenvolvimento
DATABASE_URL = "sqlite:///./txeka_ntiyiso.db"
Produção
DATABASE_URL = os.getenv("DATABASE_URL")
# postgresql://user:pass@db.supabase.co:5432/postgres
Conexão automática via SQLAlchemy.
Deploy Pipeline
Developer faz push ao GitHub
Render webhook acionado
Render clona repo
Executa: pip install -r requirements.txt
Executa: uvicorn src.main:app --host 0.0.0.0 --port 10000
Health check: GET /health
Se 200: Deploy bem-sucedido
Se erro: Rollback automático
Tempo: aproximadamente 2-3 minutos
Performance
Benchmarks
Emit: 450ms (incluindo criptografia)
Verify: 85ms (query BD + QR gen)
Revoke: 120ms (update BD)
Escalabilidade
Atual: 100 requests/segundo
Target: 1.000 requests/segundo (Fase 2)
Bottleneck: PostgreSQL (Supabase pode escalar)
Monitoramento
Logs
INFO:src.main:Rotas registadas com prefixo: /api/v1
INFO:src.routes.emit:Documento emitido: DUAT-INAGE-20260604-A1B2C3D4
INFO:src.routes.verify:Documento verificado: hash a740dc78...
ERROR:src.main:Erro não tratado: [detalhes]
Health Check
GET /health
→ {
  "status": "online",
  "project": "Txeka Ntiyiso",
  "version": "1.0.0"
}
Decisões Arquiteturais
Por que PostgreSQL?
Txeka usa SQL nativo (não NoSQL)
Transações ACID críticas
Supabase é grátis e escalável
Lei 3/2017 exige auditoria (SQL facilita)
Por que FastAPI?
Type hints nativos (menos bugs)
Auto-documentation (/docs)
Performance (uvicorn + asyncio)
JWT simples de implementar
Por que React?
Componentes reutilizáveis
Hot reload (desenvolvimento)
Ecosystem maduro
Mobile-friendly com Tailwind
Roadmap Técnico
Fase 2:
Blockchain anchor (imutabilidade)
Cache Redis (performance)
Webhooks para clientes
Fase 3:
2FA (autenticação)
OAuth2 (social login)
ML fraud detection
Fase 4:
Multi-language
Mobile app nativa
API v2 (breaking changes)
