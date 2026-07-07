# Runbook de Operações — Txeka Ntiyiso

**Infraestrutura tecnológica nacional de verificação da integridade e autenticidade documental**

**Procedimentos Operacionais, Troubleshooting e Resposta a Incidentes**

Baseado em testes reais de produção | Última atualização: 07/07/2026

---

## Índice

1. [Checklist Diário](#checklist-diário)
2. [Checklist Semanal](#checklist-semanal)
3. [Checklist Mensal](#checklist-mensal)
4. [Procedimentos Comuns](#procedimentos-comuns)
5. [Troubleshooting](#troubleshooting)
6. [Manutenção Programada](#manutenção-programada)
7. [Resposta a Incidentes](#resposta-a-incidentes)
8. [Contactos de Emergência](#contactos-de-emergência)
9. [Comandos de Referência Rápida](#comandos-de-referência-rápida)

---

## Checklist Diário

### Verificação de Saúde (5 minutos)

Execute no terminal ou via script automatizado:

```bash
#!/bin/bash
# /opt/txeka/scripts/daily-health-check.sh

echo "=== Txeka Ntiyiso — Health Check Diário ==="
echo "Data: $(date)"
echo ""

# 1. Health check da API
echo "[1/6] Verificando API..."
HEALTH=$(curl -s https://txeka-ntiyiso-api.onrender.com/health)
echo "  Status: $(echo $HEALTH | jq -r '.status')"
echo "  Versão: $(echo $HEALTH | jq -r '.version')"
echo "  Ambiente: $(echo $HEALTH | jq -r '.environment')"
echo "  Timezone: $(echo $HEALTH | jq -r '.timezone')"
echo ""

# 2. Status dos containers (Produção Nacional)
echo "[2/6] Containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 3. Logs recentes (últimas 24h)
echo "[3/6] Logs recentes..."
docker logs --since 24h txeka-ntiyiso-api 2>&1 | grep -i "error\|critical" | tail -5
echo ""

# 4. Verificação de backup
echo "[4/6] Backup..."
if [ -f "/var/backups/txeka/db_$(date +%Y%m%d)*.sql.gz" ]; then
    echo "  ✅ Backup de hoje encontrado"
else
    echo "  ⚠️  Backup de hoje NÃO encontrado"
fi
echo ""

# 5. Espaço em disco
echo "[5/6] Espaço em disco..."
df -h | grep -E "(Filesystem|/dev/)"
echo ""

# 6. Verificação de créditos ativos (Fase 2)
echo "[6/6] Créditos de instituições..."
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT institution_id, credits, credits_used,
       (credits - credits_used) as credits_remaining
FROM institutions
WHERE is_active = TRUE
ORDER BY credits_remaining ASC
LIMIT 5;
"
echo ""

echo "=== Health Check Concluído ==="
```

> **Nota sobre timezone:** O health check retorna `timezone: "CAT"` (Central Africa Time, UTC+2). Todos os timestamps da API e logs de auditoria usam este timezone. O container está configurado com `TZ=Africa/Maputo`.

### Indicadores Esperados

| Métrica | Valor Esperado | Ação se Fora do Esperado |
|---------|---------------|--------------------------|
| Health status | `online` | Investigar imediatamente |
| Containers | `txeka-ntiyiso-api` + `txeka-ntiyiso-db` = `Up` | `docker-compose restart` |
| Timezone | `CAT` (UTC+2) | Verificar configuração do container (`echo $TZ`) |
| Latência média | < 100ms | Verificar carga do sistema |
| Taxa de erro | < 0.1% | Analisar logs de erro |
| Espaço em disco | > 20% livre | Limpar logs/backups antigos |
| Backup | Arquivo existe | Executar backup manual |
| Créditos instituições | > 0 para ativas | Notificar admin para recarga |

### Verificação de Backup (Produção Nacional)

```bash
# Verificar último backup
ls -la /var/backups/txeka/ | tail -5

# Verificar integridade do backup mais recente
LATEST=$(ls -t /var/backups/txeka/*.sql.gz | head -1)
gunzip -t "$LATEST" && echo "✅ Backup íntegro" || echo "❌ Backup corrompido"

# Verificar tamanho (deve ser > 1MB para bases não vazias)
SIZE=$(stat -c%s "$LATEST")
if [ $SIZE -gt 1048576 ]; then
    echo "✅ Tamanho adequado: $(numfmt --to=iec $SIZE)"
else
    echo "⚠️  Tamanho suspeito: $(numfmt --to=iec $SIZE)"
fi
```

---

## Checklist Semanal

### Manutenção Preventiva (30 minutos)

- Revisar logs de erro da semana (`docker logs txeka-ntiyiso-api 2>&1 | grep -i error`)
- Verificar tentativas de acesso não autorizado (`grep 401 /var/log/nginx/access.log`)
- Analisar padrões de rate limiting (`grep 429 /var/log/nginx/access.log`)
- Verificar certificado SSL (expiração < 30 dias?)
- Testar restore de backup em ambiente de staging
- Revisar métricas de performance (latência P95, P99)
- Verificar espaço em disco de todos os volumes
- Atualizar dependências de segurança (`pip audit`)
- **Revisar consumo de créditos por instituição (Fase 2)**

### Comandos Semanais

```bash
# Revisar erros
docker logs txeka-ntiyiso-api 2>&1 | grep -i "error\|exception\|traceback" | tail -20

# Verificar acessos suspeitos
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# Verificar expiração do certificado SSL
openssl x509 -in /etc/nginx/ssl/txeka.crt -noout -dates

# Testar restore (staging)
LATEST=$(ls -t /var/backups/txeka/*.sql.gz | head -1)
gunzip < "$LATEST" | docker exec -i txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# Audit de dependências (dentro do container)
docker exec txeka-ntiyiso-api sh -c "pip install pip-audit && pip-audit"

# Revisar créditos (Fase 2)
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT institution_id, credits, credits_used,
       (credits - credits_used) as remaining,
       CASE WHEN (credits - credits_used) < 10 THEN '⚠️ RECARREGAR' ELSE '✅ OK' END as status
FROM institutions
WHERE is_active = TRUE
ORDER BY remaining ASC;
"
```

---

## Checklist Mensal

### Manutenção Profunda (2 horas)

- Executar `VACUUM ANALYZE` na base de dados PostgreSQL
- Reindexar tabelas críticas (`REINDEX TABLE documents; REINDEX TABLE audit_logs; REINDEX TABLE institutions;`)
- Revisar e atualizar firewall rules (`ufw status verbose`)
- Rotação de `JWT_SECRET_KEY` (se trimestral, verificar calendário)
- Revisão de acessos: remover utilizadores inativos > 90 dias
- Teste completo de disaster recovery (RTO 4h, RPO 15min)
- Revisar documentação de runbook (atualizar procedimentos)
- Reunião de revisão de incidentes do mês
- **Auditar transações de créditos (Fase 2)**
- **Verificar isolamento multi-tenant (Fase 2)**

### Comandos Mensais

```bash
# Manutenção PostgreSQL
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "VACUUM ANALYZE;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE documents;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE audit_logs;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE institutions;"

# Verificar fragmentação
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
       pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size
FROM pg_tables
WHERE schemaname='public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Revisar utilizadores inativos
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT email, last_login, NOW() - last_login AS inactive_for
FROM users
WHERE last_login < NOW() - INTERVAL '90 days'
ORDER BY last_login;
"

# Auditar créditos (Fase 2)
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT ct.institution_id, i.name,
       SUM(CASE WHEN ct.type = 'purchase' THEN ct.amount ELSE 0 END) as total_purchased,
       SUM(CASE WHEN ct.type = 'consumption' THEN ct.amount ELSE 0 END) as total_consumed,
       i.credits as current_balance
FROM credit_transactions ct
JOIN institutions i ON ct.institution_id = i.institution_id
WHERE ct.created_at > NOW() - INTERVAL '30 days'
GROUP BY ct.institution_id, i.name, i.credits
ORDER BY total_consumed DESC;
"

# Verificar isolamento multi-tenant (Fase 2)
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT institution_id, COUNT(*) as doc_count
FROM documents
GROUP BY institution_id
ORDER BY doc_count DESC
LIMIT 10;
"
```

---

## Procedimentos Comuns

### Reiniciar Serviço API

**Produção Cloud (Render.com):**

1. Aceder ao [Dashboard do Render](https://dashboard.render.com)
2. Selecionar serviço `txeka-ntiyiso-api`
3. Clicar Manual Deploy (para novo deploy) ou Restart (para reinício)
4. Aguardar health check verde (2-3 minutos)

**Produção Nacional (Docker):**

```bash
cd /opt/txeka-ntiyiso

# Reiniciar apenas API
docker-compose restart api

# Verificar logs
docker-compose logs -f api --tail=50

# Verificar health check (aguardar 30s)
sleep 30
curl -f https://txeka-ntiyiso-api.onrender.com/health
```

### Escalar Base de Dados

**Supabase (Cloud):**

1. Dashboard Supabase → Database → Settings
2. Ajustar Max Connections conforme carga (default: 100)
3. Monitorizar Active Connections no painel
4. Considerar upgrade de plano se > 80% consistente

**PostgreSQL (Nacional — Docker):**

```bash
# Verificar conexões ativas
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
"

# Verificar conexões totais
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT count(*) as total_connections
FROM pg_stat_activity;
"

# Ajustar max_connections (requer restart)
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "ALTER SYSTEM SET max_connections = 200;"
docker-compose restart db

# Verificar após restart
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SHOW max_connections;"
```

### Gerir Créditos de Instituições (Fase 2)

**Consultar saldo:**
```bash
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT institution_id, name, credits, credits_used,
       (credits - credits_used) as remaining
FROM institutions
WHERE institution_id = 'INAGE';
"
```

**Adicionar créditos:**
```bash
# 1. Atualizar saldo
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
UPDATE institutions
SET credits = credits + 1000
WHERE institution_id = 'INAGE';
"

# 2. Registar transação
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
INSERT INTO credit_transactions (institution_id, amount, type, description)
VALUES ('INAGE', 1000, 'purchase', 'Recarga manual — Ordem #2026-07-001');
"

# 3. Notificar instituição
# Email: tech@txeka.co.mz
# Assunto: [Txeka Ntiyiso] Créditos adicionados — INAGE
```

### Rotação de Segredos

**JWT Secret Key:**

```bash
# 1. Gerar nova chave
NEW_KEY=$(openssl rand -hex 32)
echo "Nova chave: $NEW_KEY"

# 2. Backup da chave anterior
cp .env .env.backup.$(date +%Y%m%d)

# 3. Atualizar variável de ambiente
sed -i "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$NEW_KEY/" .env

# 4. Reiniciar serviço
docker-compose up -d --force-recreate api

# 5. Notificar institções (todos os tokens ativos serão invalidados)
# Enviar email: tech@txeka.co.mz
# Assunto: [MANUTENÇÃO] Rotação de credenciais — re-login necessário

# 6. Verificar
curl -f https://txeka-ntiyiso-api.onrender.com/health
```

**Rotação de API Keys (Instituições):**

```bash
# 1. Listar API keys ativas
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT institution_id, api_key_created_at, last_login
FROM institutions
WHERE is_active = true;
"

# 2. Gerar nova key para instituição específica
NEW_KEY=$(openssl rand -hex 32)
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
UPDATE institutions
SET api_key = '$NEW_KEY',
    api_key_created_at = NOW()
WHERE institution_id = 'INAGE';
"

# 3. Enviar nova key por canal seguro (email cifrado ou SMS)
# NUNCA por email não cifrado
```

---

## Troubleshooting

### Erro 502 Bad Gateway

**Sintoma:** API não responde, Nginx retorna 502.

**Diagnóstico:**

```bash
# Verificar se containers estão running
docker ps | grep txeka-ntiyiso

# Verificar logs do API (últimos 100 linhas)
docker logs txeka-ntiyiso-api --tail=100

# Verificar se porta 8000 está a escutar
docker exec txeka-ntiyiso-api netstat -tlnp | grep 8000

# Verificar se processo uvicorn está ativo
docker exec txeka-ntiyiso-api ps aux | grep uvicorn

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

**Resolução:**

```bash
# Caso 1: Container parado
docker-compose up -d api

# Caso 2: Erro de dependência (DB não pronta)
docker-compose restart

# Caso 3: Memória insuficiente (OOM)
docker system prune -f  # Limpar caches
docker-compose up -d --force-recreate api

# Caso 4: Porta em conflito
sudo lsof -i :8000  # Verificar processo a usar porta
sudo kill -9 <PID>   # Matar processo (se necessário)

# Caso 5: Nginx
cd /opt/txeka-ntiyiso && docker-compose restart api
sudo systemctl restart nginx
```

### Base de Dados Lenta

**Sintoma:** Queries demoram > 500ms, timeout em verificações.

**Diagnóstico:**

```bash
# Verificar queries lentas (> 100ms)
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
"

# Verificar índices existentes
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "\di"

# Verificar espaço em disco
docker exec txeka-ntiyiso-db df -h /var/lib/postgresql/data

# Verificar locks ativos
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT pid, state, query_start, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
"
```

**Resolução:**

```bash
# Reindexar tabelas críticas
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE documents;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE audit_logs;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE institutions;"

# Vacuum (manutenção PostgreSQL)
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "VACUUM ANALYZE;"

# Se disco cheio: expandir volume ou arquivar logs antigos
find /var/lib/docker/volumes/txeka-logs/_data -name "*.log" -mtime +30 -delete
find /var/backups/txeka -name "*.sql.gz" -mtime +30 -delete

# Se locks persistentes: cancelar query
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT pg_cancel_backend(<pid>);"
```

### Erro 429 Rate Limit Exceeded

**Sintoma:** Clientes reportam "Too Many Requests".

**Diagnóstico:**

```bash
# Verificar logs de rate limiting
docker logs txeka-ntiyiso-api 2>&1 | grep "429" | tail -20

# Identificar IPs com maior volume
docker logs txeka-ntiyiso-api 2>&1 | grep "VERIFY" | \
  awk '{print $NF}' | sort | uniq -c | sort -nr | head -10

# Verificar padrão temporal (ataque DDoS?)
docker logs txeka-ntiyiso-api 2>&1 | grep "429" | \
  awk '{print $1}' | cut -d'T' -f2 | cut -d':' -f1,2 | sort | uniq -c
```

**Resolução:**

```bash
# Caso 1: Cliente legítimo excedeu limite
# Ajustar limites temporariamente no .env
# RATE_LIMIT_REQUESTS=2000
# docker-compose restart api

# Caso 2: Ataque DDoS
# Bloquear IP no firewall
sudo ufw deny from 192.0.2.100

# Caso 3: Configuração muito restritiva
# Editar configuração slowapi no código
# Redeploy com limites ajustados
```

### JWT Token Expirado

**Sintoma:** Respostas 401 com "Token has expired".

**Resolução:**

```bash
# Gerar novo token para instituição afetada
curl -X POST https://txeka-ntiyiso-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@inage.gov.mz", "password": "senha_segura"}'

# Enviar novo token por canal seguro:
# - Email cifrado (PGP)
# - SMS (para password temporária)
# - Portal seguro (dashboard institucional)
# NUNCA por email não cifrado
```

### Disco Cheio

**Sintoma:** Erros de escrita, serviços a falhar, health check falha.

**Diagnóstico:**

```bash
# Verificar uso de disco
df -h

# Verificar tamanho dos volumes Docker
docker system df -v

# Verificar tamanho dos logs
du -sh /var/lib/docker/volumes/txeka-logs/_data/*

# Verificar tamanho dos backups
du -sh /var/backups/txeka/*
```

**Resolução:**

```bash
# Limpar logs antigos (> 30 dias)
find /var/lib/docker/volumes/txeka-logs/_data -name "*.log" -mtime +30 -delete

# Limpar backups antigos (> 30 dias)
find /var/backups/txeka -name "*.sql.gz" -mtime +30 -delete

# Limpar Docker dangling images
docker image prune -f

# Limpar Docker volumes não utilizados
docker volume prune -f

# Limpar Docker containers parados
docker container prune -f

# Se ainda cheio: expandir volume (se VM/cloud)
# Ou adicionar disco adicional
```

### PostgreSQL Corrompido

**Sintoma:** Erros de integridade, queries falham, dados inconsistentes.

**Diagnóstico:**

```bash
# Verificar integridade da base de dados
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "CHECKPOINT;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT pg_database.datname, pg_database_size(pg_database.datname)
FROM pg_database WHERE datname = 'txeka_ntiyiso';
"

# Verificar logs PostgreSQL
docker logs txeka-ntiyiso-db --tail=100
```

**Resolução:**

```bash
# Caso 1: Corrupção leve (índice danificado)
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX DATABASE txeka_ntiyiso;"

# Caso 2: Corrupção grave (restauração necessária)
# 1. Parar API
docker-compose stop api

# 2. Restaurar do backup mais recente válido
LATEST=$(ls -t /var/backups/txeka/db_*.sql.gz | head -1)
gunzip < "$LATEST" | docker exec -i txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# 3. Verificar integridade pós-restore
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT COUNT(*) FROM documents;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT COUNT(*) FROM audit_logs;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT COUNT(*) FROM institutions;"

# 4. Iniciar API
docker-compose up -d api
```

### Parsing de Audit Logs — `details` como String JSON

**Sintoma:** Scripts de análise de logs falham ao aceder `details` como objeto.

**Contexto:** Nos testes reais de produção, o campo `details` nos logs de auditoria é uma **string JSON serializada** (não um objeto). Isto significa que `log.details` é uma string que precisa de ser parseada com `JSON.parse()` ou equivalente.

**Exemplo de erro:**

```python
# ❌ ERRADO — details é string, não dict
for log in logs["logs"]:
    print(log["details"]["doc_id"])  # TypeError: string indices must be integers
```

**Resolução:**

```python
# ✅ CORRETO — parsear details como string JSON
import json

for log in logs["logs"]:
    details = json.loads(log["details"])
    print(f"Doc ID: {details.get('doc_id')}")
    print(f"Document Type: {details.get('document_type')}")
```

```bash
# Usando jq na linha de comando
curl "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/logs?limit=50" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.logs[] | {action: .action, user: .user_email, doc_id: (.details | fromjson | .doc_id)}'
```

> **Nota:** Este comportamento aplica-se a **TODOS** os endpoints de auditoria: `GET /audit/logs`, `GET /audit/document/{hash}/history`, e futuramente `GET /audit/stats`.

---

## Manutenção Programada

### Janela de Manutenção Oficial

| Tipo | Frequência | Horário (CAT) | Duração Estimada | Impacto |
|------|-----------|---------------|------------------|---------|
| Backup | Diário | 02:00 | 5 min | Nenhum |
| Vacuum DB | Semanal | Domingo 03:00 | 15 min | Performance degradada temporária |
| Atualização de segurança | Mensal | Primeiro sábado 04:00 | 30 min | Indisponibilidade parcial |
| Rotação de segredos | Trimestral | Acordo prévio (48h) | 15 min | Re-login obrigatório |
| Upgrade de versão | Semestral | Acordo prévio (72h) | 1-2h | Indisponibilidade total |

> **Nota sobre timezone:** Todas as janelas de manutenção são em CAT (UTC+2). O container `txeka-ntiyiso-api` está configurado com `TZ=Africa/Maputo`, garantindo que todos os logs e timestamps da API estejam no timezone correto de Moçambique.

### Procedimento de Atualização de Segurança

**1. Notificar stakeholders 48h antes**
   - Email: tech@txeka.co.mz + instituições afetadas
   - Dashboard: banner de manutenção programada
   - Status page: incidente programado

**2. Criar backup manual antes da atualização**
   ```bash
   /opt/txeka/backup.sh
   ```

**3. Colocar modo manutenção (se aplicável)**
   ```bash
   echo '{"status": "maintenance", "until": "2026-07-07T06:00:00+02:00"}' > /tmp/maintenance.json
   ```

**4. Executar atualização**
   ```bash
   cd /opt/txeka-ntiyiso
   git fetch origin
   git checkout <nova_versao_tag>
   docker-compose build --no-cache api
   docker-compose up -d api
   ```

**5. Verificar health check (aguardar 2 minutos)**
   ```bash
   sleep 120
   curl -f https://txeka-ntiyiso-api.onrender.com/health
   ```

**6. Executar smoke tests**

   ```bash
   # Teste 1: Emissão
   curl -X POST https://txeka-ntiyiso-api.onrender.com/api/v1/certify \
        -H "Authorization: Bearer $TOKEN" \
        -F "file=@test.pdf" -F "document_type=TEST" -F "institution_id=TXEKA"
   # Esperado: {"success": true, "data": {...}}

   # Teste 2: Verificação
   curl https://txeka-ntiyiso-api.onrender.com/api/v1/verify/<hash>
   # Esperado: {"success": true, "status": "VALID", "data": {...}}

   # Teste 3: Revogação
   curl -X POST https://txeka-ntiyiso-api.onrender.com/api/v1/emissions/<doc_id>/revoke \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"reason": "Teste pós-manutenção"}'
   # Esperado: {"success": true, "status": "revoked", ...}

   # Teste 4: Auditoria (details é string JSON)
   curl "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/logs?limit=5" \
        -H "Authorization: Bearer $ADMIN_TOKEN"
   # Esperado: {"success": true, "count": 5, "logs": [{..., "details": "{\"...\"}"}]}

   # Teste 5: Dashboard institucional (Fase 2)
   curl https://txeka-ntiyiso-api.onrender.com/api/v1/institutions/me/dashboard \
        -H "Authorization: Bearer $TOKEN"
   # Esperado: {"success": true, "credits": ..., "documents": ..., ...}
   ```

**7. Notificar conclusão**
   - Email: "Manutenção concluída com sucesso"
   - Remover banner de manutenção
   - Atualizar status page

---

## Resposta a Incidentes

### Classificação de Severidade

| Nível | Descrição | Exemplo | Tempo de Resposta | Escalation |
|-------|-----------|---------|-------------------|------------|
| P1-Crítico | Sistema inacessível, todos os serviços down | Render offline, DB corrompido, ataque DDoS massivo | 15 minutos | CTO + Clientes + INTIC |
| P2-Alto | Funcionalidade core degradada | Verificações > 5s, taxa de erro > 5%, latência anómala | 1 hora | Tech Lead |
| P3-Médio | Funcionalidade não-core afetada | Dashboard lento, relatórios indisponíveis, backup falhou | 4 horas | DevOps |
| P4-Baixo | Questões cosméticas ou documentação | Erro de ortografia, badge desatualizado, typo em email | 24 horas | Backlog |

### Playbook P1: Sistema Inacessível

```
T+0min    ALERTA: Health check falha 3x consecutivas
          → PagerDuty dispara
          → SMS para on-call engineer

T+2min    DIAGNÓSTICO RÁPIDO:
          → Verificar status Render.com / servidores físicos
          → Verificar containers: docker ps | grep txeka-ntiyiso
          → Verificar logs de sistema (dmesg, syslog)

T+5min    AÇÃO IMEDIATA:
          Se Cloud: Abrir ticket crítico no Render (Priority: Critical)
          Se Nacional: Verificar energia (UPS, gerador), rede (switch, router)

T+10min   TENTATIVA DE RECUPERAÇÃO:
          → Restart manual: docker-compose restart api db
          → Se DB corrompido: iniciar restore do backup mais recente

T+15min   COMUNICAÇÃO DE CRISE:
          → Email instituições afetadas (template predefinido)
          → Atualizar status page (https://status.txeka.co.mz)
          → Notificar INTIC (se infraestrutura crítica)
          → Escalar para CTO

T+30min   SE PERSISTIR:
          → Ativar plano de contingência (ambiente híbrido/cloud)
          → Redirecionar tráfego para instância de backup
          → Iniciar post-mortem em paralelo

T+60min   PÓS-RESOLUÇÃO:
          → Verificar integridade de todos os dados
          → Executar smoke tests completos
          → Publicar relatório de incidente
          → Agendar post-mortem (24h)
```

### Playbook P2: Degradação de Performance

```
T+0min    ALERTA: Latência P95 > 500ms OU taxa de erro > 1%
          → Grafana alerta
          → Slack #alerts

T+5min    DIAGNÓSTICO:
          → Verificar métricas: CPU, RAM, conexões DB, I/O disco
          → docker stats --no-stream
          → Verificar logs de erro recentes
          → Identificar padrão (hora do dia, endpoint específico)

T+10min   AÇÃO:
          Se DB: REINDEX + VACUUM
          Se API: docker-compose restart api
          Se Rede: Verificar latência para Supabase/DB

T+15min   SE PERSISTIR:
          → Escalar horizontal (mais workers uvicorn)
          → Escala vertical (mais RAM/CPU no docker-compose.yml)
          → Ativar cache Redis

T+30min   SE NÃO RESOLVIDO:
          → Escalar para equipa de engenharia
          → Considerar modo degradação (desativar features não-core)

T+60min   PÓS-RESOLUÇÃO:
          → Documentar causa raiz
          → Ajustar alertas (thresholds mais sensíveis)
          → Revisar capacity planning
```

### Playbook: Documento Fraudulento Detectado

```
T+0min    DETEÇÃO: Denúncia ou análise automática detecta documento fraudulento

T+5min    CONFIRMAÇÃO:
          → Verificar hash do documento suspeito
          → Comparar com original (se disponível)
          → Analisar logs de emissão (quem, quando, de onde)

T+10min   REVOGAÇÃO IMEDIATA:
          POST /api/v1/emissions/{doc_id}/revoke
          {
            "reason": "Documento fraudulento detectado em auditoria interna. "
                      "Referência: Ticket #2026-07-001"
          }

T+15min   NOTIFICAÇÃO:
          → Email instituição emissora (alerta de segurança)
          → Email entidades que verificaram o documento (se identificadas)
          → Notificar Tribunal de Contas (se governo)

T+30min   PRESERVAÇÃO DE EVIDÊNCIAS:
          → Exportar logs forenses dos últimos 90 dias
          → Gerar relatório de auditoria do documento
          → Arquivar hash e metadados (imutáveis por lei)

T+60min   INVESTIGAÇÃO:
          → Analisar padrão: outros documentos do mesmo emissor?
          → Verificar IPs de emissão (localização geográfica)
          → Cruzar com base de dados de documentos revogados

T+24h     RELATÓRIO:
          → Documentar incidente completo
          → Lições aprendidas
          → Medidas preventivas (ajustar validação, reforçar controlo)
```

### Playbook: Suspeita de Breach de Segurança

```
T+0min    DETEÇÃO: Logs anómalos, acessos não autorizados, alertas de IDS

T+1min    ISOLAMENTO:
          → Revogar TODOS os tokens JWT ativos (forçar re-login global)
          → Desativar API keys comprometidas
          → Isolar servidores afetados da rede

T+5min    PRESERVAÇÃO:
          → Exportar logs dos últimos 7 dias (imutáveis)
          → Criar snapshot dos volumes Docker
          → Preservar memória RAM (dump, se possível)

T+10min   ANÁLISE:
          → Identificar vetor de ataque (SQLi, XSS, brute-force, insider?)
          → Identificar IPs envolvidos
          → Determinar dados potencialmente afetados (hashes apenas?)

T+30min   NOTIFICAÇÃO:
          → security@txeka.co.mz
          → INTIC (se infraestrutura crítica de informação)
          → Banco de Moçambique (se sector financeiro afetado)
          → Procuradoria (se dados de cidadãos comprometidos)

T+60min   REMEDIAÇÃO:
          → Aplicar patch de segurança
          → Rotação de TODAS as credenciais (DB, JWT, API keys, SSL)
          → Reforço de regras de firewall (block IPs maliciosos)
          → Aumento de rate limiting
          → Ativar 2FA obrigatório para todos os admins

T+24h     RELATÓRIO:
          → Documentar incidente completo
          → Timeline detalhada
          → Dados afetados (hashes são públicos por design, zero risco)
          → Medidas preventivas implementadas
          → Recomendações para futuro
```

### Playbook: Negação de Serviço (DoS/DDoS)

```
T+0min    DETEÇÃO: Latência anómala, spike de requisições (> 500% da média)

T+2min    ATIVAÇÃO DE DEFESAS:
          → Ativar rate limiting agressivo (nginx)
          → Ativar fail2ban (block IPs com padrão anómalo)
          → Ativar modo "under attack" (cloudflare, se disponível)

T+5min    IDENTIFICAÇÃO:
          → Analisar padrão de ataque (IPs, user-agents, endpoints alvo)
          → docker logs txeka-ntiyiso-api 2>&1 | grep "429"
          → Identificar tipo: volumétrico, protocolo, aplicação
          → Verificar origem geográfica

T+10min   MITIGAÇÃO:
          → Bloquear IPs maliciosos no firewall
          sudo ufw deny from <IP>
          → Redirecionar tráfego legítimo (BGP anycast, se disponível)
          → Ativar WAF rules (cloudflare)

T+15min   ESCALAÇÃO:
          → Contactar ISP upstream (se ataque volumétrico)
          → Contactar Render.com (se cloud)
          → Contactar INTIC (se infraestrutura crítica)

T+30min   SE PERSISTIR:
          → Considerar ativar modo "manutenção" (página estática)
          → Redirecionar para CDN
          → Escalar para cloud DDoS protection (AWS Shield, Cloudflare)

T+60min   PÓS-RESOLUÇÃO:
          → Análise forense do ataque
          → Ajuste de regras de proteção
          → Revisão de capacity planning
          → Documentação de lições aprendidas
```

---

## Contactos de Emergência

### Equipa Txeka Ntiyiso

| Função | Nome | Contacto | Disponibilidade | Escalation |
|--------|------|----------|-----------------|------------|
| On-call Engineer | Rotativo | +258 84 XXX XXXX | 24/7 | P1, P2 |
| Tech Lead | A definir | tech@txeka.co.mz | 24/7 (escalação) | P1, P2 não resolvido |
| Security Officer | A definir | security@txeka.co.mz | 24/7 (incidentes) | Breach, P1 segurança |
| CTO | A definir | cto@txeka.co.mz | Business hours | P1 não resolvido em 1h |

### Parceiros e Fornecedores

| Entidade | Contacto | Uso |
|----------|----------|-----|
| Render.com Support | support@render.com | Cloud hosting, deploy issues |
| Supabase Support | support@supabase.com | Database, PostgreSQL issues |
| INTIC | info@intic.gov.mz | Regulador, infraestruturas críticas |
| Tribunal de Contas | geral@tcontas.gov.mz | Auditoria, conformidade |
| Banco de Moçambique | info@bancomoc.mz | Sector financeiro, conformidade transacional |
| ISP Nacional | A definir | Conectividade, DDoS mitigation |

### Canais de Comunicação de Crise

| Canal | Uso | Acesso |
|-------|-----|--------|
| Email | Notificações formais, relatórios | tech@txeka.co.mz |
| Slack #incidents | Coordenação em tempo real | Equipa técnica |
| PagerDuty | Alertas críticos, on-call | On-call engineer |
| Status Page | Comunicação pública | https://status.txeka.co.mz |
| WhatsApp | Coordenação rápida (P1) | Grupo de crise |

---

## Comandos de Referência Rápida

### Docker

```bash
# Ver containers
docker ps -a

# Logs em tempo real
docker logs -f txeka-ntiyiso-api --tail=100
docker logs -f txeka-ntiyiso-db --tail=50

# Reiniciar serviço
docker-compose restart api

# Rebuild sem cache
docker-compose build --no-cache api

# Escalar (mais instâncias — futuro com Swarm/K8s)
docker-compose up -d --scale api=3

# Limpar sistema
docker system prune -f
docker volume prune -f
docker container prune -f
```

### PostgreSQL

```bash
# Aceder à base de dados
docker exec -it txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# Estatísticas da base de dados
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname='public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Conexões ativas
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT pid, usename, application_name, client_addr, state, query_start, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
"

# Queries lentas
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"

# Vacuum e reindex
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "VACUUM ANALYZE;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE documents;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE audit_logs;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "REINDEX TABLE institutions;"
```

### Backup

```bash
# Backup manual imediato
DATE=$(date +%Y%m%d_%H%M%S)
docker exec txeka-ntiyiso-db pg_dump -U postgres -d txeka_ntiyiso --clean --if-exists | \
  gzip > /var/backups/txeka/db_$DATE.sql.gz

# Verificar backup
gunzip -t /var/backups/txeka/db_*.sql.gz

# Listar backups
ls -la /var/backups/txeka/ | tail -10

# Restaurar backup
gunzip -c /var/backups/txeka/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso
```

### Sistema

```bash
# Espaço em disco
df -h
du -sh /var/lib/docker/volumes/txeka-logs/_data/*
du -sh /var/backups/txeka/*
docker system df

# Memória e CPU
free -h
top -bn1 | grep "Cpu(s)"

# Rede
netstat -tlnp
ss -tlnp
iptables -L -n

# Processos
ps aux | grep uvicorn
ps aux | grep postgres
```

### API

```bash
# Health check (verifica timezone CAT)
curl -s https://txeka-ntiyiso-api.onrender.com/health | jq .

# Estatísticas (admin) — placeholder, retorna note
curl -s https://txeka-ntiyiso-api.onrender.com/api/v1/audit/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Emitir documento
curl -X POST https://txeka-ntiyiso-api.onrender.com/api/v1/certify \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" -F "document_type=TEST" -F "institution_id=TXEKA"

# Emitir em bulk (B2B/B2G)
curl -X POST https://txeka-ntiyiso-api.onrender.com/api/v1/certify/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documents": [{"file": "base64...", "document_type": "CERT"}, ...]}'

# Verificar documento
curl https://txeka-ntiyiso-api.onrender.com/api/v1/verify/<hash>

# Verificar documento revogado
curl https://txeka-ntiyiso-api.onrender.com/api/v1/verify/<hash_revogado>

# Dashboard institucional (Fase 2)
curl https://txeka-ntiyiso-api.onrender.com/api/v1/institutions/me/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Créditos disponíveis (Fase 2)
curl https://txeka-ntiyiso-api.onrender.com/api/v1/institutions/me/credits \
  -H "Authorization: Bearer $TOKEN"

# Auditoria (details é string JSON — usar fromjson no jq)
curl "https://txeka-ntiyiso-api.onrender.com/api/v1/audit/logs?limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | \
  jq '.logs[] | {action, user: .user_email, doc_id: (.details | fromjson | .doc_id)}'
```

---

> **Txeka Ntiyiso — Runbook de Operações v2.0** 🇲🇿
> Baseado em testes reais de produção (07/07/2026) | Alinhado com Lei 3/2017, Decreto 59/2019 e Resolução 69/2021 (PENSC)
