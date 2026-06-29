# Txeka Ntiyiso

**Plataforma de Validação Digital de Documentos de Moçambique**

---

## Declaração de Posição

O **Txeka Ntiyiso** é uma plataforma de infraestrutura digital **B2G (Business-to-Government)** e **B2B (Business-to-Business)** que garante a **autenticidade, integridade e não-repúdio** de documentos digitais através de criptografia **SHA-256** e **QR codes verificáveis**.

Atuando como um **serviço descentralizado de verificação de integridade e validação cronológica**, o sistema complementa o ecossistema legal moçambicano sem a necessidade de reter ou gerir certificados digitais privados dos utilizadores.

> **Declaração Regulatória:** O Txeka Ntiyiso **não se enquadra como Entidade Certificadora** nos termos da Lei n.º 3/2017. Não emite certificados digitais qualificados, chaves privadas nem assinaturas digitais. Atua exclusivamente como **validador de integridade criptográfica** e **motor de auditoria cronológica**.

---

## Estado Atual do Projeto

| Fase | Período | Estado | Descrição |
|------|---------|--------|-----------|
| **Fase 1** | Q1 2026 | ✅ Concluída | MVP core: emissão, verificação, revogação, audit logs imutáveis |
| **Fase 2** | Q2–Q3 2026 | 🔄 **Em curso** | **Registo de Instituições + Dashboard Web + Relatórios analíticos** |
| **Fase 3** | Q3 2026 | ⏳ Planeada | Queries agregadas `/audit/stats` + Go-to-market com INAGE e bancos |
| **Fase 4** | Q4 2026 | ⏳ Planeada | Dashboard por perfil (Admin/Instituição/Governo) + Escala empresarial |

> **Fase 2 — O que estamos a construir agora:** Sistema de registo de instituições com controlo de créditos, dashboard web com métricas em tempo real, e relatórios analíticos para administração.

---

## O Problema

O mercado moçambicano enfrenta desafios críticos na validação documental:

- **Falsificação generalizada:** Certificados académicos, títulos de terra (DUATs), licenças corporativas e documentos públicos circulam com elevada incidência de adulteração.
- **Ineficiência operacional:** Processos de verificação manual geram atrasos burocráticos que impactam diretamente a prestação de serviços públicos e o onboarding bancário (KYC).
- **Ausência de ferramenta integrada:** O Governo não dispõe de uma solução unificada de validação interinstitucional, forçando deslocações físicas e duplicação de esforços.
- **Dependência externa:** Empresas e instituições públicas recorrem a soluções estrangeiras que retêm dados sensíveis, incorrem em custos em divisas e não estão alinhadas com a legislação moçambicana.

---

## A Solução

O Txeka Ntiyiso implementa um pipeline de validação de quatro etapas:

| Etapa | Ação | Resultado |
|-------|------|-----------|
| 1. Emissão | A instituição emissora submete o documento ao sistema | Geração de **hash SHA-256** único + **QR code** verificável |
| 2. Distribuição | O documento com QR code é entregue ao titular | O cidadão pode verificar autenticidade a qualquer momento |
| 3. Verificação | O verificador scaneia o QR ou submete o PDF via portal/API | Validação em **< 100 milissegundos**: "Autêntico", "Falso" ou "Revogado" |
| 4. Auditoria | Cada operação é registada imutavelmente | Trilha forense completa com retenção de **20 anos** |

---

## Características Técnicas

- **Criptografia SHA-256:** Algoritmo de hashing padrão bancário. Qualquer alteração de um único byte no documento original gera um hash completamente diferente, tornando a falsificação matematicamente detetável.
- **QR Code Verificável:** O cidadão scaneia o código do telemóvel, sem necessidade de registo ou instalação de aplicação.
- **Revogação Legal:** Documentos podem ser invalidados administrativamente, com registo obrigatório de motivo, autor e timestamp.
- **Multi-Instituição (Fase 2):** Arquitetura multi-tenant que permite a coexistência de INAGE, Ministérios, bancos, seguradoras e imobiliárias no mesmo sistema, com segregação completa de dados e controlo de créditos por entidade.
- **Auditoria Forense:** Registo imutável de quem verificou, quando, de que IP, com que resultado.
- **Conformidade Lei 3/2017:** Garantia de autenticidade, integridade e não-repúdio nos termos da Lei das Transações Eletrónicas de Moçambique.
- **Retenção de 20 Anos:** Conformidade absoluta com o Decreto n.º 59/2019, que estabelece o prazo mínimo de conservação de registos de validação.
- **Privacidade por Design (Zero-Knowledge):** A plataforma processa e armazena exclusivamente **hashes criptográficos de 64 caracteres**. Os documentos originais nunca saem do ambiente do cliente, eliminando por completo o risco de vazamento de dados pessoais.

---

## Arquitetura do Sistema

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Backend | FastAPI 0.110 + Python 3.11 | API REST, lógica de negócio, autenticação JWT |
| Base de Dados | PostgreSQL (Supabase) | Persistência ACID de hashes, metadados e audit logs |
| Frontend | React + Tailwind CSS | Portal de verificação, dashboard institucional |
| Segurança | JWT (pyjwt) + bcrypt + Rate Limiting | Autenticação stateless, hashing de passwords, proteção contra abuso |
| Deploy | Render.com (Produção atual) / Docker (Futuro) | Cloud para operação imediata; on-premise para soberania digital |

### Deploy Atual: Produção Cloud (Render.com + Supabase)

- **API:** [https://txeka-ntiyiso-api.onrender.com](https://txeka-ntiyiso-api.onrender.com)
- **Health Check:** [https://txeka-ntiyiso-api.onrender.com/health](https://txeka-ntiyiso-api.onrender.com/health)
- **Status:** Online e operacional
- **Database:** Supabase PostgreSQL

### Futuro: Produção Nacional (Docker On-Premise)

A migração para infraestrutura nacional é estratégica para:
- **Soberania digital:** Dados armazenados em território moçambicano
- **Conformidade futura:** Antecipação da Lei de Proteção de Dados Pessoais
- **Resiliência:** Funcionamento independente de conectividade internacional
- **Auditoria:** Acesso físico a servidores por entidades reguladoras

| Ambiente | Hosting | Fase | Uso Principal |
|----------|---------|------|---------------|
| **Produção Cloud** | Render.com + Supabase | **Atual** | Operação imediata, alta disponibilidade |
| **Produção Nacional** | Docker + Servidores MZ | **Migração futura** | Soberania digital, intranet governamental |
| **Híbrido** | Docker Edge + Cloud | **Futuro** | Resiliência máxima, contingência offline |

---

## Como Começar

### Para Desenvolvedores

```bash
# Clonar o repositório e aceder ao módulo da API
git clone https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso.git
cd Txeka-Ntiyiso/api-gateway

# Configurar e ativar o ambiente virtual
python -m venv .venv
source .venv/bin/activate

# Instalar dependências e iniciar o servidor local
pip install -r requirements.txt
uvicorn src.main:app --reload
```

Aceda a `http://localhost:8000/docs` para a documentação Swagger interativa.

### Para Instituições (Fase 2 — Lista de Espera)

Contacte: **tech@txeka.co.mz**

- **Demo estratégica (15 minutos):** Apresentação da plataforma às equipas de decisão.
- **Piloto operacional (30 dias, sem custo):** Implementação em ambiente de teste da instituição.
- **Integração API:** Documentação completa, SDKs e suporte técnico dedicado.
- **Suporte 24/7:** Disponibilidade garantida para operações críticas.

> **Nota:** O registo de novas instituições está a ser feito manualmente pelo administrador durante a Fase 2. Em breve, o processo será automatizado via portal de administração.

---

## Endpoints Principais

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| `POST` | `/api/v1/certify` | Emitir / Registar integridade do documento | Instituição (JWT) |
| `GET` | `/api/v1/verify/{hash}` | Verificar documento (consulta pública rápida) | Público |
| `POST` | `/api/v1/verify` | Verificar documento (validação em lote B2B/B2G) | API Key |
| `POST` | `/api/v1/emissions/{doc_id}/revoke` | Revogar documento (invalidação legal) | Admin / Instituição |
| `GET` | `/api/v1/audit/logs` | Logs de auditoria imutáveis | Administrador |
| `GET` | `/api/v1/audit/document/{hash}/history` | Rasto cronológico e histórico do documento | Admin / Instituição |
| `GET` | `/api/v1/audit/stats` | Métricas e volume de validações (Fase 3) | Administrador |

> Documentação interativa completa disponível localmente em `/docs` ou `/redoc`.

---

## Índice de Documentação Interna

Para especificações detalhadas e manuais operacionais, consulte a nossa estrutura em `doc/`:

- **Desenvolvimento & Integração:** [Referência da API](doc/guides/API_REFERENCE.md) · [Arquitetura Técnica](doc/technical/TECHNICAL.md)
- **Operações Institucionais:** [Manual do Utilizador](doc/guides/USER_GUIDE.md) · [Estratégia de Implantação](doc/technical/DEPLOYMENT.md)
- **Jurídico & Compliance:** [Dossiê de Conformidade Legal](doc/legal/COMPLIANCE.md) · [Declaração de Posicionamento](POSITIONING.md)
- **Segurança & DevOps:** [Runbook de Produção](doc/technical/RUNBOOK.md) · [Políticas de Segurança Cibernética](doc/legal/SECURITY.md)

---

## Conformidade Legal e Retenção de Dados

O Txeka Ntiyiso cumpre integralmente o regime jurídico moçambicano de validação eletrónica:

| Legislação | Âmbito | Alinhamento Txeka Ntiyiso |
|------------|--------|---------------------------|
| **Lei n.º 3/2017** | Transações Eletrónicas de Moçambique | Integridade, autenticidade e não-repúdio via hashes imutáveis |
| **Decreto n.º 59/2019** | Serviços de Validação Cronológica e Eletrónica | Retenção mínima de 20 anos; trilha de auditoria completa |
| **Banco de Moçambique** | Conformidade transacional | Segurança, rastreabilidade e disponibilidade para o setor financeiro |

- **Proteção de Dados:** Em total conformidade com as garantias de privacidade previstas na Lei n.º 3/2017. A arquitetura Zero-Knowledge elimina por completo o processamento de dados pessoais sensíveis em servidores centrais.
- **Retenção de Registos:** Os hashes e logs de auditoria imutáveis são conservados de forma redundante pelo período mínimo de **20 anos**, conforme exigido pelo Decreto n.º 59/2019.

---

## Roadmap Estratégico

| Fase | Período | Estado | Descrição |
|------|---------|--------|-----------|
| **Fase 1** | Q1 2026 | ✅ Concluída | MVP core validado: emissão, verificação, revogação, audit logs imutáveis |
| **Fase 2** | Q2–Q3 2026 | 🔄 **Em curso** | **Registo de Instituições + Dashboard Web + Relatórios analíticos** |
| **Fase 3** | Q3 2026 | ⏳ Planeada | Queries agregadas `/audit/stats` + Go-to-market com INAGE e bancos |
| **Fase 4** | Q4 2026 | ⏳ Planeada | Dashboard por perfil (Admin/Instituição/Governo) + Escala empresarial: 2FA, OAuth2, ML fraud detection |

---

## Suporte e Contacto

- **Email:** tech@txeka.co.mz
- **GitHub Issues:** [github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues](https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues)
- **Status do Sistema:** [https://txeka-ntiyiso-api.onrender.com/health](https://txeka-ntiyiso-api.onrender.com/health)

---

## Licença

*Proprietary. All rights reserved. Txeka Ntiyiso, 2026.*

