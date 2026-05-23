# Dockerfile - DocVerify MZ
# Imagem base com Python 3.10 slim para reduzir tamanho
FROM python:3.10-slim

# Definir metadados
LABEL maintainer="DocVerify Team <agy@docverify.mz>"
LABEL description="API Gateway para Custódia e Validação Criptográfica de Documentos"

# Definir directório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias para bibliotecas Python
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar ficheiros de dependências
COPY pyproject.toml poetry.lock* ./

# Instalar Poetry e dependências
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

# Copiar código da aplicação
COPY . .

# Expor porta padrão da API
EXPOSE 8000

# Variáveis de ambiente padrão
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Comando para iniciar a aplicação
CMD ["uvicorn", "api-gateway.src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
