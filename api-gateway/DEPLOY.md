# 🚀 Deploy em Produção — Txeka Ntiyiso

## Opção 1: Render.com (Recomendado — PaaS Gerenciado)

### 1.1 Criar conta e projeto

1. Acesse: https://render.com
2. Conecte sua conta GitHub
3. Clique "New +" → "Web Service"

### 1.2 Configurar Web Service

| Campo | Valor |
|-------|-------|
| **Name** | txeka-ntiyiso-api |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `cd api-gateway && uvicorn src.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Starter ($7/mês) ou Free |

### 1.3 Criar PostgreSQL (Render Managed)

1. "New +" → "PostgreSQL"
2. **Name**: txeka-ntiyiso-db
3. **Plan**: Starter ou Free (90 dias)
4. Copie a **Internal Database URL**

### 1.4 Configurar Environment Variables

No dashboard do Web Service → "Environment":

```bash
# OBRIGATÓRIAS
SECRET_KEY=<gerar com openssl rand -hex 32>
JWT_SECRET_KEY=<gerar com openssl rand -hex 32>
DATABASE_URL=<Internal Database URL do PostgreSQL>

# OPICIONAIS
ENVIRONMENT=production
TXEKA_ALLOW_ANONYMOUS=false
ADMIN_EMAIL=admin@txeka.co.mz
