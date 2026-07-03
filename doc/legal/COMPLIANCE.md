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
| **Decreto n.º 59/2019** | Sistema de Certificação Digital | Cria o SCDM e estabelece os prazos de retenção mínima de 20 anos e requisitos de auditoria para serviços de validação |
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
- **SHA-256** do documento original calculado client-side (navegador)
- Qualquer alteração de **1 byte** gera hash completamente diferente
- Verificação compara hash calculado vs hash guardado no momento da emissão
- SHA-256 é função **one-way**: impossível reverter ou forjar colisão

**Evidência de conformidade:**
> Testes automatizados provam que alterar um único pixel num PDF invalida o documento. O hash do original (e3b0c44...) difere do hash alterado (f2a9b11...) em 100% dos caracteres.

### Artigo 16.º — Não-Repúdio

**Exigência legal:** A emissora não pode negar que emitiu o documento.

**Implementação Txeka Ntiyiso:**
- `issued_at`: Timestamp UTC+2 (CAT) da emissão, sincronizado com NTP
- `issued_by`: Email registado no JWT, auditável
- Tabela `audit_logs`: Todos os acessos guardados imutavelmente
- Logs estruturados (JSON): Quem verificou, quando, de que IP, resultado

**Evidência de conformidade:**
> Relatório de auditoria: "INAGE emitiu DUAT-INAGE-20260627-A1B2C3D4 em 27/06/2026 14:32:15 CAT por admin@inage.gov.mz. Verificado 47 vezes por 23 IPs distintos. Revogado em 28/06/2026 09:15:00 CAT por admin@inage.gov.mz. Motivo: Documento falsificado detectado em auditoria interna."

---

## Decreto n.º 59/2019 — Validação Cronológica

### Artigo 5.º — Retenção de Registos (20 Anos)

**Exigência legal:** Período mínimo de 20 anos para a conservação de registos probatórios e auditorias de validação eletrónica.

**Implementação Txeka Ntiyiso:**
- **Hashes SHA-256**: Conservados indefinidamente (mínimo 20 anos)
- **Logs de auditoria**: Imutáveis, impossível editar ou apagar
- **Timestamps**: Sincronizados com NTP, fuso horário CAT (UTC+2)
- **Revogações**: Registadas com razão, autor e timestamp

**Garantia técnica:**
> A base de dados PostgreSQL utiliza transações ACID. Os registos de auditoria são append-only. Não existe endpoint ou função administrativa para editar ou eliminar logs históricos.

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
| **Prevenção de crimes cibernéticos** | Mitigação de falsificação documental, roubo de identidade e fraude via hashes SHA-256 imutáveis |
| **Resiliência e continuidade** | Backups automáticos, RTO 4h, RPO 15min, replicação multi-região |
| **Governança e auditoria** | Logs imutáveis, trilha forense completa, acesso restrito a administradores |
| **Consciencialização** | Documentação transparente de segurança para instituições e reguladores |

> **Nota:** O Txeka Ntiyiso protege infraestruturas digitais de validação documental, mitigando crimes como falsificação e roubo de identidade, em alinhamento com os objectivos estratégicos da PENSC.

---

## Proteção de Dados e Privacidade

### Princípio Zero-Knowledge

O Txeka Ntiyiso implementa **Privacidade por Design** (Privacy by Design):

| Dado | Processado? | Armazenado? | Nota |
|------|-------------|-------------|------|
| Documento original (PDF) | Sim (client-side) | **Não** | Hash calculado no navegador |
| Hash SHA-256 | Sim | **Sim** | 64 caracteres hexadecimais |
| Metadados (data, tipo, instituição) | Sim | **Sim** | Sem identificação pessoal |
| Dados pessoais (nome, BI, NIF) | **Não** | **Não** | Nunca solicitados |
| Chaves privadas | **Não** | **Não** | Não faz parte do modelo |

**Resultado:** A plataforma **nunca** processa dados pessoais identificáveis (PII). Está isenta de obrigações de registo de proteção de dados ao abrigo da Lei n.º 3/2017.

### Conformidade com a Lei n.º 3/2017 (Proteção de Dados e Privacidade)

O Txeka Ntiyiso implementa o princípio de **Privacidade por Design** (Privacy by Design), garantindo conformidade absoluta com as regras de sigilo e salvaguarda de dados previstas na Lei n.º 3/2017:

- **Minimização:** A plataforma processa e armazena exclusivamente hashes criptográficos de 64 caracteres hexadecimais. Os documentos originais (PDFs) nunca saem do ambiente do cliente (processamento client-side), eliminando qualquer risco de fuga de dados sensíveis ou PII (Personally Identifiable Information).
- **Integridade e Rastreabilidade:** Os logs de auditoria garantem transparência total sobre as operações realizadas pelas instituições autorizadas, sem expor dados dos cidadãos titulares dos documentos.

**Resultado:** Como a plataforma não recolhe, armazena ou processa dados pessoais identificáveis no seu servidor central, mitiga-se a necessidade de processos burocráticos complexos de notificação de bases de dados, mantendo o foco na segurança matemática pura.

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

| Tipo de Dado | Prazo de Retenção | Base Legal |
|--------------|-------------------|------------|
| Hashes SHA-256 | Indefinido (mínimo 20 anos) | Decreto 59/2019 |
| Logs de auditoria | Indefinido (mínimo 20 anos) | Decreto 59/2019 |
| Metadados de documentos | Indefinido (mínimo 20 anos) | Decreto 59/2019 |
| Backups | 30 dias (ciclo) | Boa prática |

### Portabilidade e Interoperabilidade

- **Formato de exportação:** JSON (hashes + logs), SQL (dump completo)
- **API aberta:** Documentação Swagger para integração com sistemas governamentais
- **Docker:** Portabilidade total entre provedores, sem vendor lock-in

---

## Responsabilidades e Limitações

### O que o Txeka Ntiyiso Garante

1. **Integridade matemática:** O hash SHA-256 prova que o documento não foi alterado desde a emissão.
2. **Autenticidade de emissão:** O registo prova que uma instituição específica emitiu o documento num momento específico.
3. **Não-repúdio:** A emissora não pode negar a emissão, pois existe registo imutável.
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
| **Não-repúdio** | Impossibilidade de negar a emissão | Registo imutável com timestamp, actor e evidência criptográfica |
| **Hash SHA-256** | Não definido em lei (termo técnico) | Impressão digital matemática de 64 caracteres hexadecimais |
| **Zero-Knowledge** | Não definido em lei (termo técnico) | Arquitetura onde o servidor nunca acede ao conteúdo original |
| **Prova de existência** | Evidência de que um documento existia num momento | Registo temporal do hash na base de dados |
| **Selo de tempo** | Carimbo de tempo qualificado (ICP) | Registo temporal sincronizado com CAT (não qualificado) |
| **Entidade Certificadora** | Entidade autorizada a emitir certificados digitais | **Não aplicável** — Txeka Ntiyiso declara explicitamente não o ser |
| **ICP** | Infraestrutura de Chaves Públicas do Estado | **Não operada** — Txeka Ntiyiso é complementar, não concorrente |
| **Middleware de integridade** | Não definido em lei | Camada de software entre emissor e verificador que garante integridade sem substituir nenhum dos dois |
| **PENSC** | Política Nacional de Segurança Cibernética | Alinhamento com proteção de infraestruturas críticas e prevenção de crimes digitais |

---

## Declaração de Conformidade

O Txeka Ntiyiso declara, perante as entidades reguladoras e o público em geral, que:

1. Cumpre os requisitos de **autenticidade, integridade e não-repúdio** da Lei n.º 3/2017
2. Mantém **retenção mínima de 20 anos** nos termos do Decreto n.º 59/2019
3. **Não processa dados pessoais identificáveis**, conforme princípio de minimização da Lei n.º 3/2017
4. **Não se enquadra como Entidade Certificadora**, não competindo com a ICP-MZ
5. Está **pronto para deploy nacional**, garantindo soberania digital futura
6. Alinha-se com a **PENSC** (Resolução n.º 69/2021) na proteção de infraestruturas críticas e prevenção de crimes cibernéticos

---

*Txeka Ntiyiso — Dossiê de Conformidade Legal v1.1 🇲🇿*
