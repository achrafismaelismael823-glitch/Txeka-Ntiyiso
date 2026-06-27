# Txeka Ntiyiso — Posicionamento Estratégico

**Plataforma Descentralizada de Verificação de Integridade e Validação Cronológica**

---

## Declaração de Posição (Uma frase)

> **O Txeka Ntiyiso é uma infraestrutura digital de confiança B2G/B2B que garante a integridade, autenticidade e não-repúdio de documentos digitais através de criptografia SHA-256, sem nunca armazenar os documentos originais nem competir com a ICP do Estado.**

---

## Os 3 Pilares

### 1. Camada de Confiança Intermédia (Middleware de Integridade)

O sistema não compete com os órgãos emissores de documentos (como o INAGE, Ministérios ou Universidades), nem tenta substituir a Infraestrutura de Chaves Públicas (ICP) do Estado. O Txeka Ntiyiso posiciona-se exatamente no meio: recebe o documento, extrai a sua **impressão digital matemática única (SHA-256)** e carimba uma **prova de existência imutável** na base de dados.

> O hash SHA-256 funciona como uma impressão digital matemática única do documento: qualquer alteração de um único byte gera um hash completamente diferente, tornando a falsificação detetável instantaneamente.

### 2. Facilitador de Desmaterialização Pública e Privada

O projeto resolve o problema da falsificação de documentos em Moçambique através de duas frentes:

| Frente | Descrição | Benefício |
|--------|-----------|-----------|
| **B2G (Governo)** | Permite que instituições públicas verifiquem instantaneamente a autenticidade de certidões, alvarás, DUATs ou diplomas emitidos por outras instâncias do Estado | Redução da burocracia física e intermediação entre órgãos |
| **B2B (Empresas)** | Permite que bancos, seguradoras e empresas privadas validem documentos submetidos por clientes de forma automatizada via API | Redução do risco de fraude operacional e aceleração de KYC |

### 3. Motor de Auditoria Conforme a Lei Moçambicana

Ao registar cada ação de emissão, verificação e revogação na tabela `audit_logs` (com IP, método e utilizador), o Txeka Ntiyiso assume a posição de um **sistema de auditoria forense**. Isto alinha a plataforma diretamente com as exigências da **Lei n.º 3/2017** (Lei das Transações Eletrónicas) e com os regulamentos do **INTIC**, servindo como uma **trilha de evidências digitais legalmente válidas**.

---

## O que somos (Para clientes e parceiros)

| Pilar | Descrição | Benefício |
|-------|-----------|-----------|
| **Validador de Integridade** | Geramos uma impressão digital matemática única (hash SHA-256) de qualquer documento | Falsificação torna-se impossível — qualquer alteração de 1 byte muda o hash completamente |
| **Motor de Auditoria** | Registamos imutavelmente cada emissão, verificação e revogação com selo temporal sincronizado à hora oficial de Moçambique (CAT, UTC+2) | Trilha de evidências digital válida por 20 anos, conforme a Lei 3/2017 |
| **Guardião de Privacidade** | Arquitetura Zero-Knowledge: armazenamos apenas hashes de 64 caracteres. Zero documentos, zero dados pessoais, zero chaves privadas | Eliminação total de risco de vazamento de dados e conformidade com proteção de dados |
| **Facilitador de Desmaterialização** | APIs REST que transformam validações manuais (dias de espera, filas, deslocações) em auditorias automáticas de **menos de 100 milissegundos** | Redução de 80% no tempo de verificação documental |

---

## O que NÃO somos (Para reguladores e entidades de supervisão)

> **Declaração formal de não-enquadramento:**

1. **Não somos uma Entidade Certificadora** — Não emitimos, não gerimos e não revogamos certificados digitais qualificados nos termos estritos da Lei n.º 3/2017.
2. **Não somos uma ICP concorrente** — Não operamos Infraestrutura de Chaves Públicas, não emitimos chaves privadas nem assinaturas digitais qualificadas.
3. **Não retemos dados pessoais** — Não armazenamos documentos originais, PII (Personally Identifiable Information), nem metadados identificáveis dos cidadãos.
4. **Não substituímos órgãos emissores** — Não competimos com INAGE, Ministérios ou Universidades. Somos uma **camada de confiança intermédia** que valida o que eles já emitiram.

> **Nota sobre selo temporal:** O registo temporal utiliza a hora oficial de Moçambique (CAT, UTC+2) sincronizada com o servidor da base de dados, funcionando como **prova de existência cronológica** e não como carimbo de tempo qualificado nos termos da ICP.

---

## Enquadramento Legal e Conformidade

| Legislação | Como cumprimos |
|------------|----------------|
| **Lei n.º 3/2017** (Transações Eletrónicas) | Garantimos integridade, autenticidade e não-repúdio via hashes imutáveis e logs de auditoria |
| **Decreto n.º 59/2019** | Retenção de registos por 20 anos; trilha de auditoria completa e imutável |
| **Proteção de Dados** | Arquitetura Zero-Knowledge elimina processamento de dados pessoais sensíveis |
| **Soberania Digital** | Arquitetura Docker pronta para deploy on-premise em datacenters nacionais |

---

## Para quem é

| Stakeholder | O que ganha | Como acede |
|-------------|-------------|------------|
| **Governo (B2G)** | Verificação instantânea entre instituições (INAGE, Ministérios, Tribunais) | Dashboard institucional + API |
| **Empresas (B2B)** | Validação automática de documentos de clientes, redução de fraude | API REST integrada |
| **Reguladores (INTIC, Tribunal de Contas)** | Relatórios de conformidade e auditoria forense completos | Dashboard de auditoria exclusivo |
| **Cidadãos** | Verificação gratuita via QR code, sem necessidade de registo | Portal público / Aplicação móvel |

---

## Diferenciação Competitiva

```
Soluções estrangeiras (DocuSign, Adobe Sign)          Txeka Ntiyiso
│                                                   │
▼                                                   ▼
Assinatura digital + ICP                        Hash de integridade
Retém documentos e dados                      Zero retenção de dados
Custo em divisas (USD/EUR)                    Custo em Meticais (MT)
Cloud exclusivo (US/EU)                      Pronto para deploy em MZ
Genérico para qualquer país                    Desenhado para legislação MZ
```

---

## Estado Actual do Projecto

| Fase | Estado | Descrição | Marco |
|------|--------|-----------|-------|
| Fase 1 | ✅ Concluída | MVP core: emissão, verificação, revogação, audit logs | API operacional em produção |
| Fase 2 | 🔄 Em curso | Dashboard Web + Relatórios + Gestão de Instituições | Previsão: Q3 2026 |
| Fase 3 | ⏳ Planeada | Go-to-market com INAGE e sector bancário | Q3 2026 |
| Fase 4 | ⏳ Planeada | Escala empresarial: 2FA, OAuth2, ML fraud detection | Q4 2026 |

> **Momento actual:** O Txeka Ntiyiso está em **Fase 2** de desenvolvimento. A API core está validada e operacional em produção (Render.com), com tráfego real de emissão e verificação. O foco actual é a construção do dashboard institucional, módulo de gestão de entidades e sistema de relatórios analíticos.

---

## Resumo Executivo (30 segundos)

> **"O Txeka Ntiyiso posiciona-se como a infraestrutura de transição digital que elimina a falsificação documental em Moçambique. Não emitimos certificados digitais — validamos a integridade matemática dos documentos que já existem. Sem armazenar documentos ou dados pessoais. Com conformidade total à Lei 3/2017. E com validações em menos de 100 milissegundos."**

---

## Glossário de Posicionamento

| Termo | Definição no contexto Txeka Ntiyiso |
|-------|-------------------------------------|
| **Hash SHA-256** | Impressão digital matemática de 64 caracteres hexadecimais que identifica unicamente o conteúdo de um documento |
| **Zero-Knowledge** | Arquitetura onde o servidor nunca tem acesso ao conteúdo original do documento, apenas ao seu hash |
| **Não-repúdio** | Garantia de que uma emissão ou verificação não pode ser negada posteriormente, graças aos logs imutáveis |
| **Prova de existência** | Registo temporal que demonstra que um documento existia num determinado momento, sem garantir a validade do seu conteúdo jurídico |
| **Middleware de integridade** | Camada de software que opera entre o emissor e o verificador, garantindo a integridade do documento sem substituir nenhum dos dois |

---

*Txeka Ntiyiso — Infraestrutura de Confiança para a Transformação Digital de Moçambique 🇲🇿*
"""
