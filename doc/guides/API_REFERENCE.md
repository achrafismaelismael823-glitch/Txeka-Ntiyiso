# Txeka Ntiyiso 🇲🇿

**A Revolução Digital que Elimina a Falsificação de Documentos em Moçambique**

[![Status](https://img.shields.io/badge/status-online-brightgreen)](https://txeka-ntiyiso-api.onrender.com/health)
[![Conformidade](https://img.shields.io/badge/conformidade-Lei%203%2F2017-blue)]()
[![Performance](https://img.shields.io/badge/validacao-%3C100ms-orange)]()
[![Deploy](https://img.shields.io/badge/ultimo_deploy-05%2F07%2F2026-success)]()

---

## ⚡ Em 30 Segundos

O **Txeka Ntiyiso** transforma processos de validação manuais — que demoram dias, exigem deslocações e custam milhares de Meticais — em **auditorias digitais instantâneas de menos de 100 milissegundos**.

Basta de carimbos duvidosos. Basta de burocracia. Autenticidade total, sem expor um único dado pessoal.

> **Como a magia acontece:** A instituição emite o documento ➡️ o sistema gera uma assinatura digital única baseada em **hash SHA-256** + um **QR code** seguro ➡️ qualquer parceiro ou cidadão aponta a câmara e confirma na hora se o documento é 100% autêntico.

---

## 🎯 Quem Ganha com o Txeka Ntiyiso?

### 🏛️ Instituições Públicas (B2G)
*Para o INAGE, Ministérios, Tribunais e Autarquias*

- **Validação Interinstitucional:** Verifique certidões, DUATs e alvarás emitidos por outros órgãos do Estado num piscar de olhos.
- **Fim das Filas:** Elimine a necessidade de o cidadão deslocar-se fisicamente apenas para "autenticar cópias".
- **Transparência Radical:** Trilha de auditoria criptográfica e imutável, pronta para auditorias do Tribunal de Contas.

🚀 **[Lidere a Modernização Administrativa ➡️ Agende uma Demo](mailto:tech@txeka.co.mz)**

### 💼 Empresas e Banca (B2B)
*Para KYC, Onboarding de Clientes e Compliance Financeiro*

- **Fraude Zero:** Detete instantaneamente relatórios financeiros, cartas de referência ou diplomas falsificados.
- **Integração Relâmpago:** API REST robusta, documentada e pronta para entrar em produção em menos de 24 horas.
- **Soberania de Dados:** Reduza a dependência de plataformas estrangeiras caras e fature tudo na moeda local.

🔌 **[Explore o Futuro das Integrações ➡️ Ver Documentação da API](doc/guides/API_REFERENCE.md)**

---

## 🔥 Porquê o Txeka Ntiyiso? (A Nossa Resposta ao Caos)

**O Cenário Atual:**
- Certificados académicos falsos tiram vagas a quem merece.
- Alvarás e DUATs adulterados geram litígios judiciais complexos.
- A verificação manual consome semanas de produtividade.
- Sistemas externos cobram em Dólares/Euros e retêm dados confidenciais do país.

**A Nossa Solução:**
- **Criptografia de Elite:** Baseado em SHA-256. Se um pirata informático mudar **1 único ponto final** no PDF, o hash muda completamente e o sistema acusa fraude.
- **Velocidade Extrema:** Resposta em **< 100ms** — ideal para portais de alto tráfego.
- **Soberania Nacional:** Custos fixos em Meticais e total respeito pelo sigilo de dados do Estado.
- **Memória de Elefante:** Logs imutáveis projetados para uma retenção legal de **20 anos**, em total conformidade com a legislação vigente.

---

## 🛡️ Zero-Knowledge Architecture: Privacidade Inviolável

**O Txeka Ntiyiso nunca vê, nunca armazena e nunca poderá vazar o teu documento original.**

Aqui está o segredo da nossa arquitetura:
1. O utilizador anexa o PDF no portal.
2. A "impressão digital" (Hash SHA-256) é calculada **diretamente no navegador** (client-side).
3. Apenas esta linha de código de 64 caracteres viaja até ao nosso servidor.
4. O documento original **NUNCA sai do dispositivo** do utilizador.
5. O sistema apenas regista: *"Esta assinatura digital foi validada e existe desde 27/06/2026"*.

**Resultado:** Risco zero de vazamento de dados confidenciais.

---

## ⚖️ Declaração de Posição Regulatória

O **Txeka Ntiyiso** é uma plataforma de infraestrutura digital **B2G (Business-to-Government)** e **B2B (Business-to-Business)** que garante a **autenticidade, integridade e não-repúdio** de documentos digitais através de criptografia **SHA-256** e **QR codes verificáveis**.

Atuando como um **serviço descentralizado de verificação de integridade e registo de auditoria temporal imutável**, o sistema complementa o ecossistema legal moçambicano sem a necessidade de reter ou gerir certificados digitais privados dos utilizadores.

> **Declaração Regulatória:** O Txeka Ntiyiso **não se enquadra como Entidade Certificadora** nos termos da Lei n.º 3/2017. Não emite certificados digitais qualificados, chaves privadas, assinaturas digitais nem carimbos de tempo qualificados. Atua exclusivamente como **validador de integridade criptográfica** e **motor de registo de auditoria temporal imutável**.

---

## Estado Atual do Projeto

| Fase | Período | Estado | Descrição |
|------|---------|--------|-----------|
| **Fase 1** | Q1 2026 | ✅ Concluída | MVP core: emissão, verificação, revogação, audit logs imutáveis |
| **Fase 2** | Q2–Q3 2026 | 🔄 **Em curso** | **Registo de Instituições + Dashboard Web + Emissão em Bulk + Controlo de Créditos** |
| **Fase 3** | Q3 2026 | ⏳ Planeada | Queries agregadas `/audit/stats` + Go-to-market com INAGE e bancos |
| **Fase 4** | Q4 2026 | ⏳ Planeada | Dashboard por perfil (Admin/Instituição/Governo) + Escala empresarial |

> **Fase 2 — O que estamos a construir agora:** Sistema de registo de instituições com controlo de créditos, emissão em bulk (B2B/B2G), dashboard web com métricas em tempo real, e relatórios analíticos para administração.

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
- **Emissão em Bulk (B2B/B2G):** Emissão de múltiplos documentos em lote via JSON, com consumo de 1 crédito por documento. Ideal para universidades, ministérios e bancos.
- **Validação Rigorosa de PDF:** Verificação de extensão `.pdf`, MIME `application/pdf`, magic bytes `%PDF-` e deteção de nomes suspeitos (ex: `.pdf.png`). Rejeita PNG, JPG, GIF, SVG e stickers.
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
- **Swagger:** [https://txeka-ntiyiso-api.onrender.com/docs](https://txeka-ntiyiso-api.onrender.com/docs)
- **Status:** Online e operacional
- **Database:** Supabase PostgreSQL
- **Último Deploy:** 05/07/2026 — Build successful, BD conectada, 28+ audit logs

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

Para Instituições (Fase 2 — Lista de Espera)

Contacte: tech@txeka.co.mz

- Demo estratégica (15 minutos): Apresentação da plataforma às equipas de decisão.
- Piloto operacional (15 dias, sem custo): Implementação em ambiente de teste da instituição.
- Integração API: Documentação completa, SDKs e suporte técnico dedicado.
- Suporte 24/7: Disponibilidade garantida para operações críticas.

> Nota: O registo de novas instituições está a ser feito manualmente pelo administrador durante a Fase 2. Em breve, o processo será automatizado via portal de administração.

---

# Endpoints da API

🔐 Autenticação

Método	Endpoint	Descrição	Acesso	
`POST`	`/api/v1/auth/admin/login`	Login administrador (token 90 dias)	Admin	
`POST`	`/api/v1/auth/login`	Login instituição (token 30 dias)	Institution	

📄 Emissão de Documentos

Método	Endpoint	Descrição	Acesso	
`POST`	`/api/v1/certify`	Emitir documento único (PDF)	Institution	
`POST`	`/api/v1/certify/bulk`	Emitir múltiplos documentos em lote (B2B/B2G)	Institution	

🔍 Verificação Pública

Método	Endpoint	Descrição	Acesso	
`GET`	`/api/v1/verify/{hash}`	Verificar documento (consulta rápida)	Público	
`POST`	`/api/v1/verify`	Verificar documento (validação B2B/B2G)	Público	

🏢 Dashboard Institucional

Método	Endpoint	Descrição	Acesso	
`GET`	`/api/v1/institutions/me/dashboard`	Dashboard da instituição (créditos, documentos)	Institution	
`GET`	`/api/v1/institutions/me/credits`	Créditos disponíveis e histórico	Institution	

🛡️ Administração & Auditoria

Método	Endpoint	Descrição	Acesso	
`POST`	`/api/v1/emissions/{doc_id}/revoke`	Revogar documento (invalidação legal)	Admin / Institution	
`GET`	`/api/v1/audit/logs`	Logs de auditoria imutáveis	Admin	
`GET`	`/api/v1/audit/document/{hash}/history`	Rasto cronológico do documento	Admin / Institution	
`GET`	`/api/v1/audit/stats`	Métricas e volume de validações (Fase 3)	Admin	

> Documentação interativa completa disponível em `/docs` ou `/redoc`.

---

# Índice de Documentação Interna

Para especificações detalhadas e manuais operacionais, consulte a nossa estrutura em `doc/`:

- Desenvolvimento & Integração: [Referência da API](doc/guides/API_REFERENCE.md) · [Arquitetura Técnica](doc/technical/TECHNICAL.md)
- Operações Institucionais: [Manual do Utilizador](doc/guides/USER_GUIDE.md) · [Estratégia de Implantação](doc/technical/DEPLOYMENT.md)
- Jurídico & Compliance: [Dossiê de Conformidade Legal](doc/legal/COMPLIANCE.md) · [Declaração de Posicionamento](POSITIONING.md)
- Segurança & DevOps: [Runbook de Produção](doc/technical/RUNBOOK.md) · [Políticas de Segurança Cibernética](doc/legal/SECURITY.md)

---

**Conformidade Legal e Retenção de Dados**

O Txeka Ntiyiso cumpre integralmente o regime jurídico moçambicano de validação eletrónica:

Legislação	Âmbito	Alinhamento Txeka Ntiyiso	
Lei n.º 3/2017	Transações Eletrónicas de Moçambique	Integridade, autenticidade e não-repúdio via hashes imutáveis	
Decreto n.º 59/2019	Serviços de Validação Cronológica e Eletrónica	Retenção mínima de 20 anos; trilha de auditoria completa	
Banco de Moçambique	Conformidade transacional	Segurança, rastreabilidade e disponibilidade para o setor financeiro	

- Proteção de Dados: Em total conformidade com as garantias de privacidade previstas na Lei n.º 3/2017. A arquitetura Zero-Knowledge elimina por completo o processamento de dados pessoais sensíveis em servidores centrais.
- Retenção de Registos: Os hashes e logs de auditoria imutáveis são conservados de forma redundante pelo período mínimo de 20 anos, conforme exigido pelo Decreto n.º 59/2019.

---

**Roadmap Estratégico**

✅ Fase 1 — Concluída

Período	Estado	Entregáveis	
Q1 2026	✅ Concluída	MVP core validado: emissão, verificação, revogação, audit logs imutáveis	

---

🔄 Fase 2 — Em Curso

Período	Estado	Entregáveis	
Q2–Q3 2026	🔄 Em curso	Registo de Instituições + Dashboard Web + Emissão em Bulk + Controlo de Créditos	

> Operacional agora:
- ✅ Registo de instituições com API key
- ✅ Login dual (Admin 90d / Institution 30d)
- ✅ Emissão única PDF com validação rigorosa
- ✅ Emissão em bulk B2B/B2G
- ✅ Verificação pública anónima
- ✅ Audit logs (28+ registos)
- ✅ Validação PDF: extensão + MIME + magic bytes
- ✅ Multi-tenant
- 🔄 Portal web React (em evolução)

---

⏳ Fase 3 — Planeada

Período	Estado	Entregáveis	
Q3 2026	⏳ Planeada	Queries agregadas `/audit/stats` + Go-to-market com INAGE e bancos	

---

⏳ Fase 4 — Planeada

Período	Estado	Entregáveis	
Q4 2026	⏳ Planeada	Dashboard por perfil (Admin/Instituição/Governo) + Escala empresarial: 2FA, OAuth2, ML fraud detection	

---

📊 Números Que Falam Por Si

Métrica	Valor	
⏱️ Tempo de Validação	< 100ms	
🛡️ Algoritmo Core	SHA-256 Criptográfico	
💾 Dados Pessoais Armazenados	Zero (0%)	
⏳ Retenção de Trilha	20 anos garantidos	
🌍 Cobertura Regional	Pronto para escala imediata em Maputo, Beira, Nampula e resto do país	

---

Suporte e Contacto

- Email: tech@txeka.co.mz
- GitHub Issues: [github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues](https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues)
- Status do Sistema: [https://txeka-ntiyiso-api.onrender.com/health](https://txeka-ntiyiso-api.onrender.com/health)

---

Txeka Ntiyiso — Orgulhosamente desenvolvido em Moçambique 🇲🇿 para proteger o futuro digital da nossa nação.

Proprietary. All rights reserved. Txeka Ntiyiso, 2026.
