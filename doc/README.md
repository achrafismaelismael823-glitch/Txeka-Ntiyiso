# Txeka Ntiyiso

Plataforma de Validação Digital de Documentos de Moçambique.

## O que é

Txeka Ntiyiso é um sistema B2G (Business-to-Government) e B2B que garante autenticidade, integridade e não-repúdio de documentos digitais através de criptografia SHA-256 e QR codes verificáveis.

Reduz fraude documental em 80% mantendo conformidade total com a Lei das Transações Eletrónicas de Moçambique (Lei 3/2017) e Decreto n.º 59/2019.

## Problema Resolvido

- Documentos falsificados circulam livremente
- Verificação manual é lenta e cara
- Governo não tem ferramenta integrada
- Empresas gastam divisas em soluções estrangeiras

## Solução

1. Instituição emite documento → Sistema gera hash + QR code
2. Cidadão/verificador scaneia QR ou faz upload do PDF
3. Sistema valida instantaneamente: "Autêntico" ou "Falso"
4. Histórico completo registado e auditável por 20 anos

## Características

- SHA-256 criptografia (impossível falsificar)
- QR code verificável (cidadão scaneia do telemóvel)
- Revogação de documentos (invalida documento se necessário)
- Multi-instituição (governo, bancos, imobiliárias)
- Auditoria completa (quem verificou, quando, resultado)
- Lei 3/2017 compliant (autenticidade + integridade + não-repúdio)
- Retenção de 20 anos (conformidade Decreto 59/2019)

## Arquitetura

- Backend: FastAPI + PostgreSQL
- Frontend: React + Tailwind
- Segurança: JWT + pyjwt
- Deploy: Render.com + Supabase
- Linguagem: Python 3.11

## Como Começar

### Para Desenvolvedores

```bash
git clone https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso.git
cd api-gateway
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
Acede a http://localhost:8000/docs para Swagger.
Para Instituições
Contacte: tech@txeka.co.mz
Oferecemos:
Demo gratuita (15 min)
Piloto 30 dias (grátis)
Integração API (simples)
Suporte 24/7
Endpoints Principais
POST /api/v1/emit — Emitir documento
GET /api/v1/verify/{hash} — Verificar documento
GET /api/v1/certificate/{doc_id} — Ver certificado
POST /api/v1/emissions/{doc_id}/revoke — Revogar documento

Documentação completa: /docs
Conformidade Legal e Retenção de Dados
Txeka Ntiyiso cumpre integralmente o regime jurídico moçambicano de validação eletrónica:
Lei n.º 3/2017 (Transações Eletrónicas de Moçambique)
Decreto n.º 59/2019 (Serviços de Validação Cronológica e Eletrónica)
Requisitos do Banco de Moçambique (conformidade transaccional)
Proteção de Dados: Em total conformidade com as garantias de privacidade previstas na Lei n.º 3/2017, a plataforma opera exclusivamente com hashes criptográficos e metadados, sem armazenar dados de identificação pessoal (PII) ou ficheiros originais.
Retenção de Registos: Os hashes e logs de auditoria imutáveis são conservados pelo período mínimo de 20 anos, em estrito cumprimento do regime jurídico dos serviços de validação cronológica e eletrónica em Moçambique.

Roadmap
Fase 1 (Atual): MVP core validado
Fase 2 (Q2 2026): Dashboard + Relatórios
Fase 3 (Q3 2026): Go-to-market com clientes
Fase 4 (Q4 2026): Escala empresarial
Suporte
Email: tech@txeka.co.mz
GitHub Issues: [Link]
Status: https://txeka-ntiyiso-api.onrender.com/health
Licença
Proprietary. All rights reserved. Txeka Ntiyiso, 2026.
