# SECURITY.md

## Políticas de Segurança Cibernética — Txeka Ntiyiso

**Infraestrutura tecnológica para verificação da integridade e autenticidade documental em Moçambique**

| Versão | Estado | Última Atualização | Contacto |
|--------|--------|-------------------|----------|
| 2.0 | Final | 2026-07-12 | geral.txekantiyiso@gmail.com |

Implementação de conformidade legal, modelo de ameaças e resposta a incidentes.

---

## Índice

1. [Modelo de Ameaças (STRIDE)](#1-modelo-de-ameaças-stride)
2. [Criptografia](#2-criptografia)
3. [Autenticação e Autorização](#3-autenticação-e-autorização)
4. [Ataques Mitigados](#4-ataques-mitigados)
5. [Containerização e Segurança de Infraestrutura](#5-containerização-e-segurança-de-infraestrutura)
6. [Backup e Disaster Recovery](#6-backup-e-disaster-recovery)
7. [Resposta a Incidentes](#7-resposta-a-incidentes)
8. [Conformidade Legal](#8-conformidade-legal)
9. [Contacto para Auditoria](#9-contacto-para-auditoria)
10. [Documentação Relacionada](#10-documentação-relacionada)

---

## 1. Modelo de Ameaças (STRIDE)

| Vetor | Descrição | Mitigação Txeka |
|-------|-----------|-----------------|
| **S**poofing | Falsificar identidade do emissor | JWT + institution_id validado no servidor |
| **T**ampering | Alterar documento após emissão | SHA-256 imutável; qualquer alteração invalida hash |
| **R**epudiation | Emissor negar que emitiu | Audit logs imutáveis com timestamp CAT (UTC+2) |
| **I**nformation Disclosure | Vazamento de dados | Zero-Knowledge: apenas hashes de 64 caracteres armazenados |
| **D**enial of Service | Sobrecarga do sistema | Rate limiting (100 req/min), resource limits (1.0 CPU / 512M RAM) |
| **E**levation of Privilege | Escalar privilégios | Roles server-side; usuário não-root `txeka` no container |

---

## 2. Criptografia

### 2.1 SHA-256

| Propriedade | Valor |
|-------------|-------|
| Tipo | Hash criptográfico |
| Tamanho | 256 bits (64 caracteres hexadecimais) |
| Propriedade | One-way (não reversível) |
| Força | Amplamente adotado na indústria |
| Colisão | Computacionalmente impraticável |

**Uso Txeka:** Hash do PDF binário processado em memória no container `txeka-ntiyiso-api`. O PDF original nunca é persistido.

### 2.2 JWT (pyjwt 2.8.0)

| Propriedade | Valor |
|-------------|-------|
| Algoritmo | HS256 (HMAC + SHA-256) |
| Secret | Armazenado em `.env` (nunca em código) |
| Payload | `{email, role, institution, exp, iat}` |
| Validação | Assinatura verificada em cada request |

**Uso Txeka:** Token para autenticação stateless de APIs.

### 2.3 bcrypt

| Propriedade | Valor |
|-------------|-------|
| Tipo | Password hashing |
| Salt rounds | 12 (defesa contra rainbow tables) |
| Tempo | ~100 ms/hash (lento propositalmente) |

**Uso Txeka:** Hashing de passwords de instituições e admin.

### 2.4 TLS 1.3

| Propriedade | Valor |
|-------------|-------|
| Protocolo | TLS 1.3 |
| Certificado | AC-MZ (recomendado) ou Let's Encrypt |
| Cifras | `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256` |
| HSTS | `max-age=63072000` |

**Uso Txeka:** HTTPS obrigatório em todos os endpoints.

---

## 3. Autenticação e Autorização

### 3.1 Roles

```python
ROLES = {
    "system":      ["verify", "emit", "revoke"],
    "admin":       ["verify", "emit", "revoke", "manage_institutions"],
    "institution": ["emit", "verify"],
    "citizen":     ["verify"]
}
```

> **Regra crítica:** `user.role` é sempre forçado pelo servidor a partir do JWT decodificado. Nunca confiar no cliente.

### 3.2 Endpoints Protegidos

| Endpoint | Método | Requisito | Log de Auditoria |
|----------|--------|-----------|------------------|
| `/api/v1/certify` | POST | JWT + role institution | EMIT |
| `/api/v1/certify/bulk` | POST | JWT + role institution | EMIT_BULK |
| `/api/v1/verify/{hash}` | GET | Público (não requer token) | VERIFY (anonymous) |
| `/api/v1/verify` | POST | API Key (B2B/B2G) | VERIFY |
| `/api/v1/emissions/{id}/revoke` | POST | JWT admin/institution | REVOKE |
| `/api/v1/audit/logs` | GET | JWT admin | — |
| `/api/v1/audit/document/{hash}/history` | GET | JWT admin/institution | — |
| `/api/v1/audit/stats` | GET | JWT admin | — |
| `/api/v1/institutions` | POST/GET/PATCH | JWT admin | INSTITUTION_* |
| `/api/v1/institutions/{id}/credits` | POST | JWT admin | CREDIT_ADD |

---

## 4. Ataques Mitigados

### Ataque 1: Falsificação de Documento

**Atacante:** "Vou editar este PDF"  
**Txeka:** Hash SHA-256 muda → verificação retorna `INVALID`  
**Estado:** ✅ Mitigado

### Ataque 2: Duplicação

**Atacante:** "Vou emitir o mesmo PDF 2x"  
**Txeka:** 409 Conflict, hash já existe na tabela `documents`  
**Estado:** ✅ Mitigado

### Ataque 3: Revogação Ignorada

**Atacante:** "Vou usar documento revogado"  
**Txeka:** Status = `revoked` → verificação retorna `REVOKED`  
**Estado:** ✅ Mitigado

### Ataque 4: Token Falso

**Atacante:** "Vou criar token JWT fake"  
**Txeka:** `jwt.decode()` falha (assinatura inválida) → 401  
**Estado:** ✅ Mitigado

### Ataque 5: SQL Injection

**Atacante:** "Vou injetar SQL no hash"  
**Txeka:** Prepared statements (SQLAlchemy) + validação de 64 caracteres hexadecimais  
**Estado:** ✅ Mitigado

### Ataque 6: Brute-Force

**Atacante:** "Vou tentar adivinhar hashes"  
**Txeka:** Rate limiting (100 req/min por IP) + SHA-256 espaço de 2^256  
**Estado:** ✅ Mitigado

### Ataque 7: Man-in-the-Middle (MITM)

**Atacante:** "Vou interceptar tráfego"  
**Txeka:** TLS 1.3 obrigatório + HSTS + certificado válido  
**Estado:** ✅ Mitigado

---

## 5. Containerização e Segurança de Infraestrutura

### 5.1 Dockerfile — Práticas de Segurança

| Prática | Implementação | Alinhamento PENSC |
|---------|---------------|-------------------|
| **Multi-stage build** | Stage 1 (builder) + Stage 2 (runtime) | Redução da superfície de ataque |
| **Usuário não-root** | `txeka:txeka` no container final | Mitiga Elevation of Privilege |
| **Sem bytecode** | `PYTHONDONTWRITEBYTECODE=1` | Elimina ficheiros `.pyc` |
| **Locale/TZ** | `pt_MZ.UTF-8`, `Africa/Maputo` | Auditoria cronológica CAT (UTC+2) |
| **Healthcheck** | `curl -f http://localhost:8000/health` | Disponibilidade e resiliência |
| **Labels** | `maintainer`, `version`, `country=MZ` | Rastreabilidade |

### 5.2 Docker Compose — Isolamento e Resiliência

| Prática | Implementação | Alinhamento PENSC |
|---------|---------------|-------------------|
| **Rede isolada** | `txeka-network` (subnet `172.20.0.0/16`) | Segregação de tráfego |
| **Resource limits** | `1.0 CPU`, `512M RAM` por serviço | Proteção contra DoS por exaustão |
| **Healthchecks** | DB: `pg_isready` / API: `curl /health` | Resiliência e auto-recuperação |
| **Depends on** | `condition: service_healthy` | Ordem de inicialização controlada |
| **Volumes persistentes** | `txeka-data` (BD), `txeka-logs` (auditoria) | Retenção e imutabilidade |
| **Restart policy** | `unless-stopped` | Alta disponibilidade |

### 5.3 Gestão de Segredos

| Segredo | Localização | Rotação |
|---------|-------------|---------|
| `SECRET_KEY` | `.env` (nunca em código) | Trimestral |
| `JWT_SECRET_KEY` | `.env` (nunca em código) | Trimestral |
| `POSTGRES_PASSWORD` | `.env` | Semestral |
| Certificado SSL | `/etc/nginx/ssl/` | Anual (AC-MZ) |

---

## 6. Backup e Disaster Recovery

### 6.1 Backup Automatizado

```bash
#!/bin/bash
# /opt/txeka/backup.sh

BACKUP_DIR="/var/backups/txeka"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Backup PostgreSQL
docker exec txeka-ntiyiso-db pg_dump -U postgres txeka_ntiyiso | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup logs
tar czf $BACKUP_DIR/logs_$DATE.tar.gz \
  /var/lib/docker/volumes/txeka-logs/_data/

# Rotação
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
```

Crontab:
```bash
0 2 * * * /opt/txeka/backup.sh >> /var/log/txeka-backup.log 2>&1
```

### 6.2 Restauração

```bash
# Restaurar base de dados
gunzip < /var/backups/txeka/db_20260627_020000.sql.gz | \
  docker exec -i txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# Verificar integridade
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso \
  -c "SELECT COUNT(*) FROM documents;"
```

### 6.3 RTO / RPO

| Métrica | Valor | Nota |
|---------|-------|------|
| **RTO** | 4 horas | Tempo máximo para restaurar serviço |
| **RPO** | 15 minutos | Perda máxima de dados aceitável |
| **Retenção** | 20 anos | Hashes e logs (Decreto 59/2019) |
| **Retenção backup** | 30 dias | Cópias de segurança operacionais |

---

## 7. Resposta a Incidentes

### 7.1 Documento Fraudulento

1. **Revogar imediatamente:**
   ```bash
   curl -X POST https://api.txeka.co.mz/api/v1/emissions/{doc_id}/revoke \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"reason": "Documento fraudulento"}'
   ```

2. **Notificar cidadãos:** Email a todos que verificaram

3. **Log de auditoria:** Sistema regista quem revogou, quando, porquê

4. **Investigação:** Analisar logs de emissão

### 7.2 Breach de Segurança

1. **Isolar:** Revogar todos os tokens JWT ativos
2. **Preservar:** Exportar logs dos últimos 7 dias
3. **Analisar:** Identificar vetor de ataque
4. **Notificar:** geral.txekantiyiso@gmail.com + INTIC + BdM
5. **Remediar:** Rotação de todas as credenciais
6. **Relatório:** Documentar timeline e medidas

### 7.3 DoS / DDoS

1. **Ativar defesas:** Rate limiting agressivo + fail2ban
2. **Identificar:** Analisar padrão de ataque
3. **Bloquear:** IPs maliciosos no firewall
4. **Escalar:** ISP / Render.com / INTIC
5. **Mitigar:** CDN / Cloud DDoS protection

---

## 8. Conformidade Legal

O Txeka Ntiyiso foi concebido em conformidade com os princípios e requisitos aplicáveis da legislação moçambicana relativos à integridade, autenticidade e rastreabilidade documental.

| Requisito | Legislação | Implementação | Estado |
|-----------|-----------|---------------|--------|
| Autenticidade | Lei 3/2017, Art. 48 | JWT + institution_id | ✅ |
| Integridade | Lei 3/2017, Art. 49 | SHA-256 imutável | ✅ |
| Não-repúdio | Lei 3/2017, Art. 50 | Audit logs + timestamp CAT | ✅ |
| Retenção 20 anos | Decreto 59/2019 | Volumes persistentes `txeka-data` | ✅ |
| Proteção de ICI | Resolução 69/2021 (PENSC) | Rede isolada, usuário não-root, TLS 1.3 | ✅ |
| Cifragem em trânsito | Resolução 69/2021 (PENSC) | HTTPS obrigatório (TLS 1.3) | ✅ |
| Cifragem em repouso | Resolução 69/2021 (PENSC) | PostgreSQL encriptação nativa | ✅ |
| Rate limiting | Banco de Moçambique | 100 req/min (público), 1000 req/min (B2B) | ✅ |
| Zero PII | Banco de Moçambique | Apenas hashes de 64 caracteres | ✅ |
| Trilha de auditoria | Banco de Moçambique | Tabela `audit_logs` imutável | ✅ |
| Backup automático | Decreto 59/2019 | Script diário + retenção 30 dias | ✅ |
| RTO/RPO | Decreto 59/2019 | 4h / 15min | ✅ |

---

## 9. Contacto para Auditoria

Para o governo ou regulador realizar auditorias técnicas:

**Email:** geral.txekantiyiso@gmail.com

Disponibilizaremos:
- Desenho da arquitetura completa
- Acesso ao código-fonte (repositório privado)
- Logs de auditoria dos últimos 90 dias
- Resultados dos testes de intrusão (Penetration Tests)
- Configuração Docker e Docker Compose

---

## 10. Documentação Relacionada

- [README.md](../../README.md) — Apresentação do projeto
- [POSITIONING.md](../../POSITIONING.md) — Posicionamento estratégico e regulatório
- [Arquitetura Técnica](../technical/TECHNICAL.md) — Stack, schema e decisões técnicas
- [Guia de Deploy](../technical/DEPLOYMENT.md) — Docker, pipeline CI/CD e infraestrutura
- [Runbook de Produção](../technical/RUNBOOK.md) — Operações diárias e troubleshooting
- [Dossiê de Conformidade Legal](COMPLIANCE.md) — Enquadramento jurídico completo
- [API Reference](../guides/API_REFERENCE.md) — Contrato completo da API REST

---

*Documento elaborado em alinhamento com a Lei n.º 3/2017, Decreto n.º 59/2019 e Resolução n.º 69/2021 (PENSC) da República de Moçambique.*
*Versão 2.0 — Julho 2026*
