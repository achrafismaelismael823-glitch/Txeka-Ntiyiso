# Dossiê de Conformidade Legal — Txeka Ntiyiso

**Enquadramento Jurídico, Regulatório e de Soberania Digital**

---

## Índice

1. [Enquadramento Legal](#enquadramento-legal)
2. [Lei n.º 3/2017 — Transações Eletrónicas](#lei-nº-32017--transações-eletrónicas)
3. [Decreto n.º 59/2019 — SCDM](#decreto-nº-592019--sistema-de-certificação-digital-scdm)
4. [Resolução n.º 69/2021 — Segurança Cibernética](#resolução-nº-692021--segurança-cibernética)
5. [Proteção de Dados e Privacidade](#proteção-de-dados-e-privacidade)
6. [Soberania Digital e Retenção de Dados](#soberania-digital-e-retenção-de-dados)
7. [Responsabilidades e Limitações](#responsabilidades-e-limitações)
8. [Glossário Jurídico-Técnico](#glossário-jurídico-técnico)

---

## Enquadramento Legal

O Txeka Ntiyiso opera no âmbito do regime jurídico moçambicano de transações eletrónicas, com especial atenção às seguintes legislações:

| Legislação | Âmbito | Relevância para Txeka Ntiyiso |
|------------|--------|-------------------------------|
| **Lei n.º 3/2017** | Transações Eletrónicas | Integridade criptográfica e evidência operacional (Arts. 14.º–16.º). Arts. 54.º–57.º e 59.º: não é Entidade Certificadora. Arts. 63.º–65.º: dados operacionais (email, IP, actor). Art. 13.º: classificação PISEOPD ainda não fechada |
| **Decreto n.º 59/2019** | Sistema de Certificação Digital de Moçambique (SCDM) | Delimita a fronteira: o Txeka Ntiyiso **não pertence ao SCDM** nem emite certificados digitais |
| **Decreto n.º 59/2023**, redacção do **Decreto n.º 44/2025** | Registo e licenciamento de PISEOPD | Obrigação condicional — classificação jurídica formal ainda não fechada |
| **Resolução n.º 69/2021** | Segurança Cibernética (PENSC) | Referência de governação e boas práticas; não constitui licença |

> **Nota:** O Txeka Ntiyiso é uma **infraestrutura tecnológica de verificação de integridade documental e evidência operacional**. **Não se enquadra como Entidade Certificadora** nos termos da Lei n.º 3/2017 (Arts. 54.º–57.º e 59.º) nem substitui o SCDM. Não emite certificados digitais, chaves privadas nem assinaturas digitais.

---

## Lei n.º 3/2017 — Transações Eletrónicas

### Artigo 3.º — Definições

Para efeitos do Txeka Ntiyiso, as seguintes definições aplicam-se:

- **"Dados eletrónicos"**: Hashes SHA-256 e metadados de documentos, no sentido do artigo 3.º, alínea c).
- **"Assinatura eletrónica"**: Não aplicável. O Txeka Ntiyiso não utiliza nem emite assinaturas eletrónicas.
- **"Sistema de validação cronológica"**: Não aplicável como serviço qualificado. O Txeka Ntiyiso regista timestamps de sistema (CAT) para rasto de auditoria operacional.

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
- **SHA-256** do documento original calculado no servidor, em memória; o PDF é descartado após o hash
- Qualquer alteração de **1 byte** gera hash completamente diferente
- Verificação compara hash calculado vs hash guardado no momento da emissão
- SHA-256 é função **one-way**: impossível reverter ou forjar colisão

**Evidência de conformidade:**
> Testes automatizados provam que alterar um único pixel num PDF invalida o documento. O hash do original (e3b0c44...) difere do hash alterado (f2a9b11...) em 100% dos caracteres.

### Artigo 16.º — Evidência operacional (não-repúdio do SCDM não reivindicado)

**Enquadramento:** O Txeka Ntiyiso **não confere, por si só, os efeitos jurídicos de não-repúdio** atribuídos às assinaturas e certificados do SCDM (Decreto n.º 59/2019, Art. 4.º). Fornece evidência técnica de integridade e rastreabilidade operacional da emissão e verificação.

**Implementação Txeka Ntiyiso:**
- `issued_at`: Timestamp UTC+2 (CAT) da emissão, sincronizado com NTP
- `issued_by`: Email registado no JWT, auditável
- Tabela `audit_logs`: Actor, instituição, acção, recurso e timestamp
- Logs estruturados (JSON): Quem verificou, quando, de que IP, resultado

**Evidência de conformidade:**
> Relatório de auditoria: "INAGE emitiu DUAT-INAGE-20260627-A1B2C3D4 em 27/06/2026 14:32:15 CAT por admin@inage.gov.mz. Verificado 47 vezes por 23 IPs distintos. Revogado em 28/06/2026 09:15:00 CAT por admin@inage.gov.mz. Motivo: Documento falsificado detectado em auditoria interna."

---

## Decreto n.º 59/2019 — Sistema de Certificação Digital (SCDM)

O Decreto n.º 59/2019 cria o **Sistema de Certificação Digital de Moçambique (SCDM)**. O Txeka Ntiyiso **não pertence ao SCDM** e **não deve ser apresentado como certificado digital**.

### Delimitação (Arts. 1.º, 2.º e 4.º do Regulamento)

| SCDM | Txeka Ntiyiso |
|------|---------------|
| Certificação digital, PKI, assinaturas electrónicas | Hash SHA-256 + QR + rasto de auditoria operacional |
| Pode conferir autenticidade, integridade, confidencialidade e não-repúdio no seu regime | Fornece correspondência criptográfica com o registo Txeka; **não constitui certificado digital emitido pelo SCDM** |

> A verificação Txeka comprova correspondência criptográfica com o registo Txeka; **não constitui certificado digital emitido pelo SCDM**.

**Implementação Txeka Ntiyiso:**
- **Documento original (PDF)**: Não retido — processado em memória e descartado após o hash
- **Hashes SHA-256**: Conservados para verificação de integridade, por política operacional
- **Logs de auditoria**: Append-only na aplicação; a evidência de tamper-evidence (hash chaining) ainda não está formalizada
- **Timestamps**: Sincronizados com NTP, fuso horário CAT (UTC+2) — rasto operacional, não validação cronológica qualificada
- **Revogações**: Registadas com razão, autor e timestamp

**Garantia técnica:**
> A base de dados PostgreSQL utiliza transações ACID. Não existe endpoint de aplicação para editar ou eliminar logs históricos. Isto **não equivale** a imutabilidade criptográfica nem a retenção legal de 20 anos.

---

## Resolução n.º 69/2021 — Segurança Cibernética (PENSC)

A **Política Nacional de Segurança Cibernética e Estratégia da sua Implementação (PENSC)** orienta a proteção de infraestruturas críticas digitais em Moçambique.

### Alinhamento Txeka Ntiyiso com a PENSC

| Princípio PENSC | Implementação Txeka Ntiyiso |
|-----------------|-----------------------------|
| **Proteção de infraestruturas críticas** | Arquitetura Docker pronta para deploy em datacenters governamentais; funcionamento air-gapped |
| **Prevenção de crimes cibernéticos** | Mitigação de falsificação documental, roubo de identidade e fraude via hashes SHA-256 imutáveis |
| **Resiliência e continuidade** | Backups automáticos, RTO 4h, RPO 15min, replicação multi-região |
| **Governança e auditoria** | Logs imutáveis, trilha forense completa, acesso restrito a administradores |
| **Consciencialização** | Documentação transparente de segurança para instituições e reguladores |

> **Nota:** O Txeka Ntiyiso protege infraestruturas digitais de validação documental, mitigando crimes como falsificação e roubo de identidade, em alinhamento com os objectivos estratégicos da PENSC.

---

## Proteção de Dados e Privacidade

### Princípio de Privacidade por Design

O Txeka Ntiyiso implementa **Privacidade por Design** (Privacy by Design):

| Dado | Processado? | Armazenado? | Nota |
|------|-------------|-------------|------|
| Documento original (PDF) | Sim (em memória, no servidor) | **Não** | Hash calculado e PDF descartado |
| Hash SHA-256 | Sim | **Sim** | 64 caracteres hexadecimais |
| Metadados (data, tipo, instituição) | Sim | **Sim** | Identificadores operacionais |
| Dados civis do titular (nome, BI, NIF) | **Não** | **Não** | Nunca solicitados |
| Chaves privadas | **Não** | **Não** | Não faz parte do modelo |

**Resultado:** o conteúdo binário do PDF **não é retido**. Persistimos hashes e metadados operacionais necessários à verificação e à auditoria.

### Conformidade com a Proteção de Dados e as Transações Eletrónicas

O Txeka Ntiyiso implementa o princípio de **Privacidade por Design** (Privacy by Design):

- **Direito à Privacidade:** Alinhado com o **Artigo 71.º da Constituição da República de Moçambique**, a plataforma aplica minimização de dados e não expõe dados de identificação civil do titular nos ecrãs públicos.
- **Minimização do PDF:** A plataforma processa o PDF em memória para calcular o hash SHA-256 e descarta o ficheiro de imediato. Não há persistência do documento original.
- **Dados operacionais (Lei n.º 3/2017, Arts. 63.º–65.º):** Mesmo sem reter o PDF, o sistema pode tratar email de utilizador, identificador de conta, IP, instituição, actor, logs e timestamps. Não se afirma que “não processa dados pessoais”.
- **Validade jurídica:** A **Lei n.º 3/2017 (Transações Eletrónicas)** fundamenta a evidência técnica de integridade (Art. 15.º) e de rastreabilidade operacional; **não se reivindica o não-repúdio do SCDM**.
- **Integridade e Rastreabilidade:** Os logs de auditoria registam operações das instituições autorizadas, sem expor dados civis dos titulares dos documentos.

**Resultado:** O conteúdo binário do PDF **não é retido**. Persistimos hashes, metadados operacionais e dados de conta/auditoria necessários ao serviço.

---

## Soberania Digital e Retenção de Dados

### Localização de Dados

| Ambiente | Localização dos Dados | Jurisdição |
|----------|----------------------|------------|
| Produção Cloud | Render + Supabase | Infraestrutura internacional; transferência e salvaguardas a documentar (Decreto n.º 72/2025) |
| Produção Nacional | Servidores em Maputo/Beira/Nampula | Moçambique |
| Híbrido | Replicação assíncrona | Ambas |

> **Estratégia:** A fase actual (Produção Cloud) utiliza infraestrutura internacional para validação de mercado. A migração para Produção Nacional será conduzida em coordenação com o INTIC e o Tribunal de Contas, garantindo total soberania digital.

### Retenção e Arquivamento

| Tipo de Dado | Prazo de Retenção | Base |
|--------------|-------------------|------|
| Hashes SHA-256 | Política operacional (a formalizar) | Finalidade: verificação de integridade |
| Logs de auditoria | Política operacional (a formalizar) | Finalidade: rasto de auditoria; evidência forense potencial |
| Email / actor / IP | Política operacional (a formalizar) | Lei n.º 3/2017, Arts. 63.º–65.º |
| Metadados de documentos | Política operacional (a formalizar) | Finalidade: emissão e verificação |
| Backups | 30 dias (ciclo) | Boa prática operacional |

Não existe disposição legal identificada que imponha ao Txeka Ntiyiso um prazo de 20 anos. A retenção define-se por finalidade, necessidade, contrato e política interna.

### Portabilidade e Interoperabilidade

- **Formato de exportação:** JSON (hashes + logs), SQL (dump completo)
- **API aberta:** Documentação Swagger para integração com sistemas governamentais
- **Docker:** Portabilidade total entre provedores, sem vendor lock-in

---

## Responsabilidades e Limitações

### O que o Txeka Ntiyiso Garante

1. **Integridade matemática:** O hash SHA-256 prova que o documento não foi alterado desde a emissão.
2. **Autenticidade de emissão:** O registo prova que uma instituição específica emitiu o documento num momento específico.
3. **Rastreabilidade operacional:** Existe registo de actor, instituição, timestamp e acção; **não se reivindica não-repúdio do SCDM**.
4. **Disponibilidade:** O serviço está disponível 99.9% do tempo (SLA).

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
| **Não-repúdio** | Efeito jurídico do SCDM (assinaturas/certificados) | **Não reivindicado.** O Txeka fornece evidência operacional de emissão e verificação |
| **Hash SHA-256** | Não definido em lei (termo técnico) | Impressão digital matemática de 64 caracteres hexadecimais |
| **Privacidade por Design** | Princípio de protecção desde a conceção (CRM Art. 71.º) | O PDF é processado em memória para o hash e descartado; o ficheiro original não é persistido |
| **Prova de existência** | Evidência de que um documento existia num momento | Registo temporal do hash na base de dados |
| **Selo de tempo** | Carimbo de tempo qualificado (ICP) | Registo temporal sincronizado com CAT (não qualificado) |
| **Entidade Certificadora** | Entidade autorizada a emitir certificados digitais | **Não aplicável** — Txeka Ntiyiso declara explicitamente não o ser |
| **ICP** | Infraestrutura de Chaves Públicas do Estado | **Não operada** — Txeka Ntiyiso é complementar, não concorrente |
| **Middleware de integridade** | Não definido em lei | Camada de software entre emissor e verificador que garante integridade sem substituir nenhum dos dois |
| **PENSC** | Política Nacional de Segurança Cibernética | Alinhamento com proteção de infraestruturas críticas e prevenção de crimes digitais |

---

## Declaração de Conformidade

O Txeka Ntiyiso declara, perante as entidades reguladoras e o público em geral, que:

1. Fornece evidência técnica de **integridade** (SHA-256) e **rastreabilidade operacional**, alinhada com a Lei n.º 3/2017 — **sem reivindicar os efeitos jurídicos do SCDM**
2. Conserva hashes e logs para verificação, por política operacional; **não retém o PDF original**
3. Minimiza dados do titular (Art. 71.º da Constituição); trata dados operacionais (email, IP, actor) nos termos dos Arts. 63.º–65.º da Lei n.º 3/2017
4. **Não se enquadra como Entidade Certificadora** nem substitui o SCDM (Lei n.º 3/2017, Arts. 54.º–57.º e 59.º; Decreto n.º 59/2019)
5. A classificação como PISEOPD (Decreto n.º 59/2023, redacção do Decreto n.º 44/2025) **ainda não está fechada**
6. Alinha-se com a **PENSC** (Resolução n.º 69/2021) como referência de governação, sem a tratar como licença

---

*Txeka Ntiyiso — Dossiê de Conformidade Legal v1.1 🇲🇿*
