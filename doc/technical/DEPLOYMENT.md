# DEPLOYMENT.md

## Guia de Deploy e Infraestrutura — Txeka Ntiyiso

**Infraestrutura tecnológica para verificação da integridade e autenticidade documental em Moçambique**

| Versão | Estado | Última Atualização | Contacto |
|--------|--------|-------------------|----------|
| 2.0 | Final | 2026-07-22 | geral.txekantiyiso@gmail.com |

Plano de deploy, containerização e operação em alinhamento com a legislação moçambicana.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Ficheiros Docker](#2-ficheiros-docker)
3. [Variáveis de Ambiente](#3-variáveis-de-ambiente)
4. [Deploy Passo a Passo](#4-deploy-passo-a-passo)
5. [Nginx — Reverse Proxy](#5-nginx--reverse-proxy)
6. [Backup e Recuperação](#6-backup-e-recuperação)
7. [Monitoramento](#7-monitoramento)
8. [Checklist de Deploy](#8-checklist-de-deploy)
9. [Conformidade Legal](#9-conformidade-legal)
10. [Roadmap Infraestrutura](#10-roadmap-infraestrutura)
11. [Contactos para Suporte Infraestrutural](#11-contactos-para-suporte-infraestrutural)
12. [Documentação Relacionada](#12-documentação-relacionada)

---

## 1. Visão Geral

O sistema Txeka Ntiyiso é containerizado com Docker e orquestrado via Docker Compose. A stack utiliza **Python 3.11** (FastAPI) no backend e **PostgreSQL 15** como base de dados relacional. Todo o ambiente é configurado para o fuso horário **CAT (UTC+2)** e locale **pt_MZ.UTF-8**, em alinhamento com os requisitos de auditoria cronológica do Decreto n.º 59/2019.

| Ambiente | Finalidade | Infraestrutura | Fase |
|----------|-----------|----------------|------|
| **Desenvolvimento** | Desenvolvimento local | Docker Compose local | Contínua |
| **Produção Cloud** | Deploy imediato, alta disponibilidade | Render.com + PostgreSQL managed | **Atual** |
| **Produção Nacional** | Soberania digital, intranet governamental | Servidor dedicado em Moçambique (INTIC) | Migração futura |
| **Híbrido** | Resiliência máxima, contingência offline | Docker Edge + Cloud | Futuro |

---

## 2. Ficheiros Docker

### 2.1 Dockerfile — API Gateway v2.0

```dockerfile
# ============================================================
# TXEKA NTIYISO - API Gateway
# Infraestrutura tecnológica para verificação da
# integridade e autenticidade documental
#
# Alinhamento: Lei 3/2017, Decreto 59/2019, Resolução 69/2021
# Fuso horário: CAT (UTC+2) - Moçambique
# Versão: 2.0.0
# ============================================================

# -------- Stage 1: Builder --------
FROM python:3.11-slim AS builder

LABEL maintainer="Txeka Ntiyiso Team <geral.txekantiyiso@gmail.com>"
LABEL description="API Gateway para validação criptográfica de documentos"
LABEL version="2.0.0"
LABEL country="MZ"
LABEL timezone="CAT"
LABEL legislation="Lei 3/2017, Decreto 59/2019"

WORKDIR /app

# Instala dependências de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instala Poetry
RUN pip install --no-cache-dir poetry

# Copia ficheiros de dependências
COPY api-gateway/pyproject.toml api-gateway/poetry.lock* ./

# Instala dependências Python
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --only main --no-root

# -------- Stage 2: Runtime --------
FROM python:3.11-slim

LABEL maintainer="Txeka Ntiyiso Team <geral.txekantiyiso@gmail.com>"
LABEL description="Txeka Ntiyiso API Gateway — Infraestrutura de Verificação de Integridade Documental"
LABEL version="2.0.0"

# Configuração de conformidade e segurança
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV ENVIRONMENT=production
ENV TZ=Africa/Maputo
ENV LANG=pt_MZ.UTF-8
ENV LC_ALL=pt_MZ.UTF-8

# Instala runtime + locale + curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    locales \
    && sed -i 's/# pt_MZ.UTF-8 UTF-8/pt_MZ.UTF-8 UTF-8/' /etc/locale.gen \
    && locale-gen pt_MZ.UTF-8 \
    && update-locale LANG=pt_MZ.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

# Cria usuário não-root (mitiga Elevation of Privilege)
RUN groupadd -r txeka && useradd -r -g txeka -s /bin/false txeka

WORKDIR /app

# Copia dependências do builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copia código da aplicação
COPY api-gateway/ ./api-gateway/

# Permissões restritas
RUN chown -R txeka:txeka /app

USER txeka

EXPOSE 8000

# Healthcheck — verifica se API responde
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:8000/health || exit 1

# Start com Poetry + Alembic migrations + Uvicorn
CMD ["sh", "-c", "poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000"]
```

**Notas de conformidade:**
- **Multi-stage build**: Reduz a superfície de ataque — apenas dependências de runtime no container final.
- **Usuário não-root (`txeka`)**: Mitigação de Elevation of Privilege (STRIDE), alinhado com a Resolução n.º 69/2021 (PENSC).
- **Locale `pt_MZ.UTF-8` e TZ `Africa/Maputo`**: Garante timestamps auditáveis em CAT (UTC+2), conforme Decreto 59/2019.
- **Healthcheck**: Verificação periódica de disponibilidade; falha após 3 tentativas em 30s.
- **Alembic no startup**: Migrations aplicadas automaticamente antes do servidor iniciar.

---

### 2.2 Docker Compose — Ambiente Completo v2.0

```yaml
# ============================================================
# TXEKA NTIYISO - Docker Compose
# Infraestrutura tecnológica para verificação da
# integridade e autenticidade documental
#
# Ambiente: Desenvolvimento e Produção Nacional
# Fuso horário: CAT (UTC+2) - Moçambique
# Alinhamento: Lei 3/2017, Decreto 59/2019, Resolução 69/2021
# Versão: 2.0.0
# ============================================================

version: '3.9'

services:
  db:
    image: postgres:15-alpine
    container_name: txeka-ntiyiso-db
    restart: unless-stopped

    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-txeka_ntiyiso}
      TZ: Africa/Maputo
      PGTZ: Africa/Maputo

    ports:
      - "5432:5432"

    volumes:
      - txeka-data:/var/lib/postgresql/data

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-txeka_ntiyiso}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

    networks:
      - txeka-network

  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: txeka-ntiyiso-api
    restart: unless-stopped

    ports:
      - "8000:8000"

    environment:
      ENVIRONMENT: ${ENVIRONMENT:-development}
      DEBUG: ${DEBUG:-true}
      PYTHONUNBUFFERED: "1"
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
      TZ: Africa/Maputo
      LANG: pt_MZ.UTF-8
      LC_ALL: pt_MZ.UTF-8

      DATABASE_URL: ${DATABASE_URL:-postgresql://postgres:postgres@db:5432/txeka_ntiyiso}
      SECRET_KEY: ${SECRET_KEY:-dev-secret-key-change-in-prod}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY:-TXEKA-NTIYISO-2026-k3ab9sGze6Igc1u8Q5@i+j0#0KX0rBzj}
      ALLOW_ANONYMOUS: ${ALLOW_ANONYMOUS:-false}
      BASE_URL: ${BASE_URL:-http://localhost:8000}
      RATE_LIMIT_REQUESTS: ${RATE_LIMIT_REQUESTS:-100}
      RATE_LIMIT_PERIOD_SECONDS: ${RATE_LIMIT_PERIOD_SECONDS:-60}

      # Fase 2: Multi-tenancy e controlo de créditos
      ENABLE_MULTI_TENANT: ${ENABLE_MULTI_TENANT:-true}
      CREDIT_CONSUMPTION_ENABLED: ${CREDIT_CONSUMPTION_ENABLED:-true}

    volumes:
      - .:/app:ro
      - txeka-logs:/app/logs

    command: >
      sh -c "cd /app/api-gateway &&
             poetry run alembic upgrade head &&
             poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload"

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

    networks:
      - txeka-network

    depends_on:
      db:
        condition: service_healthy

  # Futuro: Agregação de logs (Fase 3)
  # loki:
  #   image: grafana/loki:2.9.0
  #   container_name: txeka-ntiyiso-loki
  #   restart: unless-stopped
  #   volumes:
  #     - ./config/loki.yml:/etc/loki/local-config.yaml
  #   ports:
  #     - "3100:3100"
  #   networks:
  #     - txeka-network

  # Futuro: Monitoramento (Fase 3)
  # prometheus:
  #   image: prom/prometheus:v2.47.0
  #   container_name: txeka-ntiyiso-prometheus
  #   restart: unless-stopped
  #   volumes:
  #     - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
  #   ports:
  #     - "9090:9090"
  #   networks:
  #     - txeka-network

networks:
  txeka-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  txeka-data:
    driver: local
  txeka-logs:
    driver: local
```

**Notas de conformidade:**
- **Rede isolada (`txeka-network`, subnet `172.20.0.0/16`)**: Comunicação interna segregada; mitiga Information Disclosure (STRIDE).
- **Resource limits**: CPU 1.0 + 512M RAM por serviço; proteção contra DoS por exaustão de recursos.
- **Healthchecks em ambos os serviços**: API só inicia após DB estar saudável (`condition: service_healthy`).
- **Volumes persistentes**: `txeka-data` para PostgreSQL (retenção 20+ anos) e `txeka-logs` para auditoria.
- **Variáveis via `.env`**: Segredos (`SECRET_KEY`, `JWT_SECRET_KEY`) nunca hardcoded em produção.
- **Fase 2 — Multi-tenancy e créditos**: Variáveis `ENABLE_MULTI_TENANT` e `CREDIT_CONSUMPTION_ENABLED` preparadas.

> **⚠️ Problema Conhecido:** O `docker-compose.yml` contém fallbacks inseguros para `SECRET_KEY` e `JWT_SECRET_KEY`. Estes devem ser removidos e substituídos por validação obrigatória em produção.

---

## 3. Variáveis de Ambiente

Crie um ficheiro `.env` na raiz do projeto:

```bash
# Ambiente
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Base de Dados
DATABASE_URL=postgresql://postgres:SECRETO@db:5432/txeka_ntiyiso
POSTGRES_USER=txeka_admin
POSTGRES_PASSWORD=<GERAR_VIA_OPENSSL_32CHAR>
POSTGRES_DB=txeka_ntiyiso

# Segurança (gerar via: openssl rand -hex 32)
SECRET_KEY=<32_BYTES_HEX>
JWT_SECRET_KEY=<32_BYTES_HEX>

# Rate Limiting
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_PERIOD_SECONDS=60

# URLs
BASE_URL=https://txeka-ntiyiso-api.onrender.com
ALLOW_ANONYMOUS=false

# Fase 2: Multi-tenancy e controlo de créditos
ENABLE_MULTI_TENANT=true
CREDIT_CONSUMPTION_ENABLED=true
```

> ⚠️ **Atenção**: Nunca commite o ficheiro `.env`. Adicione-o ao `.gitignore`.

---

## 4. Deploy Passo a Passo

### 4.1 Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso.git
cd Txeka-Ntiyiso

# 2. Configure o ambiente
cp .env.example .env
# Edite .env com as suas credenciais

# 3. Inicie os serviços
docker-compose up -d --build

# 4. Verifique o estado
docker-compose ps
docker-compose logs -f api

# 5. Aceda à documentação
open http://localhost:8000/docs
```

### 4.2 Produção Cloud (Render.com)

| Passo | Ação | Tempo |
|-------|------|-------|
| 1 | Conecte o repo GitHub ao Render | 2 min |
| 2 | Configure variáveis de ambiente no dashboard | 3 min |
| 3 | Render deteta `Dockerfile` e faz build automático | 2-3 min |
| 4 | Health check `GET /health` valida deploy | 30s |
| 5 | API online em `https://txeka-ntiyiso-api.onrender.com` | — |

**URL atual:** [https://txeka-ntiyiso-api.onrender.com](https://txeka-ntiyiso-api.onrender.com)

**Log de deploy confirmado (22/07/2026):**
```
==> Build successful
==> Deploying...
==> Running 'poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT'
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO:     Rotas registadas: /api/v1
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
==> Your service is live
==> Available at https://txeka-ntiyiso-api.onrender.com
```

**Nota**: A base de dados em produção cloud utiliza **PostgreSQL managed** (Render), não o container local.

### 4.3 Produção Nacional (On-Premise)

**Requisitos mínimos de hardware:**

| Componente | Especificação | Observação |
|------------|--------------|------------|
| Servidor | 2 vCPU, 4 GB RAM | Pode ser VM no datacenter INTIC |
| Disco | 100 GB SSD | Para dados + logs + backups |
| OS | Ubuntu 22.04 LTS | Com suporte de segurança |
| Rede | IP fixo, firewall UFW | Portas 80/443/22 apenas |
| SSL | Certificado AC-MZ | Autoridade de Certificação de Moçambique |

**Procedimento:**

```bash
# 1. Instale Docker e Docker Compose
sudo apt update && sudo apt install -y docker.io docker-compose

# 2. Clone e configure
git clone <repo> && cd Txeka-Ntiyiso
cp .env.example .env
# Edite .env com credenciais de produção

# 3. Deploy
sudo docker-compose -f docker-compose.yml up -d --build

# 4. Configure Nginx (ver secção 5)
sudo cp nginx/txeka.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/txeka.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. SSL com AC-MZ
sudo certbot --nginx -d api.txekantiyiso.co.mz
```

---

## 5. Nginx — Reverse Proxy

```nginx
# /etc/nginx/sites-available/txeka.conf
server {
    listen 80;
    server_name api.txekantiyiso.co.mz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.txekantiyiso.co.mz;

    ssl_certificate /etc/letsencrypt/live/api.txekantiyiso.co.mz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.txekantiyiso.co.mz/privkey.pem;
    ssl_protocols TLSv1.3;
    ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
    ssl_prefer_server_ciphers off;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header Content-Security-Policy "default-src 'self'" always;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

---

## 6. Backup e Recuperação

### 6.1 Backup Diário Automatizado

```bash
#!/bin/bash
# /opt/txeka/backup.sh

BACKUP_DIR="/var/backups/txeka"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="txeka_ntiyiso"
RETENTION_DAYS=30

# Backup PostgreSQL
docker exec txeka-ntiyiso-db pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup logs
tar czf $BACKUP_DIR/logs_$DATE.tar.gz /var/lib/docker/volumes/txeka-logs/_data/

# Rotação (manter 30 dias)
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
```

Adicione ao crontab:
```bash
0 2 * * * /opt/txeka/backup.sh >> /var/log/txeka-backup.log 2>&1
```

### 6.2 Restauração

```bash
# Restaurar base de dados
gunzip < /var/backups/txeka/db_20260707_020000.sql.gz | \
  docker exec -i txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso

# Verificar integridade
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT COUNT(*) FROM documents;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT COUNT(*) FROM audit_logs;"
docker exec txeka-ntiyiso-db psql -U postgres -d txeka_ntiyiso -c "SELECT COUNT(*) FROM institutions;"
```

### 6.3 RTO / RPO

| Métrica | Valor | Nota |
|---------|-------|------|
| **RTO** | 4 horas | Tempo máximo para restaurar serviço |
| **RPO** | 15 minutos | Perda máxima de dados aceitável |
| **Retenção** | 20 anos | Hashes e logs (Decreto 59/2019) |
| **Retenção backup** | 30 dias | Cópias de segurança operacionais |

---

## 7. Monitoramento

### 7.1 Health Checks

| Endpoint | Frequência | Ação em falha |
|----------|-----------|---------------|
| `GET /health` | 30s | Reiniciar container após 3 falhas |
| `pg_isready` | 10s | Aguardar DB antes de iniciar API |

### 7.2 Logs

```bash
# Logs da API em tempo real
docker-compose logs -f api --tail=100

# Logs estruturados (JSON)
docker exec txeka-ntiyiso-api cat /app/logs/app.json | jq
```

### 7.3 Métricas Futuras (Prometheus + Grafana — Fase 3)

| Métrica | Alerta |
|---------|--------|
| Latência P95 > 500ms | Warning |
| Erros 5xx > 1% | Critical |
| CPU > 80% | Warning |
| Disco > 85% | Critical |
| Conexões DB > 80% | Warning |
| Créditos instituição < 10 | Warning |

---

## 8. Checklist de Deploy

### Pré-Deploy
- [ ] `.env` configurado com segredos fortes
- [ ] `docker-compose.yml` validado (`docker-compose config`)
- [ ] Portas 80/443/22 abertas no firewall
- [ ] SSL configurado (AC-MZ recomendado)
- [ ] Backup automático testado

### Deploy
- [ ] `docker-compose up -d --build`
- [ ] Health check `GET /health` retorna 200
- [ ] `GET /docs` acessível
- [ ] Teste de emissão: `POST /api/v1/certify`
- [ ] Teste de verificação: `GET /api/v1/verify/{hash}`
- [ ] **Teste de emissão em bulk (Fase 2):** `POST /api/v1/certify/bulk`
- [ ] **Teste de dashboard institucional (Fase 2):** `GET /api/v1/institutions/me/dashboard`

### Pós-Deploy
- [ ] Logs sem erros críticos
- [ ] Rate limiting ativo
- [ ] CORS configurado para domínios autorizados
- [ ] Auditoria: verificar `audit_logs` tem registos
- [ ] **Multi-tenancy: verificar isolamento entre instituições**
- [ ] **Créditos: verificar consumo e saldo**

### Conformidade
- [ ] TZ = Africa/Maputo (CAT UTC+2)
- [ ] Locale = pt_MZ.UTF-8
- [ ] Retenção de logs configurada (20 anos)
- [ ] Backup diário ativo
- [ ] Usuário não-root no container
- [ ] **Multi-tenancy ativo (Fase 2)**
- [ ] **Controlo de créditos ativo (Fase 2)**

---

## 9. Conformidade Legal

O Txeka Ntiyiso foi concebido em conformidade com os princípios e requisitos aplicáveis da legislação moçambicana relativos à integridade, autenticidade e rastreabilidade documental.

| Requisito | Implementação | Ficheiro |
|-----------|--------------|----------|
| **Lei 3/2017** — Autenticidade | JWT + institution_id no payload | `Dockerfile` (runtime) |
| **Lei 3/2017** — Integridade | SHA-256 imutável | `docker-compose.yml` (DB persistente) |
| **Lei 3/2017** — Não-repúdio | Logs auditáveis em `txeka-logs` | `docker-compose.yml` (volume) |
| **Decreto 59/2019** — Retenção 20 anos | Volume `txeka-data` persistente | `docker-compose.yml` |
| **Decreto 59/2019** — Auditoria cronológica | TZ Africa/Maputo, locale pt_MZ | `Dockerfile` |
| **Resolução 69/2021 (PENSC)** — ICI | Rede isolada, usuário não-root, resource limits | `docker-compose.yml` + `Dockerfile` |
| **Resolução 69/2021 (PENSC)** — Cifragem | TLS 1.3 no Nginx, segredos via `.env` | `nginx.conf` + `.env` |

---

## 10. Roadmap Infraestrutura

| Fase | Período | Objectivo | Métrica de Sucesso |
|------|---------|-----------|-------------------|
| **Fase 1** | Q1 2026 | ✅ Produção Cloud (Render) | Uptime 99.9% |
| **Fase 2** | Q2–Q3 2026 | 🔄 **Produção Nacional (INTIC) + Multi-tenancy** | Latência < 100ms em MZ |
| **Fase 3** | Q3 2026 | ⏳ Cluster Kubernetes + HA + Monitoramento avançado | RTO < 1h, RPO < 5min |
| **Fase 4** | Q4 2026 | ⏳ Escala empresarial: 2FA, OAuth2, ML fraud detection | 99.99% uptime |

---

## 11. Contactos para Suporte Infraestrutural

| Função | Contacto | Canal |
|--------|----------|-------|
| DevOps / Suporte Técnico | geral.txekantiyiso@gmail.com | Email |
| Render Support | support@render.com | Dashboard |
| INTIC | info@intic.gov.mz | Email institucional |
| AC-MZ | info@acmz.gov.mz | Certificados SSL |

---

## 12. Documentação Relacionada

- [README.md](../README.md) — Apresentação do projeto
- [POSITIONING.md](../POSITIONING.md) — Posicionamento estratégico e regulatório
- [API Reference](../guides/API_REFERENCE.md) — Referência completa da API REST
- [Runbook de Produção](RUNBOOK.md) — Operações diárias e troubleshooting
- [Arquitetura Técnica](ARCHITECTURE.md) — Stack, schema e decisões arquiteturais
- [Dossiê de Conformidade Legal](../legal/COMPLIANCE.md) — Enquadramento jurídico completo
- [Políticas de Segurança Cibernética](../legal/SECURITY.md) — Threat model e segurança

---

*Documento elaborado em alinhamento com a Lei n.º 3/2017, Decreto n.º 59/2019 e Resolução n.º 69/2021 (PENSC) da República de Moçambique.*
