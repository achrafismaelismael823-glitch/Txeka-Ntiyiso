# Guia de Deploy - Txeka Ntiyiso API Gateway

> **Versao:** 2.0.0  
> **Ultima atualizacao:** 22/07/2026  
> **Ambientes suportados:** Render.com (Producao) | Docker (Local & On-premise)

---

## Indice

- [Visao Geral](#visao-geral)
- [Deploy em Render.com (Producao)](#deploy-em-rendercom-producao)
- [Deploy Local com Docker](#deploy-local-com-docker)
- [Deploy On-Premise (Servidor Proprio)](#deploy-on-premise-servidor-proprio)
- [Variaveis de Ambiente](#variaveis-de-ambiente)
- [Migrations com Alembic](#migrations-com-alembic)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)
- [Checklist Pre-Deploy](#checklist-pre-deploy)

---

## Visao Geral

O Txeka Ntiyiso utiliza uma pipeline de deploy dual:

| Ambiente | Plataforma | Comando de Start | Banco de Dados |
|----------|-----------|------------------|----------------|
| **Producao** | Render.com | `poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT` | PostgreSQL (Render managed) |
| **Local** | Docker Compose | `docker-compose up --build` | PostgreSQL 15 (container) |
| **On-premise** | Docker + Nginx | `docker-compose -f docker-compose.prod.yml up -d` | PostgreSQL 15 (container ou externo) |

---

## Deploy em Render.com (Producao)

### Pre-requisitos

- Conta Render.com (Free ou Pro)
- Repositório GitHub conectado ao Render
- Banco de dados PostgreSQL provisionado no Render

### Passo a Passo

#### 1. Criar Web Service

1. Aceda ao [Dashboard do Render](https://dashboard.render.com)
2. Clique em **New +** -> **Web Service**
3. Conecte o repositório `achrafismaelismael823-glitch/Txeka-Ntiyiso`
4. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | txeka-ntiyiso-api |
| **Environment** | Python 3 |
| **Build Command** | `poetry install --no-dev` |
| **Start Command** | `poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free (ou Pro para producao) |

#### 2. Configurar Variaveis de Ambiente

No dashboard do serviço, aceda a **Environment** e adicione:

```
DATABASE_URL=postgresql+asyncpg://user:pass@host.render.com:5432/txeka_ntiyiso
SECRET_KEY=sua-chave-secreta-aqui-min-32-caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
ADMIN_EMAIL=admin@txeka.co.mz
ADMIN_PASSWORD_HASH=$2b$12$... (bcrypt)
ENVIRONMENT=production
LOG_LEVEL=INFO
```

#### 3. Provisionar PostgreSQL

1. **New +** -> **PostgreSQL**
2. Nome: `txeka-ntiyiso-db`
3. Plan: Free (ou Pro)
4. Copie a **Internal Database URL** para a variavel `DATABASE_URL`

#### 4. Deploy Automatico

O Render dispara deploy automatico em cada push para `main`:

```
==> Build successful
==> Deploying...
==> Running 'poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT'
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO:     DATABASE.PY LOADED - connect_args: statement_cache_size=0
INFO:     Rotas registadas: /api/v1
INFO:     Started server process [60]
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
==> Your service is live
==> Available at your primary URL https://txeka-ntiyiso-api.onrender.com
```

#### 5. Verificar Health Check

```bash
curl https://txeka-ntiyiso-api.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-22T14:24:00Z",
  "version": "2.0.0"
}
```

---

## Deploy Local com Docker

### Pre-requisitos

- Docker 24.0+
- Docker Compose 2.20+
- Git

### Passo a Passo

#### 1. Clonar e Configurar

```bash
git clone https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso.git
cd Txeka-Ntiyiso

# Copiar variaveis de ambiente
cp .env.example .env
# Editar .env com as suas configuracoes
```

#### 2. Subir com Docker Compose

```bash
docker-compose up --build
```

**Servicos levantados:**

| Servico | Porta | Descricao |
|---------|-------|-----------|
| `api-gateway` | `8000` | FastAPI + Uvicorn |
| `postgres` | `5432` | PostgreSQL 15 |

#### 3. Verificar Logs

```bash
# API
docker-compose logs -f api-gateway

# PostgreSQL
docker-compose logs -f postgres
```

**Log esperado da API:**
```
INFO:     DATABASE.PY LOADED - connect_args: statement_cache_size=0
INFO:     Rotas registadas: /api/v1
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### 4. Aceder aos Endpoints

| URL | Descricao |
|-----|-----------|
| `http://localhost:8000/docs` | Swagger UI |
| `http://localhost:8000/redoc` | ReDoc |
| `http://localhost:8000/health` | Health check |
| `http://localhost:8000/api/v1/verify/{hash}` | Verificacao publica |

#### 5. Parar

```bash
docker-compose down        # Parar e remover containers
docker-compose down -v     # Parar, remover containers E volumes (apaga dados)
```

---

## Deploy On-Premise (Servidor Proprio)

### Arquitetura Recomendada

```
+--------------------------------------------------+
|                    INTERNET                       |
+----------+---------------------------------------+
           |
           v
+----------+----------+     +---------------------+
|   Nginx (SSL)       |---->|  API Gateway        |
|   Porta 443/80      |     |  FastAPI + Uvicorn  |
|   Reverse Proxy     |     |  Porta 8000         |
+----------+----------+     +----------+----------+
           |                           |
           |                           v
           |                  +--------+--------+
           |                  |  PostgreSQL 15   |
           |                  |  Porta 5432      |
           |                  +-----------------+
           |
           v
+----------+----------+
|  Certbot (SSL)      |
|  Let's Encrypt      |
+---------------------+
```

### Passo a Passo

#### 1. Preparar Servidor

```bash
# Ubuntu 22.04 LTS
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx

# Adicionar usuario ao grupo docker
sudo usermod -aG docker $USER
# Re-logar
```

#### 2. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/txeka-ntiyiso
```

```nginx
server {
    listen 80;
    server_name api.txeka-ntiyiso.co.mz;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/txeka-ntiyiso /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 3. Configurar SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d api.txeka-ntiyiso.co.mz
```

#### 4. Docker Compose de Producao

Criar `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    container_name: txeka-api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://txeka:senha_segura@postgres:5432/txeka_ntiyiso
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - txeka-network

  postgres:
    image: postgres:15-alpine
    container_name: txeka-postgres
    environment:
      - POSTGRES_USER=txeka
      - POSTGRES_PASSWORD=senha_segura
      - POSTGRES_DB=txeka_ntiyiso
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - txeka-network

  # Opcional: pgAdmin para gestao
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: txeka-pgadmin
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@txeka.co.mz
      - PGADMIN_DEFAULT_PASSWORD=senha_pgadmin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - txeka-network

volumes:
  postgres_data:

networks:
  txeka-network:
    driver: bridge
```

#### 5. Subir

```bash
docker-compose -f docker-compose.prod.yml up -d

# Verificar
docker-compose -f docker-compose.prod.yml logs -f api-gateway
```

---

## Variaveis de Ambiente

### Obrigatorias

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexao PostgreSQL | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | Chave secreta para JWT (min 32 chars) | `super-secret-key-32-chars-min` |
| `ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Tempo de expiracao do token | `43200` (30 dias) |
| `ADMIN_EMAIL` | Email do admin padrao | `admin@txeka.co.mz` |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt da password admin | `$2b$12$...` |

### Opcionais

| Variavel | Padrao | Descricao |
|----------|--------|-----------|
| `ENVIRONMENT` | `development` | `development` | `staging` | `production` |
| `LOG_LEVEL` | `INFO` | `DEBUG` | `INFO` | `WARNING` | `ERROR` |
| `API_V1_STR` | `/api/v1` | Prefixo da API |
| `PROJECT_NAME` | `Txeka Ntiyiso` | Nome do projeto nos logs |
| `BACKEND_CORS_ORIGINS` | `[]` | Lista de origens CORS permitidas |
| `MAX_FILE_SIZE` | `10485760` | Tamanho maximo de upload (bytes) |
| `RATE_LIMIT_VERIFY` | `100/minute` | Limite de verificacoes |
| `RATE_LIMIT_CERTIFY` | `60/minute` | Limite de emissoes |

---

## Migrations com Alembic

### Estrutura

```
api-gateway/
|-- alembic/
|   |-- versions/
|   |   |-- 001_initial_schema.py
|   |   |-- 002_add_institutions.py
|   |   |-- 003_add_credit_system.py
|   |   +-- 004_add_audit_logs.py
|   |-- env.py
|   +-- script.py.mako
+-- alembic.ini
```

### Comandos

```bash
cd api-gateway

# Criar nova migration
poetry run alembic revision --autogenerate -m "descricao da alteracao"

# Aplicar migrations
poetry run alembic upgrade head

# Verificar versao atual
poetry run alembic current

# Rollback (CUIDADO em producao)
poetry run alembic downgrade -1

# Historico
poetry run alembic history --verbose
```

### Migrations no Deploy

O Render executa automaticamente:
```bash
poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

Em Docker local, a migration e executada no entrypoint:
```dockerfile
CMD ["sh", "-c", "poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000"]
```

---

## Health Checks

### Endpoint de Health

```bash
curl https://txeka-ntiyiso-api.onrender.com/health
```

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-22T14:24:00Z",
  "version": "2.0.0",
  "environment": "production",
  "database": "connected"
}
```

### Health Check no Render

Configurar no dashboard:
- **Health Check Path:** `/health`
- **Interval:** 30s
- **Timeout:** 5s

### Health Check no Docker

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## Troubleshooting

### Erro: "Database connection failed"

**Causa:** `DATABASE_URL` incorreta ou PostgreSQL nao acessivel.

**Solucao:**
```bash
# Verificar variavel
echo $DATABASE_URL

# Testar conexao
psql $DATABASE_URL

# Verificar se PostgreSQL esta a correr
docker-compose ps
```

### Erro: "Alembic upgrade head falha"

**Causa:** Banco de dados vazio ou migration corrompida.

**Solucao:**
```bash
# Verificar estado
poetry run alembic current

# Forcar stamp (CUIDADO)
poetry run alembic stamp head

# Ou recriar do zero (PERDE DADOS)
docker-compose down -v
docker-compose up --build
```

### Erro: "Port already in use"

**Causa:** Outro servico esta a usar a porta 8000.

**Solucao:**
```bash
# Verificar
lsof -i :8000

# Matar processo
kill -9 <PID>

# Ou alterar porta no docker-compose.yml
ports:
  - "8001:8000"
```

### Erro: "Module not found" no Render

**Causa:** Dependencias nao instaladas corretamente.

**Solucao:**
```bash
# Forcar rebuild no Render
# Dashboard -> Manual Deploy -> Clear build cache & deploy
```

### Erro: "JWT token invalid"

**Causa:** `SECRET_KEY` diferente entre deploys ou token expirado.

**Solucao:**
```bash
# Verificar SECRET_KEY
echo $SECRET_KEY | wc -c  # Deve ter >= 32 caracteres

# Gerar nova chave
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Erro: "Rate limit exceeded"

**Causa:** Muitas requisicoes do mesmo IP.

**Solucao:**
- Verificar headers `X-RateLimit-Remaining`
- Implementar backoff exponencial no cliente
- Ajustar limites em `settings.py` se necessario

---

## Checklist Pre-Deploy

### Antes de cada deploy em producao:

- [ ] Tests passam localmente: `poetry run pytest`
- [ ] Bandit sem vulnerabilidades: `poetry run bandit -r src/`
- [ ] Migrations testadas: `poetry run alembic upgrade head`
- [ ] Variaveis de ambiente atualizadas no Render
- [ ] `SECRET_KEY` tem >= 32 caracteres
- [ ] `DATABASE_URL` aponta para o banco correto
- [ ] Health check responde em `/health`
- [ ] Documentacao Swagger acessivel em `/docs`
- [ ] Backup do banco de dados realizado
- [ ] Changelog atualizado
- [ ] Tag de versao criada: `git tag -a v2.0.0 -m "Release v2.0.0"`

---

## Backup e Recuperacao

### Backup Automatico (On-premise)

```bash
#!/bin/bash
# backup.sh - Executar via cron diariamente

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="txeka_backup_$DATE.sql"

docker exec txeka-postgres pg_dump -U txeka txeka_ntiyiso > $BACKUP_DIR/$FILENAME

# Manter apenas ultimos 30 dias
find $BACKUP_DIR -name "txeka_backup_*.sql" -mtime +30 -delete

echo "Backup concluido: $FILENAME"
```

### Restaurar Backup

```bash
docker exec -i txeka-postgres psql -U txeka txeka_ntiyiso < txeka_backup_20260722.sql
```

---

## Monitoramento

### Logs Estruturados

O sistema utiliza `structlog` para logs JSON em producao:

```json
{
  "timestamp": "2026-07-22T14:24:00Z",
  "level": "info",
  "event": "document_emitted",
  "doc_id": "DOC-...",
  "institution_id": "INAGE",
  "ip_address": "197.218.XX.XX"
}
```

### Metricas

| Metrica | Endpoint | Frequencia |
|---------|----------|------------|
| Uptime | `/health` | A cada 30s |
| Emissoes | `/api/v1/stats` | Diaria |
| Verificacoes | `/api/v1/stats` | Diaria |
| Erros 5xx | Logs Render | Em tempo real |

---

## Contacto de Suporte

- **Email:** geral.txekantiyiso@gmail.com
- **GitHub Issues:** [github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues](https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues)
- **Status:** [https://txeka-ntiyiso-api.onrender.com/health](https://txeka-ntiyiso-api.onrender.com/health)

---

Txeka Ntiyiso - Orgulhosamente desenvolvido em Mocambique

Proprietary. All rights reserved. Txeka Ntiyiso, 2026.
