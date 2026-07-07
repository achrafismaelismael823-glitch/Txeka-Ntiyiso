# ============================================================
# TXEKA NTIYISO - API Gateway
# Infraestrutura tecnológica nacional de verificação da
# integridade e autenticidade documental
#
# Conformidade: Lei 3/2017, Decreto 59/2019, Resolução 69/2021
# Fuso horário: CAT (UTC+2) - Moçambique
# Versão: 2.0.0
# ============================================================

# -------- Stage 1: Builder --------
FROM python:3.11-slim AS builder

LABEL maintainer="Txeka Ntiyiso Team <tech@txeka.co.mz>"
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

LABEL maintainer="Txeka Ntiyiso Team <tech@txeka.co.mz>"
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

# 4 workers Uvicorn para concorrência otimizada
CMD ["uvicorn", "api-gateway.src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
