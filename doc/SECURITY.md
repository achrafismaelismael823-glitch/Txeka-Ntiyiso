```markdown
# Segurança — Lei 3/2017 e Conformidade

Implementação de conformidade legal e segurança da informação.

## Lei 3/2017 — Transações Eletrónicas de Moçambique

### Requisito 1: Autenticidade

Definição: Garantir que o documento foi realmente emitido por quem afirma ter emitido.

Implementação Txeka:
- Campo issued_by: Email do staff da instituição
- Campo institution_id: Identificação única da instituição
- JWT token com sub: email e role: institution
- Timestamp de emissão registado em BD

Evidência: Se alguém tenta falsificar mudando institution_id, o hash SHA-256 muda. Verificação retorna "Inválido".

---

### Requisito 2: Integridade

Definição: Garantir que o documento não foi modificado após emissão.

Implementação Txeka:
- SHA-256 do documento original
- Se 1 byte mudar: hash completamente diferente
- Verificação compara hash calculado vs hash guardado
- Impossível reverter falsificação (SHA-256 é one-way)

Evidência: Testes provam que alterar PDF em 1 pixel invalida documento.

---

### Requisito 3: Não-Repúdio

Definição: Emissora não pode negar que emitiu o documento.

Implementação Txeka:
- issued_at: Timestamp UTC da emissão
- issued_by: Email registado no JWT
- Auditoria BD: Todos os acessos guardados
- Logs: Quem verificou, quando, resultado

Evidência: Relatório de auditoria mostra "INAGE emitiu DUAT-123 em 04/06/2026 14:32:15 UTC por admin@inage.mz"

---

## Decreto n.º 59/2019 — Serviços de Validação Cronológica e Eletrónica

### Retenção de Registos (20 Anos)

Exigência Legal: Período mínimo de 20 anos para a conservação de registos probatórios e auditorias de validação eletrónica.

Implementação Txeka:
- Hashes SHA-256: Conservados indefinidamente (mínimo 20 anos)
- Logs de auditoria: Imutáveis, impossível editar
- Timestamps: UTC, sincronizados com NTP
- Revogações: Registadas com razão e quem revogou

Garantia: Impossível apagar ou modificar registos históricos.

---

## Banco de Moçambique — Requisitos

### Segurança Transaccional

- Validação de entrada (tipo, tamanho, formato)
- Rate limiting (1.000 req/min por IP)
- HTTPS apenas (não HTTP)
- Certificado SSL válido

Status de Implementação: Plenamente implementado.

### Conformidade de Dados Moçambicana

Proteção de Dados Pessoais:
- Não guardar dados de identificação pessoal (PII)
- Operação exclusiva com hashes criptográficos e metadados
- Em total conformidade com Lei n.º 3/2017

Retenção de Registos Auditáveis:
Os hashes originais, logs de auditoria, timestamps e informações de revogação são conservados indefinidamente, com período mínimo obrigatório de 20 anos, em compliance com Decreto n.º 59/2019 (Serviços de Validação Cronológica e Eletrónica).

Backup e Disaster Recovery:
- Backup automático (Supabase PostgreSQL)
- Replicação multi-região (redundância)
- RTO: 4 horas | RPO: 15 minutos

Status de Implementação: Plenamente implementado.

### Auditoria

- Logging completo (who, what, when, where, why)
- Imutabilidade logs (não pode editar)
- Acesso restrito a logs (admin only)

Status de Implementação: Plenamente implementado.

---

## Criptografia

### SHA-256

- Tipo: Hash criptográfico
- Tamanho: 256 bits (64 caracteres hexadecimais)
- Propriedade: One-way (não pode reverter)
- Força: Militar (usado por governos)
- Colisão: Impossível (teoricamente)

Uso Txeka: Hash do PDF binário antes de guardar.

### JWT (pyjwt 2.8.0)

- Algoritmo: HS256 (HMAC + SHA-256)
- Secret: Armazenado em .env (não em código)
- Payload: {email, role, exp, iat}
- Validação: Assinatura verificada em cada request

Uso Txeka: Token para autenticação de APIs.

### bcrypt (Futuro)

- Tipo: Password hashing
- Salt rounds: 12 (defesa contra rainbow tables)
- Tempo: ~100ms/hash (lento propositalmente)

Uso Txeka: Quando implementar login real.

---

## Endpoints Protegidos

POST /api/v1/emit
- Requer JWT token válido
- Valida institution_id do token
- Log: quem emitiu, quando, doc_id

GET /api/v1/verify/{hash}
- Público (não requer token)
- Log: quem verificou, IP, resultado
- Rate limit: 100 req/min por IP

POST /api/v1/emissions/{doc_id}/revoke
- Requer JWT admin role
- Registra razão revogação
- Log de auditoria imutável
- Não apaga registo (soft update → status='revoked')
- Garantia de não-repúdio (Lei 3/2017)

---

## Ataques Mitigados

### Ataque 1: Falsificação de Documento

Atacante: "Vou editar este PDF"
Txeka: hash muda → verificação falha. Mitigado.

### Ataque 2: Duplicação

Atacante: "Vou emitir o mesmo PDF 2x"
Txeka: 409 Conflict, hash já existe. Mitigado.

### Ataque 3: Revogação Ignorada

Atacante: "Vou usar documento revogado"
Txeka: Status = revogado → falha verificação. Mitigado.

### Ataque 4: Token Falso

Atacante: "Vou criar token fake"
Txeka: jwt.decode() falha (assinatura inválida). Mitigado.

### Ataque 5: SQL Injection

Atacante: "Vou injetar SQL no hash"
Txeka: Prepared statements (SQLAlchemy). Mitigado.

---

## Incident Response

### Se Descobrir Documento Fraudulento

1. Revogar imediatamente:
   POST /api/v1/emissions/{doc_id}/revoke
   reason: "Documento fraudulento"

2. Notificar cidadãos:
   Email a todos que verificaram

3. Log de auditoria:
   Sistema registra quem revogou, quando, por quê

4. Investigação:
   Analisar logs: quem emitiu, quando, contexto

---
## Conformidade Checklist

- Lei 3/2017: Autenticidade implementada
- Lei 3/2017: Integridade implementada
- Lei 3/2017: Não-repúdio implementado
- Decreto 59/2019: Retenção de 20 anos configurada
- Banco de Moçambique: Controlo de fluxo (Rate limiting) ativo
- Banco de Moçambique: Operação sem armazenamento de dados pessoais (PII)
- Banco de Moçambique: Trilha de auditoria completa e imutável
- Cópia de Segurança: Automatizada via Supabase (Backup)
- Cifragem em Trânsito: Imposição estrita de HTTPS (TLS 1.3)
- Cifragem em Repouso: Implementada na base de dados PostgreSQL

---

## Contacto para Auditoria

Para o governo ou regulador realizar auditorias técnicas:

Correio Eletrónico: security@txeka.co.mz

Disponibilizaremos:
- Desenho da arquitetura completa
- Acesso ao código-fonte (repositório privado)
- Logs de auditoria dos últimos 90 dias
- Resultados dos testes de intrusão (Penetration Tests)
