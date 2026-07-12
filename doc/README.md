# Documentação Txeka Ntiyiso

**Infraestrutura tecnológica para verificação da integridade e autenticidade documental em Moçambique**

---

> Esta documentação reúne os guias técnicos, operacionais, jurídicos e de segurança do Txeka Ntiyiso. Utilize o índice abaixo para aceder rapidamente ao conteúdo mais relevante para o seu perfil.

---

## Índice por Perfil

| Perfil | Documentos | O que vai encontrar |
|--------|-----------|---------------------|
| 👨‍💻 **Desenvolvedor / Integrador** | [API Reference](guides/API_REFERENCE.md) · [Arquitetura Técnica](technical/TECHNICAL.md) | Endpoints, schemas, exemplos de request/response, stack, fluxos de dados |
| 🏢 **Instituição / Operador** | [Manual do Utilizador](guides/USER_GUIDE.md) · [Estratégia de Implantação](technical/DEPLOYMENT.md) | Como emitir, verificar e revogar documentos; deploy, backup, monitoramento |
| ⚖️ **Jurista / Auditor / Regulador** | [Dossiê de Conformidade](legal/COMPLIANCE.md) · [Declaração de Posicionamento](../POSITIONING.md) | Lei 3/2017, Decreto 59/2019, posicionamento não-ICP, responsabilidades |
| 🔧 **DevOps / Operações** | [Runbook de Produção](technical/RUNBOOK.md) · [Políticas de Segurança](legal/SECURITY.md) | Checklist diário, troubleshooting, incident response, threat model |

---

## Estrutura da Pasta `doc/`

```
doc/
├── README.md              ← Está aqui — índice e navegação
│
├── guides/
│   ├── USER_GUIDE.md      ← Manual operacional para instituições
│   └── API_REFERENCE.md   ← Referência técnica completa da API
│
├── technical/
│   ├── TECHNICAL.md       ← Arquitetura, stack, schema SQL
│   ├── DEPLOYMENT.md      ← Docker, deploy nacional, infraestrutura
│   └── RUNBOOK.md         ← Operações, backups, troubleshooting
│
└── legal/
    ├── SECURITY.md        ← Políticas de segurança e threat model
    └── COMPLIANCE.md      ← Conformidade Lei 3/2017, Decreto 59/2019
```

> Para o estado atual do projeto, roadmap e contactos, consulte o [README principal](../README.md).
