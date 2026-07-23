# Guia de Deploy - Txeka Ntiyiso API Gateway

> **Versao:** 2.0.0
> **Ultima atualizacao:** 23/07/2026
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
| **On-premise** | Docker + Nginx | `docker-compose up -d` | PostgreSQL 15 (container ou externo) |

> **Nota:** O deploy no Render.com **nao utiliza o Dockerfile** do repositorio. O Render detecta automaticamente o `pyproject.toml` e utiliza Poetry nativo.

---

## Deploy em Render.com (Producao)

### Pre-requisitos

- Conta Render.com (Free ou Pro)
- Repositorio GitHub conectado ao Render
- Banco de dados PostgreSQL provisionado no Render

### Passo a Passo

#### 1. Criar Web Service

1. Aceda ao [Dashboard do Render](https://dashboard.render.com)
2. Clique em **New +** -> **Web Service**
3. Conecte o repositorio `achrafismaelismael823-glitch/Txeka-Ntiyiso`
4. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | txeka-ntiyiso-api |
| **Environment** | Python 3 |
| **Build Command** | `poetry lock && poetry install` |
| **Start Command** | `poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free (ou Pro para producao) |

> **Importante:** NAO configure `pip install -r requirements.txt` nem `cd api-gateway && ...`. O Render detecta Poetry automaticamente e o WORKDIR ja e `api-gateway/`.

#### 2. Configurar Variaveis de Ambiente

No dashboard do servico, aceda a **Environment** e adicione:

```
DATABASE_URL=postgresql+asyncpg://user:pass@host.render.com:5432/txeka_ntiyiso
SECRET_KEY=sua-chave-secreta-aqui-min-32-caracteres
JWT_SECRET_KEY=sua-chave-jwt-aqui-min-32-caracteres
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
REFRESH_TOKEN_EXPIRE_DAYS=7
ADMIN_EMAIL=admin@txeka.co.mz
ADMIN_PASSWORD_HASH=$2b$12$... (bcrypt)
ENVIRONMENT=production
LOG_LEVEL=INFO
```

> **Seguranca:** `SECRET_KEY` e `JWT_SECRET_KEY` sao obrigatorios. O sistema falha hard (RuntimeError) se nao estiverem configurados. Nao existem fallbacks.

#### 3. Provisionar PostgreSQL

1. **New +** -> **PostgreSQL**
2. Nome: `txeka-ntiyiso-db`
3. Plan: Free (ou Pro)
4. Copie a **Internal Database URL** para a variavel `DATABASE_URL`

#### 4. Deploy Automatico

O Render dispara deploy automatico em cada push para `main`:

```
2026-07-23T11:06:22Z ==> Running build command 'poetry lock && poetry install'...
2026-07-23T11:06:48Z ==> Running 'poetry run alembic upgrade head && poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT'
2026-07-23T11:07:05Z INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
2026-07-23T11:07:20Z INFO:     Rotas registadas: /api/v1
2026-07-23T11:07:22Z INFO:     Base de dados conectada com sucesso.
2026-07-23T11:07:22Z INFO:     BD pronta
2026-07-23T11:07:28Z ==> Your service is live
2026-07-23T11:07:29Z ==> Available at https://txeka-ntiyiso-api.onrender.com
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
  "version": "2.0.0",
  "environment": "production",
  "database": "connected"
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
| `api` | `8000` | FastAPI + Uvicorn (4 workers) |
| `db` | `5432` | PostgreSQL 15 |

> **Nota:** O Dockerfile local esta na **raiz** do repositorio. O CMD e `uvicorn api-gateway.src.main:app --host 0.0.0.0 --port 8000 --workers 4`.

#### 3. Verificar Logs

```bash
# API
docker-compose logs -f api

# PostgreSQL
docker-compose logs -f db
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

Utilize o `docker-compose.yml` existente na raiz do repositorio:

```bash
docker-compose up -d --build
```

> **Nota:** Para producao on-premise, edite o `docker-compose.yml` para remover `--reload` e ajustar as variaveis de ambiente.

#### 5. Subir

```bash
docker-compose up -d

# Verificar
docker-compose logs -f api
```

---

## Variaveis de Ambiente

### Obrigatorias

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexao PostgreSQL | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | Chave secreta para JWT (min 32 chars) | `super-secret-key-32-chars-min` |
| `JWT_SECRET_KEY` | Chave secreta para JWT (min 32 chars) | `jwt-secret-key-32-chars-min` |
| `JWT_ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Tempo de expiracao do token | `43200` (30 dias) |
| `ADMIN_EMAIL` | Email do admin padrao | `admin@txeka.co.mz` |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt da password admin | `$2b$12$...` |

### Opcionais

| Variavel | Padrao | Descricao |
|----------|--------|-----------|
| `ENVIRONMENT` | `development` | `development` / `staging` / `production` |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |
| `API_V1_STR` | `/api/v1` | Prefixo da API |
| `PROJECT_NAME` | `Txeka Ntiyiso` | Nome do projeto nos logs |
| `BACKEND_CORS_ORIGINS` | `[]` | Lista de origens CORS permitidas |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Tempo de expiracao do refresh token |
| `RATE_LIMIT_GLOBAL` | `100/minute` | Limite global de requisicoes |
| `RATE_LIMIT_LOGIN` | `5/minute` | Limite de tentativas de login |
| `RATE_LIMIT_CERTIFY` | `10/minute` | Limite de emissoes |

---

## Migrations com Alembic

### Estrutura

```
api-gateway/
|-- alembic/
|   |-- versions/
|   |   |-- 001_initial_schema.py
|   |   |-- 002_add_audit_logs.py
|   |   |-- 003_add_institutions_and_credits.py
|   |   +-- 004_fix_pending_status.py
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

Em Docker local, a migration e executada no command do docker-compose:
```yaml
command: >
  sh -c "cd /app/api-gateway &&
         poetry run alembic upgrade head &&
         poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload"
```

> **Nota:** O Dockerfile local (na raiz) **nao** executa alembic automaticamente. O alembic e executado via docker-compose.

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

### Erro: "SECRET_KEY environment variable is required"

**Causa:** Variavel de ambiente nao configurada.

**Solucao:**
- Adicione `SECRET_KEY` e `JWT_SECRET_KEY` no dashboard do Render ou no `.env`
- O sistema falha hard (RuntimeError) se estas variaveis nao estiverem presentes

---

## Checklist Pre-Deploy

### Antes de cada deploy em producao:

- [ ] Tests passam localmente: `poetry run pytest`
- [ ] Bandit sem vulnerabilidades: `poetry run bandit -r src/`
- [ ] Migrations testadas: `poetry run alembic upgrade head`
- [ ] Variaveis de ambiente atualizadas no Render
- [ ] `SECRET_KEY` tem >= 32 caracteres
- [ ] `JWT_SECRET_KEY` tem >= 32 caracteres
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

docker exec txeka-ntiyiso-db pg_dump -U postgres txeka_ntiyiso > $BACKUP_DIR/$FILENAME

# Manter apenas ultimos 30 dias
find $BACKUP_DIR -name "txeka_backup_*.sql" -mtime +30 -delete

echo "Backup concluido: $FILENAME"
```

### Restaurar Backup

```bash
docker exec -i txeka-ntiyiso-db psql -U postgres txeka_ntiyiso < txeka_backup_20260722.sql
```

---

## Monitoramento

### Logs

O sistema utiliza logging padrao Python com configuracao em `settings.py`:

```python
LOG_LEVEL = "INFO"  # DEBUG | INFO | WARNING | ERROR
```

Logs sao escritos em:
- **Console:** Em desenvolvimento
- **Ficheiro:** `/app/logs/` em producao (via volume Docker)

### Metricas

| Metrica | Endpoint | Frequencia |
|---------|----------|------------|
| Uptime | `/health` | A cada 30s |
| Emissoes | `/api/v1/audit/stats` | Diaria |
| Verificacoes | `/api/v1/audit/stats` | Diaria |
| Erros 5xx | Logs Render | Em tempo real |

---

## Diferencas: Render vs. Docker Local

| Aspecto | Render (Cloud) | Docker Local |
|---------|---------------|--------------|
| Build | `poetry lock && poetry install` | `poetry install --only main` |
| Start | `poetry run uvicorn src.main:app` | `uvicorn api-gateway.src.main:app` |
| Alembic | Automatico (`upgrade head`) | Via docker-compose |
| Workers | 1 (`WEB_CONCURRENCY=1`) | 4 |
| Porta | `$PORT` (10000) | `8000` |
| WORKDIR | `api-gateway/` (auto) | `/app` |
| Dockerfile | Nao usa (build nativo) | `Dockerfile` na raiz |

---

## Contacto de Suporte

- **Email:** geral.txekantiyiso@gmail.com
- **GitHub Issues:** [github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues](https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues)
- **Status:** [https://txeka-ntiyiso-api.onrender.com/health](https://txeka-ntiyiso-api.onrender.com/health)

---

Txeka Ntiyiso - Orgulhosamente desenvolvido em Mocambique

Proprietary. All rights reserved. Txeka Ntiyiso, 2026.
