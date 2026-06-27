# Documentação Txeka Ntiyiso

**Índice Mestre — Mapa de Navegação por Perfil**

---

Bem-vindo à documentação oficial do Txeka Ntiyiso. Esta página organiza toda a informação por perfil de utilizador. Escolha o seu caminho:

---

## 👨‍💻 Para Desenvolvedores e Integradores

| Documento | Descrição | O que vai encontrar |
|-----------|-----------|---------------------|
| [API Reference](guides/API_REFERENCE.md) | Referência completa da API REST | Endpoints, métodos, headers, exemplos de request/response, códigos de erro, rate limiting, SDKs Python e JavaScript |
| [Arquitetura Técnica](technical/TECHNICAL.md) | Stack, schema e decisões arquiteturais | FastAPI, PostgreSQL, JWT, fluxos de emissão/verificação/revogação, performance, monitoramento |

**Quick Start:**
```bash
git clone https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso.git
cd Txeka-Ntiyiso/api-gateway
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```
Aceda a `http://localhost:8000/docs` para Swagger interativo.

---

## 🏢 Para Instituições e Operadores

| Documento | Descrição | O que vai encontrar |
|-----------|-----------|---------------------|
| [Manual do Utilizador](guides/USER_GUIDE.md) | Guia operacional completo | Como emitir, verificar e revogar documentos; interpretação de resultados; FAQ; piloto 30 dias |
| [Estratégia de Implantação](technical/DEPLOYMENT.md) | Deploy e infraestrutura | Docker Compose, requisitos de hardware, SSL, backup, monitoramento, roadmap de infraestrutura |

**Contacto institucional:** tech@txeka.co.mz

---

## ⚖️ Para Juristas, Auditores e Reguladores

| Documento | Descrição | O que vai encontrar |
|-----------|-----------|---------------------|
| [Dossiê de Conformidade Legal](legal/COMPLIANCE.md) | Enquadramento jurídico completo | Artigos da Lei 3/2017, Decreto 59/2019, proteção de dados, soberania digital, responsabilidades e limitações |
| [Declaração de Posicionamento](../POSITIONING.md) | Posicionamento estratégico e não-ICP | Os 3 pilares, declaração formal de não-enquadramento como Entidade Certificadora, glossário jurídico-técnico |

---

## 🔧 Para DevOps e Equipas de Operações

| Documento | Descrição | O que vai encontrar |
|-----------|-----------|---------------------|
| [Runbook de Produção](technical/RUNBOOK.md) | Operações diárias e troubleshooting | Checklist de verificação, procedimentos comuns, resolução de incidentes, manutenção programada, contactos de emergência |
| [Políticas de Segurança Cibernética](legal/SECURITY.md) | Threat model e segurança | Requisitos da Lei 3/2017, criptografia, endpoints protegidos, ataques mitigados, incident response, conformidade checklist |

---

## 📊 Estrutura da Documentação

```
doc/
├── README.md                    ← Você está aqui
│
├── guides/
│   ├── USER_GUIDE.md            ← Manual operacional para instituições
│   └── API_REFERENCE.md         ← Referência técnica da API
│
├── technical/
│   ├── TECHNICAL.md             ← Arquitetura, stack, schema SQL
│   ├── DEPLOYMENT.md            ← Docker, deploy nacional, infraestrutura
│   └── RUNBOOK.md               ← Operações, backups, troubleshooting
│
└── legal/
    ├── SECURITY.md              ← Políticas de segurança e threat model
    └── COMPLIANCE.md            ← Conformidade Lei 3/2017, Decreto 59/2019
```

---

## 🗺️ Roadmap do Projecto

| Fase | Período | Estado | Descrição |
|------|---------|--------|-----------|
| Fase 1 | Q1 2026 | ✅ Concluída | MVP core: emissão, verificação, revogação, audit logs imutáveis |
| Fase 2 | Q2–Q3 2026 | 🔄 Em curso | Dashboard Web + Relatórios analíticos + Módulo de gestão de Instituições |
| Fase 3 | Q3 2026 | ⏳ Planeada | Go-to-market com clientes pilotos (INAGE, setor bancário) |
| Fase 4 | Q4 2026 | ⏳ Planeada | Escala empresarial: 2FA, OAuth2, ML fraud detection, multi-language |

> **Fase actual:** Fase 2 — desenvolvimento do dashboard institucional e módulo multi-tenant.

---

## 💬 Suporte

- **Email:** tech@txeka.co.mz
- **GitHub Issues:** [github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues](https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues)
- **Status do Sistema:** [https://txeka-ntiyiso-api.onrender.com/health](https://txeka-ntiyiso-api.onrender.com/health)

---

*Txeka Ntiyiso — Documentação Enterprise-Grade 🇲🇿*
"""
