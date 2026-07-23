# RUNBOOK.md

## Runbook de Operações — Txeka Ntiyiso

**Procedimentos operacionais, troubleshooting e resolução de incidentes**

| Versão | Estado | Última Atualização | Contacto |
|--------|--------|-------------------|----------|
| 2.0.0 | Final | 2026-07-23 | geral.txekantiyiso@gmail.com |

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Rotinas Diárias](#2-rotinas-diárias)
3. [Rotinas Semanais](#3-rotinas-semanais)
4. [Rotinas Mensais](#4-rotinas-mensais)
5. [Troubleshooting por Sintoma](#5-troubleshooting-por-sintoma)
6. [Procedimentos de Emergência](#6-procedimentos-de-emergência)
7. [Comandos Úteis](#7-comandos-úteis)
8. [Contactos de Escalamento](#8-contactos-de-escalamento)
9. [Documentação Relacionada](#9-documentação-relacionada)

---

## 1. Visão Geral

Este runbook cobre as operações diárias do Txeka Ntiyiso em produção. O sistema está hospedado na Render.com com base de dados PostgreSQL managed.

**Stack:**
- FastAPI (Python 3.11)
- PostgreSQL 15 (Render managed)
- Docker (desenvolvimento / on-premise)
- Nginx (on-premise)

**Ambientes:**

| Ambiente | URL | Base de Dados |
|----------|-----|----------------|
| Produção | https://txeka-ntiyiso-api.onrender.com | PostgreSQL managed (Render) |
| Local | http://localhost:8000 | PostgreSQL 15 (Docker) |

---

## 2. Rotinas Diárias

### 2.1 Verificar Health Check

```bash
curl -s https://txeka-ntiyiso-api.onrender.com/health | jq
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-23T08:00:00Z",
  "version": "2.0.0",
  "environment": "production",
  "database": "connected"
}
```

> **Ação se falhar:** Verificar logs no dashboard do Render. Se persistir > 5 min, escalonar.

### 2.2 Verificar Logs de Erro

**Render Dashboard:**
- Aceda ao dashboard do serviço
- Filtre por `level=error` ou `level=warning`

**Docker (local):**
```bash
docker-compose logs -f api --tail=100 | grep -i error
```

### 2.3 Verificar Estatísticas

```bash
curl -s https://txeka-ntiyiso-api.onrender.com/api/v1/audit/stats   -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Métricas a monitorar:**
- Total de documentos emitidos
- Taxa de verificação
- Documentos revogados
- Créditos disponíveis por instituição

---

## 3. Rotinas Semanais

### 3.1 Revisão de Logs de Auditoria

```bash
# Exportar logs da semana
curl -s "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/logs?limit=1000"   -H "Authorization: Bearer $ADMIN_TOKEN" | jq > /tmp/audit_$(date +%Y%m%d).json
```

**Verificar:**
- [ ] Tentativas de acesso não autorizado (401/403)
- [ ] Rate limiting ativado (429)
- [ ] Erros de base de dados (500)
- [ ] Documentos revogados (ações administrativas)

### 3.2 Verificar Consumo de Créditos

```bash
curl -s https://txeka-ntiyiso-api.onrender.com/api/v1/institutions/me/credits   -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Alerta:** Se créditos < 10, notificar admin para recarga.

### 3.3 Backup de Verificação

```bash
# Testar restauração de backup (ambiente de teste)
gunzip < /var/backups/txeka/db_$(date -d '1 day ago' +%Y%m%d)_020000.sql.gz |   docker exec -i txeka-test-db psql -U postgres -d txeka_ntiyiso
```

---

## 4. Rotinas Mensais

### 4.1 Rotação de Segredos

| Segredo | Frequência | Comando |
|---------|-----------|---------|
| `SECRET_KEY` | Trimestral | `openssl rand -hex 32` |
| `JWT_SECRET_KEY` | Trimestral | `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | Semestral | `openssl rand -hex 16` |

**Procedimento:**
1. Gerar novo segredo
2. Atualizar no dashboard do Render (Environment Variables)
3. Reiniciar serviço
4. Verificar health check
5. Testar login

### 4.2 Revisão de Acesso

```bash
# Listar instituições ativas
curl -s https://txeka-ntiyiso-api.onrender.com/api/v1/institutions   -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[] | {id, name, is_active}'
```

**Verificar:**
- [ ] Instituições inativas há > 90 dias
- [ ] API keys não utilizadas há > 180 dias
- [ ] Tokens de acesso expirados

### 4.3 Teste de Disaster Recovery

```bash
# Simular falha total
docker-compose down

# Restaurar backup mais recente
gunzip < /var/backups/txeka/db_$(date +%Y%m%d)_020000.sql.gz |   docker exec -i txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# Verificar integridade
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso   -c "SELECT COUNT(*) FROM documents;"
```

**RTO alvo:** < 4 horas  
**RPO alvo:** < 15 minutos

---

## 5. Troubleshooting por Sintoma

### 5.1 API Retorna 502/503

**Sintoma:** `curl` retorna `Bad Gateway` ou `Service Unavailable`

**Causas prováveis:**
1. Serviço no Render reiniciando
2. Base de dados inacessível
3. Memory limit excedido (512M)

**Diagnóstico:**
```bash
# Verificar health
curl -v https://txeka-ntiyiso-api.onrender.com/health

# Verificar logs no Render Dashboard
# Procurar por "MemoryError" ou "Connection refused"
```

**Resolução:**
1. Aguardar 30s (auto-recuperação do Render)
2. Se persistir: Manual Deploy → Clear build cache & deploy
3. Se falhar: Escalar para Render Support

### 5.2 Base de Dados Lenta

**Sintoma:** Queries > 500ms, timeouts

**Diagnóstico:**
```bash
# Verificar conexões ativas
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso   -c "SELECT count(*) FROM pg_stat_activity;"

# Verificar locks
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso   -c "SELECT * FROM pg_locks WHERE NOT granted;"
```

**Resolução:**
1. Reiniciar container PostgreSQL
2. Verificar índices: `REINDEX TABLE documents;`
3. Escalar para Render Support (se managed DB)

### 5.3 Rate Limiting Bloqueando Legítimo

**Sintoma:** Cliente reporta 429 Too Many Requests

**Diagnóstico:**
```bash
# Verificar headers
curl -i https://txeka-ntiyiso-api.onrender.com/api/v1/verify/abc123
# X-RateLimit-Remaining: 0
```

**Resolução:**
1. Verificar se IP está em whitelist
2. Ajustar limites temporariamente (se ataque DDoS confirmado)
3. Implementar CDN (Cloudflare)

### 5.4 Documento Não Encontrado (404)

**Sintoma:** Verificação retorna `INVALID` para documento conhecido

**Diagnóstico:**
```bash
# Verificar no banco
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso   -c "SELECT status, created_at FROM documents WHERE doc_hash = 'abc123';"
```

**Causas:**
- Documento nunca foi emitido (hash incorreto)
- Documento foi revogado
- Base de dados corrompida (restaurar backup)

### 5.5 JWT Token Expirado

**Sintoma:** 401 Unauthorized em todas as requests

**Diagnóstico:**
```bash
# Verificar token
python3 -c "
import jwt, time
token = 'eyJ...'
decoded = jwt.decode(token, options={'verify_signature': False})
print('Exp:', decoded['exp'])
print('Now:', int(time.time()))
"
```

**Resolução:**
1. Fazer login novamente para obter novo token
2. Verificar `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 60 minutos)

### 5.6 Falha na Emissão em Bulk

**Sintoma:** `POST /api/v1/certify/bulk` retorna erro parcial

**Diagnóstico:**
```bash
# Verificar logs
docker-compose logs -f api | grep "bulk_certify"

# Verificar créditos
curl -s https://txeka-ntiyiso-api.onrender.com/api/v1/institutions/me/credits   -H "Authorization: Bearer $TOKEN" | jq
```

**Causas comuns:**
- Créditos insuficientes
- Ficheiro ZIP corrompido
- Timeout (ficheiros muito grandes)

### 5.7 Alembic Migration Falhou

**Sintoma:** Deploy falha com erro de migration

**Diagnóstico:**
```bash
# Verificar estado atual
poetry run alembic current

# Verificar histórico
poetry run alembic history --verbose
```

**Resolução:**
```bash
# Opção 1: Forçar stamp (se migration já aplicada manualmente)
poetry run alembic stamp head

# Opção 2: Rollback e reapply
poetry run alembic downgrade -1
poetry run alembic upgrade head

# Opção 3: Recriar do zero (PERDE DADOS — apenas dev)
docker-compose down -v
docker-compose up --build
```

---

## 6. Procedimentos de Emergência

### 6.1 Revogação Massiva de Documentos

**Cenário:** Instituição reporta fraude em lote

```bash
# 1. Listar documentos da instituição
curl -s "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/logs?institution_id=INAGE&action=EMIT"   -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 2. Revogar documento específico
curl -X POST https://txeka-ntiyiso-api.onrender.com/api/v1/emissions/DOC-123/revoke   -H "Authorization: Bearer $ADMIN_TOKEN"   -H "Content-Type: application/json"   -d '{"reason": "Fraudulento — investigação interna"}'

# 3. Verificar revogação
curl -s https://txeka-ntiyiso-api.onrender.com/api/v1/verify/DOC-123
```

### 6.2 Breach de Segurança

**Cenário:** Suspeita de acesso não autorizado

```bash
# 1. Isolar: Revogar todos os tokens JWT ativos
# (Alterar JWT_SECRET_KEY no Render Dashboard)

# 2. Preservar: Exportar logs dos últimos 7 dias
curl -s "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/logs?limit=10000"   -H "Authorization: Bearer $ADMIN_TOKEN" > breach_evidence_$(date +%Y%m%d).json

# 3. Analisar: Identificar IPs suspeitos
cat breach_evidence_*.json | jq -r '.[] | select(.ip_address) | .ip_address' | sort | uniq -c | sort -rn | head -20

# 4. Notificar: geral.txekantiyiso@gmail.com + INTIC + BdM

# 5. Remediar: Rotação de todas as credenciais

# 6. Relatório: Documentar timeline e medidas
```

### 6.3 DoS / DDoS

**Cenário:** API sob ataque de tráfego massivo

```bash
# 1. Verificar padrão de ataque
docker-compose logs -f api | grep "429"

# 2. Ativar rate limiting agressivo (ajustar no código se necessário)

# 3. Bloquear IPs maliciosos no firewall
sudo ufw deny from 192.168.1.100

# 4. Escalar: Render.com / ISP / INTIC

# 5. Mitigar: Ativar Cloudflare ou similar
```

---

## 7. Comandos Úteis

### 7.1 Docker

```bash
# Estado dos serviços
docker-compose ps

# Logs em tempo real
docker-compose logs -f api

# Entrar no container
docker exec -it txeka-ntiyiso-api /bin/sh

# Reiniciar serviço
docker-compose restart api

# Limpar tudo (CUIDADO)
docker-compose down -v
```

### 7.2 PostgreSQL

```bash
# Aceder à base de dados
docker exec -it txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# Queries úteis
SELECT COUNT(*) FROM documents;
SELECT COUNT(*) FROM audit_logs;
SELECT COUNT(*) FROM institutions;
SELECT status, COUNT(*) FROM documents GROUP BY status;
SELECT institution_id, COUNT(*) FROM documents GROUP BY institution_id;

# Verificar tamanho das tabelas
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 7.3 Alembic

```bash
cd api-gateway

# Estado atual
poetry run alembic current

# Histórico
poetry run alembic history --verbose

# Criar migration
poetry run alembic revision --autogenerate -m "descricao"

# Aplicar
poetry run alembic upgrade head

# Rollback
poetry run alembic downgrade -1
```

### 7.4 Testes

```bash
# Executar todos os testes
poetry run pytest

# Com cobertura
poetry run pytest --cov=src --cov-report=term-missing

# Testes específicos
poetry run pytest tests/test_core_hashing.py -v
poetry run pytest tests/test_core_security.py -v
```

---

## 8. Contactos de Escalamento

| Nível | Situação | Contacto | Tempo de Resposta |
|-------|----------|----------|------------------|
| 1 | Problema rotineiro | geral.txekantiyiso@gmail.com | 24h |
| 2 | Indisponibilidade parcial | Render Support (dashboard) | 2-4h |
| 3 | Breach de segurança | geral.txekantiyiso@gmail.com + INTIC | Imediato |
| 4 | Falha total do sistema | Render Support + geral.txekantiyiso@gmail.com | Imediato |

---

## 9. Documentação Relacionada

- [README.md](../README.md) — Apresentação do projeto
- [Arquitetura Técnica](ARCHITECTURE.md) — Stack, schema e decisões técnicas
- [Guia de Deploy](DEPLOYMENT.md) — Docker, pipeline CI/CD e infraestrutura
- [API Reference](../guides/API_REFERENCE.md) — Contrato completo da API REST
- [Políticas de Segurança Cibernética](../legal/SECURITY.md) — Threat model e segurança
- [Dossiê de Conformidade Legal](../legal/COMPLIANCE.md) — Enquadramento jurídico completo

---

*Documento elaborado em alinhamento com a Lei n.º 3/2017, Decreto n.º 59/2019 e Resolução n.º 69/2021 (PENSC) da República de Moçambique.*
*Versão 2.0.0 — Julho 2026*
