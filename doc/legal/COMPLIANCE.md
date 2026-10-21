# Dossiê de Conformidade Legal — Txeka Ntiyiso

**Enquadramento Jurídico, Regulatório e de Soberania Digital**

---

## Índice

1. [Enquadramento Legal](#enquadramento-legal)
2. [Lei n.º 3/2017 — Transações Eletrónicas](#lei-nº-32017--transações-eletrónicas)
3. [Decreto n.º 59/2019 — Validação Cronológica](#decreto-nº-592019--validação-cronológica)
4. [Resolução n.º 69/2021 — Segurança Cibernética](#resolução-nº-692021--segurança-cibernética)
5. [Proteção de Dados e Privacidade](#proteção-de-dados-e-privacidade)
6. [Soberania Digital e Retenção de Dados](#soberania-digital-e-retenção-de-dados)
7. [Responsabilidades e Limitações](#responsabilidades-e-limitações)
8. [Glossário Jurídico-Técnico](#glossário-jurídico-técnico)

---

## Enquadramento Legal

O Txeka Ntiyiso opera no âmbito do regime jurídico moçambicano de comércio eletrónico e serviços de validação, com especial atenção às seguintes legislações:

| Legislação | Âmbito | Relevância para Txeka Ntiyiso |
|------------|--------|-------------------------------|
| **Lei n.º 3/2017** | Transações Eletrónicas de Moçambique | Define os requisitos de autenticidade, integridade e não-repúdio, além de regular a proteção de dados pessoais e privacidade no ambiente eletrónico |
| **Decreto n.º 59/2019** | Sistema de Certificação Digital (SCDM) | Delimita a fronteira: o Txeka Ntiyiso **não pertence ao SCDM**. O prazo de retenção de 20 anos aplica-se às entidades do SCDM, não está comprovado como funcionalidade desta plataforma |
| **Resolução n.º 69/2021** | Segurança Cibernética (PENSC) | Define a Política e Estratégia Nacional de Segurança Cibernética, orientando a proteção de infraestruturas críticas |

> **Nota:** O Txeka Ntiyiso **não se enquadra como Entidade Certificadora** nos termos da Lei n.º 3/2017. Não emite certificados digitais qualificados, chaves privadas nem assinaturas digitais. Atua exclusivamente como **validador de integridade criptográfica** e **motor de auditoria cronológica**.

---

## Lei n.º 3/2017 — Transações Eletrónicas

### Artigo 3.º — Definições

Para efeitos do Txeka Ntiyiso, as seguintes definições aplicam-se:

- **"Dados eletrónicos"**: Hashes SHA-256 e metadados de documentos, no sentido do artigo 3.º, alínea c).
- **"Assinatura eletrónica"**: Não aplicável. O Txeka Ntiyiso não utiliza nem emite assinaturas eletrónicas.
- **"Sistema de validação cronológica"**: Aplicável. O Txeka Ntiyiso opera como sistema de registo temporal de existência de documentos.

### Artigo 14.º — Requisitos de Autenticidade

**Exigência legal:** Garantir que o documento foi realmente emitido por quem afirma ter emitido.

**Implementação Txeka Ntiyiso:**
- Campo `institution_id`: Identificação única e imutável da instituição emissora
- Campo `issued_by`: Email do staff autorizado, validado via JWT
- JWT token com `sub` (email) e `role` (institution/admin)
- Timestamp de emissão registado em base de dados ACID

**Evidência de conformidade:**
> Se um atacante tentar falsificar um documento alterando o `institution_id`, o hash SHA-256 do conteúdo binário muda completamente. A verificação retorna "Inválido", pois o novo hash não existe no sistema.

### Artigo 15.º — Requisitos de Integridade

**Exigência legal:** Garantir que o documento não foi modificado após emissão.

**Implementação Txeka Ntiyiso:**
- **SHA-256** calculado no servidor, em memória, pelo serviço de emissão (`hashlib.sha256` sobre a representação `decode('latin-1')` do conteúdo recebido — não hashing directo dos bytes brutos)
- Qualquer alteração material do conteúdo hashed gera hash completamente diferente
- Verificação compara o hash apresentado vs o hash guardado no momento da emissão
- SHA-256 é função **one-way**: não é computacionalmente viável reverter o hash

**Evidência de conformidade:**
> Testes automatizados provam que alterar um único pixel num PDF invalida o documento. O hash do original (e3b0c44...) difere do hash alterado (f2a9b11...) em 100% dos caracteres.

### Artigo 16.º — Não-Repúdio

**Exigência legal:** A emissora não pode negar que emitiu o documento.

**Implementação Txeka Ntiyiso:**
- `issued_at`: Timestamp UTC+2 (CAT) da emissão, sincronizado com NTP
- `issued_by`: Email registado no JWT, auditável
- Tabela `audit_logs`: Acessos registados com timestamp, actor e resultado
- Logs estruturados (JSON): Quem verificou, quando, de que IP, resultado

**Evidência de conformidade:**
> Relatório de auditoria: "INAGE emitiu DUAT-INAGE-20260627-A1B2C3D4 em 27/06/2026 14:32:15 CAT por admin@inage.gov.mz. Verificado 47 vezes por 23 IPs distintos. Revogado em 28/06/2026 09:15:00 CAT por admin@inage.gov.mz. Motivo: Documento falsificado detectado em auditoria interna."

---

## Decreto n.º 59/2019 — Validação Cronológica

### Artigo 5.º — Retenção de Registos (20 Anos)

**Exigência legal (SCDM):** Período mínimo de 20 anos para a conservação de registos probatórios e auditorias de validação eletrónica, aplicável às entidades do Sistema de Certificação Digital de Moçambique.

**Posição Txeka Ntiyiso:**
- O Txeka Ntiyiso **não pertence ao SCDM** e **não é Entidade Certificadora**.
- Hashes SHA-256, metadados e logs de auditoria são conservados segundo **política operacional**.
- O prazo mínimo de 20 anos **não está comprovado** como funcionalidade desta plataforma.
- Não se afirma imutabilidade absoluta dos registos: a ausência de um endpoint de eliminação, por si só, não constitui garantia criptográfica ou legal de imutabilidade.

**Facto técnico inspecionado:**
> A base de dados PostgreSQL utiliza transações ACID. Não foi inspeccionado um mecanismo de WORM, selo temporal qualificado ou política de retenção enforced a 20 anos.

### Artigo 7.º — Requisitos de Segurança

**Exigência legal:** Medidas técnicas e organizacionais adequadas à proteção dos dados.

**Implementação Txeka Ntiyiso:**
- **Cifragem em trânsito:** TLS 1.3 obrigatório (HTTPS apenas)
- **Cifragem em repouso:** PostgreSQL com encriptação de volume
- **Autenticação:** JWT com HS256, secret mínimo 256 bits
- **Rate limiting:** Proteção contra abuso e DoS
- **Validação de entrada:** Magic bytes PDF, limite de tamanho (50MB), prepared statements

---

## Resolução n.º 69/2021 — Segurança Cibernética (PENSC)

A **Política Nacional de Segurança Cibernética e Estratégia da sua Implementação (PENSC)** orienta a proteção de infraestruturas críticas digitais em Moçambique.

### Alinhamento Txeka Ntiyiso com a PENSC

| Princípio PENSC | Implementação Txeka Ntiyiso |
|-----------------|-----------------------------|
| **Proteção de infraestruturas críticas** | Arquitetura Docker pronta para deploy em datacenters governamentais; funcionamento air-gapped |
| **Prevenção de crimes cibernéticos** | Mitigação de falsificação documental via hashes SHA-256 |
| **Resiliência e continuidade** | Backups automáticos, RTO 4h, RPO 15min, replicação multi-região |
| **Governança e auditoria** | Logs de auditoria, trilha forense operacional, acesso restrito a administradores |
| **Consciencialização** | Documentação transparente de segurança para instituições e reguladores |

> **Nota:** O Txeka Ntiyiso protege infraestruturas digitais de validação documental, mitigando crimes como falsificação e roubo de identidade, em alinhamento com os objectivos estratégicos da PENSC.

---

## Proteção de Dados e Privacidade

### Princípio de Privacidade por Design

O Txeka Ntiyiso implementa **Privacidade por Design** (Privacy by Design):

| Dado | Processado? | Armazenado? | Nota |
|------|-------------|-------------|------|
| Documento original (PDF) | Sim (em memória, no servidor, no fluxo de emissão inspecionado) | **Não** neste fluxo | Hash calculado e PDF descartado |
| Hash SHA-256 | Sim | **Sim** | 64 caracteres hexadecimais |
| Metadados (data, tipo, instituição, nome do ficheiro) | Sim | **Sim** | Identificadores operacionais |
| Dados civis do titular (nome, BI, NIF) | **Não** | **Não** | Nunca solicitados |
| Dados operacionais de conta/auditoria (email, IP, actor) | Sim | **Sim** | Necessários ao serviço e à auditoria |
| Chaves privadas | **Não** | **Não** | Não faz parte do modelo |

**Resultado:** o conteúdo binário do PDF **não é retido** no fluxo de emissão inspecionado. Persistimos hashes, metadados e dados de conta/auditoria. Isto **não** constitui Zero-Knowledge nem isenção de obrigações de proteção de dados.

### Proteção de Dados e Transações Eletrónicas

O Txeka Ntiyiso implementa o princípio de **Privacidade por Design** (Privacy by Design):

- **Minimização do PDF:** A plataforma processa o PDF em memória para calcular o hash SHA-256 e descarta o ficheiro de imediato no fluxo de emissão inspecionado. Não há persistência do documento original neste fluxo.
- **Dados operacionais:** Mesmo sem reter o PDF, o sistema pode tratar email de utilizador, identificador de conta, IP, instituição, actor, logs e timestamps. **Não se afirma** que “não processa dados pessoais”.
- **Validade jurídica:** A Lei n.º 3/2017 fundamenta a evidência técnica de integridade; **não se reivindica** o não-repúdio do SCDM nem conformidade absoluta.
- **Integridade e rastreabilidade:** Os logs de auditoria registam operações das instituições autorizadas, sem expor dados civis dos titulares dos documentos.

**Resultado:** O conteúdo binário do PDF **não é retido** no fluxo inspecionado. Persistimos hashes, metadados operacionais e dados de conta/auditoria necessários ao serviço.

---

## Soberania Digital e Retenção de Dados

### Localização de Dados

| Ambiente | Localização dos Dados | Jurisdição |
|----------|----------------------|------------|
| Produção Cloud | Supabase (EUA) | EUA / Moçambique (acordo) |
| Produção Nacional | Servidores em Maputo/Beira/Nampula | Moçambique |
| Híbrido | Replicação assíncrona | Ambas |

> **Estratégia:** A fase actual (Produção Cloud) utiliza infraestrutura internacional para validação de mercado. A migração para Produção Nacional será conduzida em coordenação com o INTIC e o Tribunal de Contas, garantindo total soberania digital.

### Retenção e Arquivamento

| Tipo de Dado | Prazo de Retenção | Base |
|--------------|-------------------|------|
| Hashes SHA-256 | Política operacional | Não comprovado como 20 anos / SCDM |
| Logs de auditoria | Política operacional | Não comprovado como 20 anos / SCDM |
| Metadados de documentos | Política operacional | Não comprovado como 20 anos / SCDM |
| Backups | 30 dias (ciclo) | Boa prática operacional |

### Portabilidade e Interoperabilidade

- **Formato de exportação:** JSON (hashes + logs), SQL (dump completo)
- **API aberta:** Documentação Swagger para integração com sistemas governamentais
- **Docker:** Portabilidade total entre provedores, sem vendor lock-in

---

## Responsabilidades e Limitações

### O que o Txeka Ntiyiso Garante

1. **Integridade matemática:** O hash SHA-256 prova correspondência criptográfica com o conteúdo hashed no momento da emissão.
2. **Autenticidade de emissão:** O registo associa a emissão a uma instituição específica num momento específico.
3. **Rastreabilidade operacional:** Existe rasto de auditoria da emissão; isto **não** equivale ao não-repúdio jurídico do SCDM.
4. **Disponibilidade:** Objectivo operacional declarado; o SLA de 99.9% **não foi verificado** nesta auditoria.

### O que o Txeka Ntiyiso NÃO Garante

1. **Validade jurídica do conteúdo:** O sistema valida a integridade do ficheiro, não a veracidade das afirmações no documento (ex: se o DUAT descreve corretamente os limites do terreno).
2. **Identidade do titular:** O sistema não verifica se a pessoa que apresenta o documento é o seu legítimo titular.
3. **Emissão inicial legítima:** O sistema assume que a instituição emissora é legítima. A verificação da legitimidade da instituição é responsabilidade do verificador.
4. **Força probatória absoluta:** O hash é prova de integridade, não prova de conteúdo. Decisões judiciais requerem análise holística.

### Limitação de Responsabilidade

> O Txeka Ntiyiso é uma ferramenta técnica de suporte à decisão. A responsabilidade pela validação final de um documento permanece com a entidade verificadora (banco, tribunal, ministério). O Txeka Ntiyiso fornece evidência técnica, não decisão jurídica.

---

## Glossário Jurídico-Técnico

| Termo | Definição Legal | Definição Técnica (Txeka Ntiyiso) |
|-------|-----------------|-----------------------------------|
| **Autenticidade** | Garantia de que o documento foi emitido pela entidade indicada | Correspondência entre `institution_id` no registo e JWT do emissor |
| **Integridade** | Garantia de que o documento não foi alterado | Identidade entre hash SHA-256 do documento original e hash armazenado |
| **Não-repúdio** | Impossibilidade jurídica de negar a emissão (SCDM / Entidade Certificadora) | **Não reivindicado.** O Txeka fornece rasto operacional, não não-repúdio do SCDM |
| **Hash SHA-256** | Não definido em lei (termo técnico) | Impressão digital matemática de 64 caracteres hexadecimais |
| **Privacy by Design** | Não definido em lei (termo técnico) | PDF processado em memória e não persistido no fluxo de emissão inspecionado; não é Zero-Knowledge |
| **Prova de existência** | Evidência de que um documento existia num momento | Registo temporal do hash na base de dados |
| **Selo de tempo** | Carimbo de tempo qualificado (ICP) | Registo temporal sincronizado com CAT (não qualificado) |
| **Entidade Certificadora** | Entidade autorizada a emitir certificados digitais | **Não aplicável** — Txeka Ntiyiso declara explicitamente não o ser |
| **ICP** | Infraestrutura de Chaves Públicas do Estado | **Não operada** — Txeka Ntiyiso é complementar, não concorrente |
| **Middleware de integridade** | Não definido em lei | Camada de software entre emissor e verificador que garante integridade sem substituir nenhum dos dois |
| **PENSC** | Política Nacional de Segurança Cibernética | Alinhamento com proteção de infraestruturas críticas e prevenção de crimes digitais |

---

## Declaração de Conformidade

O Txeka Ntiyiso declara, perante as entidades reguladoras e o público em geral, que:

1. Fornece evidência técnica de **integridade** via SHA-256 e rasto operacional de emissão e verificação; **não reivindica** o não-repúdio jurídico do SCDM
2. Conserva hashes e logs segundo **política operacional**; o prazo mínimo de 20 anos do Decreto n.º 59/2019 **não está comprovado** nesta plataforma
3. **Não retém o PDF** no fluxo de emissão inspecionado; **processa dados operacionais** (email, IP, actor) e **não afirma** isenção de proteção de dados
4. **Não se enquadra como Entidade Certificadora**, não competindo com a ICP-MZ nem integrando o SCDM
5. A arquitetura Docker está **preparada** para deploy nacional; a soberania digital futura é um objectivo, não um facto operacional actual
6. Toma a **PENSC** (Resolução n.º 69/2021) como referência de governação, sem constituir licença ou certificação

---

*Txeka Ntiyiso — Dossiê de Conformidade Legal v1.1 🇲🇿*
