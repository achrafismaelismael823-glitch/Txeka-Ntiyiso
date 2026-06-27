# Deploy e Infraestrutura — Txeka Ntiyiso

**Guia Completo de Implantação, Operação e Soberania Digital**

---

## Índice

1. [Visão Geral de Ambientes](#visão-geral-de-ambientes)
2. [Ambiente 1: Produção Cloud](#ambiente-1-produção-cloud)
3. [Ambiente 2: Produção Nacional](#ambiente-2-produção-nacional)
4. [Ambiente 3: Híbrido](#ambiente-3-híbrido)
5. [Docker Compose (Produção Nacional)](#docker-compose-produção-nacional)
6. [Configuração SSL/TLS](#configuração-ssltls)
7. [Nginx Reverse Proxy](#nginx-reverse-proxy)
8. [Backup e Recuperação](#backup-e-recuperação)
9. [Monitoramento e Alertas](#monitoramento-e-alertas)
10. [Checklist de Deploy Nacional](#checklist-de-deploy-nacional)
11. [Roadmap de Infraestrutura](#roadmap-de-infraestrutura)

---

## Visão Geral de Ambientes

O Txeka Ntiyiso opera em três níveis de infraestrutura, concebidos para evoluir com as necessidades da instituição e as exigências de soberania digital:

| Ambiente | Hosting | Dados | Fase | Uso Principal |
|----------|---------|-------|------|---------------|
| **Produção Cloud** | Render.com + Supabase | EUA (Supabase) | Atual | Operação imediata, alta disponibilidade, validação de mercado |
| **Produção Nacional** | Docker + Servidores MZ | Moçambique | Migração futura | Soberania digital, conformidade INTIC, intranet governamental |
| **Híbrido** | Docker Edge + Cloud | Sincronizado | Futuro | Resiliência máxima, contingência offline, replicação |

> **Nota:** O ambiente **Produção Cloud** (Render.com) está atualmente em operação plena. A migração para **Produção Nacional** será conduzida em coordenação com as entidades reguladoras (INTIC, Tribunal de Contas) à medida que a legislação de proteção de dados e soberania digital for consolidada, em alinhamento com a **Resolução n.º 69/2021 (PENSC)**.

---

## Ambiente 1: Produção Cloud (Render.com + Supabase)

### Estado Atual

| Componente | URL | Estado |
|------------|-----|--------|
| API | [https://txeka-ntiyiso-api.onrender.com](https://txeka-ntiyiso-api.onrender.com) | Online |
| Health Check | [https://txeka-ntiyiso-api.onrender.com/health](https://txeka-ntiyiso-api.onrender.com/health) | Online |
| Portal | [https://txeka-ntiyiso-portal.onrender.com](https://txeka-ntiyiso-portal.onrender.com) | Online |
| Database | Supabase PostgreSQL | Online |

### Pré-requisitos para Replicação

- Conta no [Render.com](https://render.com)
- Conta no [Supabase](https://supabase.com)
- Repositório GitHub com o código-fonte
- Domínio configurado (opcional: txeka.co.mz)

### Configuração do Supabase (PostgreSQL)

1. Criar projeto no Supabase
2. Ir a **Database → Connection String**
3. Copiar a URL: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
4. Guardar como `DATABASE_URL` nas variáveis de ambiente do Render
5. Configurar **Row Level Security (RLS)** para isolamento de dados por instituição

### Configuração do Render.com

1. No Render, clicar **New → Web Service**
2. Conectar o repositório GitHub `Txeka-Ntiyiso`
3. Configurar:

| Campo | Valor |
|-------|-------|
| **Name** | `txeka-ntiyiso-api` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn src.main:app --host 0.0.0.0 --port $PORT` |

4. Adicionar variáveis de ambiente:

```env
# === DATABASE ===
DATABASE_URL=postgresql://postgres:senha_segura@db.abc123.supabase.co:5432/postgres

# === SECURITY ===
JWT_SECRET_KEY=chave_gerada_com_openssl_rand_hex_32
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

# === ENVIRONMENT ===
ENVIRONMENT=production
DEBUG=false

# === CORS ===
CORS_ORIGINS=https://txeka-ntiyiso-portal.onrender.com,https://txeka.co.mz

# === TZ ===
TZ=Africa/Maputo
```

> **Gerar JWT_SECRET_KEY:**
> ```bash
> openssl rand -hex 32
> ```

5. Clicar **Deploy**

### Verificação Pós-Deploy

```bash
curl -s https://txeka-ntiyiso-api.onrender.com/health | jq .
```

**Resposta esperada:**
```json
{
  "status": "online",
  "project": "Txeka Ntiyiso",
  "version": "1.0.0",
  "environment": "production",
  "timezone": "CAT",
  "timestamp": "2026-06-27T14:32:15+02:00"
}
```

---

## Ambiente 2: Produção Nacional (Docker On-Premise)

### Contexto Estratégico

A migração para infraestrutura nacional é estratégica para:

| Objetivo | Descrição | Base Legal |
|----------|-----------|------------|
| **Soberania digital** | Dados armazenados em território moçambicano | Resolução 69/2021 (PENSC) |
| **Conformidade futura** | Antecipação da Lei de Proteção de Dados Pessoais | Lei 3/2017, Capítulo V |
| **Resiliência** | Funcionamento independente de conectividade internacional | Decreto 59/2019 |
| **Auditoria física** | Acesso a servidores por entidades reguladoras | Tribunal de Contas |
| **Air-gapped** | Operação em intranet governamental sem internet | Requisito militar/governo |

### Requisitos de Hardware

#### Servidor Único (Mínimo para Testes/Piloto)

| Recurso | Especificação | Nota |
|---------|---------------|------|
| CPU | 4 cores (x86_64 ou ARM64) | Intel Xeon ou AMD EPYC |
| RAM | 8 GB | DDR4 ECC recomendado |
| Disco | 100 GB SSD NVMe | RAID 1 para redundância |
| OS | Ubuntu 22.04 LTS | Kernel 5.15+ |
| Rede | Intranet governamental ou VPN/MPLS | Isolamento físico |
| Energia | UPS + gerador | Continuidade operacional |

#### Cluster Kubernetes (Recomendado para Produção Institucional)

| Componente | Especificação | Nota |
|------------|---------------|------|
| Nodes | 3 (1 master + 2 workers) | Alta disponibilidade |
| Load Balancer | HAProxy ou Nginx | Failover automático |
| Storage | Ceph ou NFS | Persistência distribuída |
| Backup | Diário para tape/disco externo | Retenção 30 dias |
| Monitoramento | Prometheus + Grafana | Métricas em tempo real |
| Firewall | pfSense ou iptables | Regras de segurança |

### Instalação do Docker

```bash
# Ubuntu 22.04 LTS
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

# Configurar Docker para iniciar no boot
sudo systemctl enable docker
sudo systemctl start docker

# Adicionar utilizador ao grupo docker (opcional, para não usar sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### Configuração do Projeto

```bash
# 1. Clonar o repositório
git clone https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso.git
cd Txeka-Ntiyiso

# 2. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Editar com credenciais locais seguras
```

**Exemplo de `.env` para produção nacional:**

```env
# === DATABASE ===
DATABASE_URL=postgresql://txeka:senha_muito_segura@db:5432/txeka_ntiyiso
DB_PASSWORD=senha_muito_segura

# === SECURITY ===
JWT_SECRET_KEY=chave_gerada_com_openssl_rand_hex_32_minimo
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

# === ENVIRONMENT ===
ENVIRONMENT=production
DEBUG=false

# === CORS ===
CORS_ORIGINS=https://txeka.gov.mz,https://portal.txeka.gov.mz

# === TZ ===
TZ=Africa/Maputo
```

> **Gerar credenciais seguras:**
> ```bash
> # JWT Secret (256 bits)
> openssl rand -hex 32
>
> # Password da base de dados (32 caracteres aleatórios)
> openssl rand -base64 24
> ```

---

## Docker Compose (Produção Nacional)

```yaml
version: '3.8'

services:
  api:
    image: txeka-ntiyiso-api:latest
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://txeka:${DB_PASSWORD}@db:5432/txeka_ntiyiso
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - ENVIRONMENT=production
      - TZ=Africa/Maputo
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /tmp
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - txeka-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    environment:
      - POSTGRES_USER=txeka
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=txeka_ntiyiso
      - TZ=Africa/Maputo
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U txeka -d txeka_ntiyiso"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - txeka-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - txeka-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - txeka-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  txeka-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Iniciar Serviços

```bash
# Construir e iniciar todos os serviços
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar estado dos containers
docker-compose -f docker-compose.prod.yml ps

# Verificar logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f api --tail=100

# Verificar health check
curl -f http://localhost:8000/health
```

---

## Configuração SSL/TLS

### Opção A: Certificado da AC-MZ (Recomendado para Governo)

Se a Autoridade de Certificação de Moçambique (AC-MZ) emitir certificados:

```bash
# 1. Solicitar certificado à AC-MZ
#    Submeter CSR (Certificate Signing Request)

# 2. Gerar CSR
openssl req -new -newkey rsa:2048 -nodes \
  -keyout txeka.gov.mz.key \
  -out txeka.gov.mz.csr \
  -subj "/C=MZ/ST=Maputo/L=Maputo/O=Txeka Ntiyiso/CN=txeka.gov.mz"

# 3. Colocar certificados em ./nginx/ssl/
cp txeka.gov.mz.crt ./nginx/ssl/
cp txeka.gov.mz.key ./nginx/ssl/

# 4. Reiniciar Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

> **Nota:** Certificados da AC-MZ são obrigatórios para domínios `.gov.mz` e garantem confiança máxima em comunicações governamentais.

### Opção B: Let's Encrypt (Se Domínio Público)

```bash
# Instalar certbot
sudo apt install -y certbot

# Gerar certificado (standalone)
sudo certbot certonly --standalone -d txeka.gov.mz

# Copiar para diretório do projeto
sudo cp /etc/letsencrypt/live/txeka.gov.mz/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/txeka.gov.mz/privkey.pem ./nginx/ssl/

# Configurar renovação automática (crontab)
0 3 * * * certbot renew --quiet && docker-compose -f /opt/txeka/docker-compose.prod.yml restart nginx
```

### Opção C: Certificado Auto-assinado (Apenas para Desenvolvimento)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/txeka.gov.mz.key \
  -out ./nginx/ssl/txeka.gov.mz.crt \
  -subj "/C=MZ/ST=Maputo/L=Maputo/O=Txeka Ntiyiso/CN=txeka.gov.mz"
```

> ⚠️ **Atenção:** Certificados auto-assinados são **apenas para desenvolvimento e testes internos**. Em produção nacional, usar obrigatoriamente certificados emitidos pela AC-MZ ou PKI governamental.

---

## Nginx Reverse Proxy

```nginx
# nginx/nginx.conf

# Upstream para a API FastAPI
upstream api_backend {
    server api:8000;
    keepalive 32;
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name txeka.gov.mz www.txeka.gov.mz;
    
    # Let's Encrypt challenge (se aplicável)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Servidor HTTPS principal
server {
    listen 443 ssl http2;
    server_name txeka.gov.mz www.txeka.gov.mz;

    # Certificados SSL
    ssl_certificate /etc/nginx/ssl/txeka.gov.mz.crt;
    ssl_certificate_key /etc/nginx/ssl/txeka.gov.mz.key;
    
    # Configuração SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # Headers de segurança
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy para API
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        
        # Limite de tamanho (50MB para PDFs)
        client_max_body_size 50M;
    }

    # Health check (sem logs)
    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }

    # Documentação Swagger (restrito)
    location /docs {
        proxy_pass http://api_backend/docs;
        # Opcional: allow 10.0.0.0/8; deny all;
    }
}
```

---

## Backup e Recuperação

### Backup Automático (Diário)

```bash
#!/bin/bash
# /opt/txeka/scripts/backup.sh

set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/txeka"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

# 1. Backup PostgreSQL
echo "[$(date)] Iniciando backup PostgreSQL..."
docker exec txeka-db pg_dump -U txeka -d txeka_ntiyiso --clean --if-exists > \
  "$BACKUP_DIR/txeka_ntiyiso_$DATE.sql"

# 2. Comprimir
echo "[$(date)] Comprimindo backup..."
gzip -f "$BACKUP_DIR/txeka_ntiyiso_$DATE.sql"

# 3. Verificar integridade
echo "[$(date)] Verificando integridade..."
gunzip -t "$BACKUP_DIR/txeka_ntiyiso_$DATE.sql.gz"

# 4. Limpar backups antigos
echo "[$(date)] Limpando backups com mais de $RETENTION_DIAS dias..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DIAS -delete

# 5. Notificar (opcional: webhook Slack/Email)
echo "[$(date)] Backup concluído: txeka_ntiyiso_$DATE.sql.gz"
```

**Adicionar ao crontab:**

```bash
# Editar crontab
sudo crontab -e

# Adicionar linha (todos os dias às 02:00 CAT)
0 2 * * * /opt/txeka/scripts/backup.sh >> /var/log/txeka-backup.log 2>&1
```

### Restauração de Disaster Recovery

```bash
#!/bin/bash
# /opt/txeka/scripts/restore.sh

set -euo pipefail

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <caminho_do_backup.sql.gz>"
    exit 1
fi

# 1. Parar serviços dependentes
echo "[$(date)] Parando API..."
docker-compose -f /opt/txeka/docker-compose.prod.yml stop api

# 2. Restaurar base de dados
echo "[$(date)] Restaurando base de dados..."
gunzip -c "$BACKUP_FILE" | docker exec -i txeka-db psql -U txeka -d txeka_ntiyiso

# 3. Verificar integridade
echo "[$(date)] Verificando integridade..."
docker exec txeka-db psql -U txeka -c "SELECT COUNT(*) FROM documents;"
docker exec txeka-db psql -U txeka -c "SELECT COUNT(*) FROM audit_logs;"

# 4. Reiniciar serviços
echo "[$(date)] Reiniciando API..."
docker-compose -f /opt/txeka/docker-compose.prod.yml up -d api

# 5. Validar health check
echo "[$(date)] Validando health check..."
sleep 10
curl -f http://localhost:8000/health

echo "[$(date)] Restauração concluída com sucesso!"
```

**Uso:**
```bash
sudo /opt/txeka/scripts/restore.sh /backups/txeka/txeka_ntiyiso_20260627_020000.sql.gz
```

---

## Monitoramento e Alertas

### Health Check

```bash
curl -s http://localhost:8000/health | jq .
```

### Métricas do Sistema (Opcional — Prometheus + Grafana)

```yaml
# Adicionar ao docker-compose.prod.yml

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped
    networks:
      - txeka-network

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - txeka-network
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

volumes:
  prometheus_data:
  grafana_data:
```

### Alertas Recomendados

| Métrica | Threshold | Ação |
|---------|-----------|------|
| API down | Health check falha 3x | PagerDuty + Email |
| Latência P95 | > 500ms | Slack + Email |
| Taxa de erro | > 1% | PagerDuty + Escalation |
| Espaço em disco | < 20% livre | Email + Auto-cleanup |
| Conexões DB | > 80% do máximo | Slack + Escalation |
| Backup falhou | Último backup > 25h | Email + PagerDuty |

---

## Checklist de Deploy Nacional

### Pré-deploy

- [ ] Servidores físicos em datacenter nacional (Maputo / Beira / Nampula)
- [ ] Rede isolada (intranet governamental ou VPN/MPLS dedicada)
- [ ] UPS + gerador de emergência configurados
- [ ] Docker e Docker Compose instalados e testados
- [ ] Variáveis `.env` configuradas com credenciais seguras (nunca no Git)
- [ ] `JWT_SECRET_KEY` gerada com `openssl rand -hex 32` (mínimo 256 bits)
- [ ] `DB_PASSWORD` gerada com `openssl rand -base64 24` (mínimo 32 caracteres)
- [ ] Firewall configurado (apenas portas 80, 443, 22 SSH)
- [ ] Acesso SSH restrito a IPs autorizados (fail2ban ativo)

### Deploy

- [ ] PostgreSQL 15 com volume persistente encriptado
- [ ] SSL configurado (AC-MZ ou PKI governamental — nunca auto-assinado em produção)
- [ ] Nginx como reverse proxy com headers de segurança
- [ ] Health check validado (`curl http://localhost:8000/health`)
- [ ] CORS configurado apenas para domínios autorizados
- [ ] Rate limiting ativo e testado
- [ ] Logs estruturados (JSON) configurados

### Pós-deploy

- [ ] Backups automáticos configurados (diário às 02:00 CAT)
- [ ] Teste de restauração de backup executado com sucesso
- [ ] Monitoramento de health check ativo
- [ ] Logs centralizados (opcional: ELK stack ou Loki)
- [ ] Documentação de runbook entregue à equipa de operações
- [ ] Treino de incident response realizado com equipa local
- [ ] Plano de comunicação de crise definido (contactos INTIC, Tribunal de Contas)

### Conformidade

- [ ] Auditoria de segurança inicial realizada
- [ ] Penetration test básico executado (OWASP Top 10)
- [ ] Documentação de conformidade entregue (COMPLIANCE.md)
- [ ] Declaração de não-ICP assinada e arquivada
- [ ] Acordo de nível de serviço (SLA) definido com instituições

---

## Roadmap de Infraestrutura

| Fase | Período | Ambiente | Objetivo | Milestones |
|------|---------|----------|----------|------------|
| **Atual** | Q2 2026 | Produção Cloud (Render) | Operação plena, validação de mercado, piloto com INAGE | API online, 99.9% uptime, < 100ms latência |
| **Transição** | Q3–Q4 2026 | Híbrido | Replicação assíncrona Cloud ↔ Nacional, testes de failover | Sync funcional, RTO < 4h validado |
| **Futuro** | Q1 2027+ | Produção Nacional | Soberania digital total, conformidade INTIC, air-gapped | Certificação AC-MZ, auditoria INTIC aprovada |

### Métricas de Sucesso por Fase

| Fase | Uptime | Latência P95 | RTO | RPO | Certificações |
|------|--------|--------------|-----|-----|---------------|
| Atual | 99.9% | < 200ms | 4h | 15min | — |
| Transição | 99.95% | < 150ms | 2h | 5min | ISO 27001 (planeado) |
| Futuro | 99.99% | < 100ms | 30min | 1min | ISO 27001 + INTIC |

---

*Txeka Ntiyiso — Deploy e Infraestrutura v1.0 🇲🇿*
*Alinhado com Lei 3/2017, Decreto 59/2019 e Resolução 69/2021 (PENSC)*
