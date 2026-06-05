# TXEKA NTIYISO - API container

FROM python:3.10-slim

# Metadados da imagem
LABEL maintainer="DocVerify Team <agy@docverify.mz>"
LABEL description="API Gateway para validação criptográfica de documentos"

# Diretório da aplicação
WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia ficheiros de dependências
COPY pyproject.toml poetry.lock* ./

# Instala dependências Python
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

# Copia código da aplicação
COPY . .

# Porta da API
EXPOSE 8000

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Inicializa API
CMD ["uvicorn", "api-gateway.src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
