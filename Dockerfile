# ============================================================
# TXEKA NTIYISO - API Gateway
# Plataforma de Validação Digital de Documentos - Moçambique
# Conformidade: Decreto 59/2019, Lei 3/2017
# Fuso horário: CAT (UTC+2)
# ============================================================

# -------- Stage 1: Builder --------
FROM python:3.11-slim AS builder

LABEL maintainer="Txeka Ntiyiso Team <contato@txeka.co.mz>"
LABEL description="API Gateway para validação criptográfica de documentos"
LABEL version="1.0.0"
LABEL country="MZ"
LABEL timezone="CAT"

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

LABEL maintainer="Txeka Ntiyiso Team <contato@txeka.co.mz>"
LABEL description="Txeka Ntiyiso API Gateway"

# Configuração de conformidade
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

# Cria usuário não-root
RUN groupadd -r txeka && useradd -r -g txeka -s /bin/false txeka

WORKDIR /app

# Copia dependências do builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copia código da aplicação
COPY api-gateway/ ./api-gateway/

# Permissões
RUN chown -R txeka:txeka /app

USER txeka

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "api-gateway.src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
