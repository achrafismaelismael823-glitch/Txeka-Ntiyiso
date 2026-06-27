# RUNBOOK.md

## Runbook de Operações — Txeka Ntiyiso

Procedimentos operacionais, troubleshooting e resposta a incidentes para a equipa DevOps.

---

## 1. Checklist Diário (5 minutos)

```bash
#!/bin/bash
# /opt/txeka/daily-check.sh

echo "=== TXEKA NTIYISO — Checklist Diário $(date) ==="

# 1. Health Check API
curl -s https://txeka-ntiyiso-api.onrender.com/health | jq .

# 2. Status dos containers (se on-premise)
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 3. Uso de disco
df -h | grep -E "(Filesystem|/dev/)"

# 4. Logs de erro nas últimas 24h
docker logs --since 24h txeka-ntiyiso-api 2>&1 | grep -i "error\|critical" | tail -5

# 5. Conexões ativas à BD
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT count(*) FROM pg_stat_activity;"

echo "=== Checklist concluído ==="
```

| # | Item | Comando | Threshold |
|---|------|---------|-----------|
| 1 | Health Check API | `curl /health` | Status = `online` |
| 2 | Containers ativos | `docker ps` | `txeka-ntiyiso-api` + `txeka-ntiyiso-db` = `Up` |
| 3 | Uso de disco | `df -h` | < 80% |
| 4 | Erros nas últimas 24h | `docker logs --since 24h` | 0 erros críticos |
| 5 | Conexões BD | `pg_stat_activity` | < 80% do máximo |

---

## 2. Checklist Semanal (30 minutos)

| # | Item | Comando | Nota |
|---|------|---------|------|
| 1 | Backup automático | `ls -la /var/backups/txeka/` | Verificar ficheiros gerados |
| 2 | Rotação de logs | `docker system df` | Limpar se > 5GB |
| 3 | Atualizações de segurança | `apt list --upgradable` | Aplicar patches críticos |
| 4 | Certificado SSL | `echo | openssl s_client -servername api.txeka.co.mz -connect api.txeka.co.mz:443 2>/dev/null | openssl x509 -noout -dates` | Validade > 30 dias |
| 5 | Métricas de performance | `docker stats --no-stream` | CPU < 80%, MEM < 80% |
| 6 | Teste de restore | Restaurar BD de backup em ambiente de teste | Validação mensal |
| 7 | Revisão de acessos | `docker exec txeka-ntiyiso-db psql -U postgres -c "\du"` | Verificar roles |
| 8 | Documentação de incidentes | Revisar ficheiro `/var/log/txeka-incidents.log` | Atualizar se necessário |

---

## 3. Checklist Mensal (2 horas)

| # | Item | Ação |
|---|------|------|
| 1 | Manutenção PostgreSQL | `VACUUM ANALYZE` + rebuild índices |
| 2 | Revisão de firewall | `ufw status verbose` — confirmar portas |
| 3 | Teste de disaster recovery | Simular falha de servidor + restore |
| 4 | Revisão de segredos | Rotação de `SECRET_KEY` e `JWT_SECRET_KEY` |
| 5 | Atualização de imagens Docker | `docker-compose pull && docker-compose up -d` |
| 6 | Relatório de conformidade | Exportar métricas de auditoria para arquivo |
| 7 | Revisão de acessos administrativos | Confirmar lista de admins ativos |
| 8 | Teste de rate limiting | `ab -n 1000 -c 10 https://api.txeka.co.mz/health` |

---

## 4. Procedimentos Comuns

### 4.1 Reiniciar a API

```bash
# On-premise (Docker)
docker-compose restart api

# Verificar logs
docker-compose logs -f api --tail=50

# Cloud (Render)
# Dashboard → Manual Deploy → Clear build cache → Deploy
```

### 4.2 Escalar a Base de Dados

```bash
# Aumentar recursos no docker-compose.yml
# Editar: deploy.resources.limits.memory

# Aplicar mudanças
docker-compose up -d --no-deps --build db

# Verificar
docker stats txeka-ntiyiso-db
```

### 4.3 Rotação de Segredos

```bash
# 1. Gerar novos segredos
NEW_SECRET=$(openssl rand -hex 32)
NEW_JWT=$(openssl rand -hex 32)

# 2. Atualizar .env
echo "SECRET_KEY=$NEW_SECRET" >> .env
echo "JWT_SECRET_KEY=$NEW_JWT" >> .env

# 3. Reiniciar serviços
docker-compose down
docker-compose up -d

# 4. Testar autenticação
curl -H "Authorization: Bearer <novo_token>" https://api.txeka.co.mz/api/v1/audit/logs
```

### 4.4 Rotação de API Keys (Instituições)

```bash
# 1. Gerar nova key
NEW_KEY=$(openssl rand -hex 16)

# 2. Atualizar na BD
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso \
  -c "UPDATE institutions SET api_key = '$NEW_KEY' WHERE id = 'INST_ID';"

# 3. Notificar instituição
# Enviar email para admin da instituição
```

---

## 5. Troubleshooting

### 5.1 Erro 502 — Bad Gateway

**Sintoma:** `curl /health` retorna 502

**Diagnóstico:**
```bash
# Verificar se API está a correr
docker ps | grep txeka-ntiyiso-api

# Verificar logs
docker logs txeka-ntiyiso-api --tail=50

# Verificar se porta 8000 está aberta
ss -tlnp | grep 8000

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

**Resolução:**
```bash
# Reiniciar API
docker-compose restart api

# Se persistir: rebuild completo
docker-compose down
docker-compose up -d --build

# Verificar Nginx
sudo systemctl restart nginx
```

---

### 5.2 Base de Dados Lenta

**Sintoma:** Queries > 1s, timeouts

**Diagnóstico:**
```bash
# Verificar conexões ativas
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT pid, state, query_start, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY query_start;"

# Verificar locks
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE blocked_locks.pid != blocking_locks.pid;"

# Verificar tamanho das tabelas
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname='public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

**Resolução:**
```bash
# 1. VACUUM ANALYZE
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "VACUUM ANALYZE;"

# 2. Rebuild índices
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE documents;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE audit_logs;"

# 3. Se persistir: aumentar recursos no docker-compose.yml
# memory: 512M → 1G
```

---

### 5.3 Erro 429 — Too Many Requests

**Sintoma:** Rate limiting ativado

**Diagnóstico:**
```bash
# Verificar logs
docker logs txeka-ntiyiso-api --tail=100 | grep "429"

# Verificar IP bloqueado
docker logs txeka-ntiyiso-api --tail=100 | grep "rate_limit"
```

**Resolução:**
```bash
# Ajustar limites no .env (se legítimo)
RATE_LIMIT_REQUESTS=2000
RATE_LIMIT_PERIOD_SECONDS=60

# Reiniciar
docker-compose restart api

# Se ataque DDoS: bloquear IP no firewall
sudo ufw deny from 192.0.2.100
```

---

### 5.4 JWT Expirado / Token Inválido

**Sintoma:** 401 Unauthorized em endpoints protegidos

**Diagnóstico:**
```bash
# Verificar expiração do token
echo "TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq '.exp'

# Verificar se SECRET_KEY está correto
docker exec txeka-ntiyiso-api printenv | grep SECRET_KEY
```

**Resolução:**
```bash
# Gerar novo token (admin)
curl -X POST https://api.txeka.co.mz/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@txeka.co.mz","password":"SECRETO"}'

# Se SECRET_KEY mudou: todos os tokens antigos são invalidados
# Notificar utilizadores para fazerem login novamente
```

---

### 5.5 Disco Cheio

**Sintoma:** Erros de escrita, containers a falhar

**Diagnóstico:**
```bash
df -h
# Procurar ficheiros grandes
find /var/lib/docker -type f -size +100M -exec ls -lh {} \;
# Verificar logs
du -sh /var/lib/docker/containers/*
```

**Resolução:**
```bash
# 1. Limpar logs antigos
docker system prune -f
docker volume prune -f

# 2. Rotação de logs do container
docker exec txeka-ntiyiso-api sh -c "find /app/logs -name '*.log' -mtime +7 -delete"

# 3. Se persistir: aumentar disco ou mover backups para storage externo
```

---

### 5.6 PostgreSQL Corrompido

**Sintoma:** Erros "could not read block", "invalid page"

**Diagnóstico:**
```bash
# Verificar logs do DB
docker logs txeka-ntiyiso-db --tail=100

# Verificar integridade
docker exec txeka-ntiyiso-db pg_isready -U postgres
```

**Resolução:**
```bash
# 1. Parar serviços
docker-compose down

# 2. Restaurar do backup mais recente
BACKUP=$(ls -t /var/backups/txeka/db_*.sql.gz | head -1)
gunzip < $BACKUP | docker exec -i txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# 3. Verificar integridade
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT COUNT(*) FROM documents;"

# 4. Iniciar serviços
docker-compose up -d
```

---

## 6. Manutenção Programada

### 6.1 Tipos de Janela de Manutenção

| Tipo | Frequência | Duração | Impacto | Janela CAT |
|------|-----------|---------|---------|------------|
| **Leve** | Semanal | 15 min | Nenhum | Domingo 02:00–02:15 |
| **Média** | Mensal | 1 hora | Read-only | Domingo 02:00–03:00 |
| **Pesada** | Trimestral | 4 horas | Indisponível | Sábado 22:00–Domingo 02:00 |
| **Crítica** | Sob demanda | Variável | Total | Coordenado com stakeholders |
| **Emergência** | Imediata | Variável | Total | Sem aviso prévio |

### 6.2 Procedimento de Atualização

```bash
# 1. Anunciar janela de manutenção (mínimo 24h antes)
# 2. Criar backup manual
/opt/txeka/backup.sh

# 3. Modo read-only (se aplicável)
# 4. Atualizar código
git pull origin main

# 5. Rebuild e deploy
docker-compose down
docker-compose up -d --build

# 6. Verificar health check
curl -f https://api.txeka.co.mz/health

# 7. Teste de fumaça
# - Emitir documento de teste
# - Verificar documento de teste
# - Revogar documento de teste

# 8. Notificar conclusão
```

---

## 7. Playbooks de Incidente

### 7.1 P1 — Crítico (Sistema Indisponível)

**Condição:** API retorna 5xx > 5 min ou BD inacessível

**Resposta (SLA: 15 min):**

```bash
# 1. Alertar equipa (PagerDuty/Slack)
# 2. Verificar status
curl -s https://api.txeka.co.mz/health | jq

# 3. Se on-premise: verificar containers
docker ps
docker-compose ps

# 4. Se container down: reiniciar
docker-compose restart api db

# 5. Se persistir: restore do backup
/opt/txeka/restore.sh $(ls -t /var/backups/txeka/db_*.sql.gz | head -1)

# 6. Escalar para CTO se > 30 min
```

**Comunicação:**
- **0-15 min:** Interno (equipa técnica)
- **15-30 min:** Clientes B2B (email)
- **> 30 min:** Público (status page + Twitter/X)

---

### 7.2 P2 — Alto (Degradação de Serviço)

**Condição:** Latência P95 > 2s ou erro 4xx > 10%

**Resposta (SLA: 30 min):**

```bash
# 1. Verificar métricas
docker stats --no-stream

# 2. Verificar logs de erro
docker logs txeka-ntiyiso-api --tail=200 | grep -i "error"

# 3. Se CPU alto: escalar horizontal (se Kubernetes) ou vertical (aumentar recursos)
# 4. Se BD lento: VACUUM ANALYZE + verificar locks

# 5. Se ataque: ativar WAF / bloquear IPs
```

---

### 7.3 Documento Fraudulento Detectado

**Condição:** Documento verificado como suspeito/fraudulento

**Resposta:**

```bash
# 1. Revogar imediatamente
curl -X POST https://api.txeka.co.mz/api/v1/emissions/{doc_id}/revoke \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Documento fraudulento detectado"}'

# 2. Verificar logs de emissão
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT * FROM audit_logs 
WHERE resource_id = 'DOC_ID' AND action = 'EMIT';"

# 3. Notificar instituição emissora
# 4. Notificar verificadores (últimos 30 dias)
# 5. Abrir ticket interno para investigação
# 6. Notificar autoridades (se necessário)
```

---

### 7.4 Breach de Segurança

**Condição:** Acesso não autorizado, vazamento de dados, token comprometido

**Resposta:**

```bash
# 1. Isolar sistema (modo manutenção)
# 2. Rotação IMEDIATA de todos os segredos
NEW_SECRET=$(openssl rand -hex 32)
NEW_JWT=$(openssl rand -hex 32)

# 3. Invalidar todos os tokens ativos
# 4. Verificar logs de acesso
docker logs txeka-ntiyiso-api --since 24h | grep -i "unauthorized\|forbidden"

# 5. Verificar acesso à BD
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT * FROM audit_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours' 
ORDER BY timestamp DESC;"

# 6. Notificar stakeholders
# 7. Abrir investigação forense
# 8. Notificar INTIC / Tribunal de Contas (se dados governamentais)
```

---

### 7.5 DoS / DDoS

**Condição:** Requisições > 10.000/min, serviço degradado

**Resposta:**

```bash
# 1. Identificar IPs de origem
docker logs txeka-ntiyiso-api --tail=1000 | grep "rate_limit" | awk '{print $NF}' | sort | uniq -c | sort -nr | head -20

# 2. Bloquear IPs no firewall
sudo ufw deny from 192.0.2.0/24

# 3. Ativar Cloudflare (se disponível)
# 4. Aumentar rate limiting temporariamente
# 5. Escalar infraestrutura (se possível)
# 6. Notificar ISP / INTIC para mitigação na rede
```

---

## 8. Contactos de Emergência

| Função | Nome | Contacto | Disponibilidade |
|--------|------|----------|-----------------|
| **DevOps On-Call** | — | devops@txeka.co.mz | 24/7 |
| **CTO** | — | cto@txeka.co.mz | 24/7 (escalation) |
| **Render Support** | — | support@render.com | Business hours |
| **Supabase Support** | — | support@supabase.com | Business hours |
| **INTIC** | — | info@intic.gov.mz | Horário institucional |
| **Tribunal de Contas** | — | info@tribunalcontas.gov.mz | Horário institucional |
| **Banco de Moçambique** | — | info@bancomoc.mz | Horário institucional |

---

## 9. Comandos Rápidos

### Docker

```bash
# Ver todos os containers
docker ps -a

# Ver logs em tempo real
docker logs -f txeka-ntiyiso-api

# Entrar no container
docker exec -it txeka-ntiyiso-api sh

# Reiniciar serviço
docker-compose restart api

# Rebuild completo
docker-compose down && docker-compose up -d --build

# Limpar sistema
docker system prune -f && docker volume prune -f
```

### PostgreSQL

```bash
# Aceder à BD
docker exec -it txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# Backup manual
docker exec txeka-ntiyiso-db pg_dump -U postgres txeka_ntiyiso | gzip > /var/backups/txeka/manual_$(date +%Y%m%d).sql.gz

# Restore
gunzip < /var/backups/txeka/db_20260627.sql.gz | docker exec -i txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# Verificar tamanho
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT pg_size_pretty(pg_database_size('txeka_ntiyiso'));"

# VACUUM
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "VACUUM ANALYZE;"
```

### Backup

```bash
# Backup manual
/opt/txeka/backup.sh

# Listar backups
ls -lt /var/backups/txeka/

# Verificar integridade do backup
gunzip -t /var/backups/txeka/db_20260627.sql.gz
```

### Sistema

```bash
# Uso de recursos
docker stats --no-stream

# Disco
df -h

# Memória
free -h

# CPU
top

# Rede
ss -tlnp
```

### API

```bash
# Health check
curl -s https://api.txeka.co.mz/health | jq

# Verificar documento
curl -s https://api.txeka.co.mz/api/v1/verify/{hash} | jq

# Emitir documento (admin)
curl -X POST https://api.txeka.co.mz/api/v1/certify \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@documento.pdf"
```

---

*Documento gerado em conformidade com a Lei n.º 3/2017, Decreto n.º 59/2019 e Resolução n.º 69/2021 (PENSC) da República de Moçambique.*
*Versão 1.0 — Junho 2026*
