# TXEKA NTIYISO - API container
FROM python:3.11-slim

# Metadados da imagem
LABEL maintainer="Txeka Ntiyiso Team <contato@txekantiyiso.mz>"
LABEL description="API Gateway para validação criptográfica de documentos - Lei 3/2017"

# Diretório da aplicação
WORKDIR /app

# Instala dependências do sistema + curl pra healthcheck
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia ficheiros de dependências
COPY pyproject.toml poetry.lock* ./

# Instala dependências Python
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --only main


COPY . .

# Porta da API
EXPOSE 8000

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV PATH="/root/.local/bin:$PATH"

# Healthcheck igual docker-composeAe da
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=30s \
    CMD curl -f http://localhost:8000/health || exit 1

# Inicializa API - compose já faz alembic + reload em dev
CMD ["uvicorn", "api-gateway.src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
