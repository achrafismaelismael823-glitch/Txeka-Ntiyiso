# Txeka Ntiyiso — Posicionamento Estratégico

**Infraestrutura tecnológica para verificação da integridade e autenticidade documental em Moçambique**

---

## Declaração de Posição

> O Txeka Ntiyiso é uma infraestrutura digital de confiança B2G/B2B que contribui para a garantia da integridade e autenticidade documental através de mecanismos criptográficos, fornecendo evidências técnicas de suporte ao não-repúdio, sem armazenar os documentos originais nem competir com a ICP do Estado.

---

## Objetivo

Disponibilizar uma infraestrutura tecnológica que permita às instituições públicas e privadas verificar, de forma rápida e segura, a integridade de documentos digitais, reduzindo fraudes documentais e promovendo a interoperabilidade entre sistemas.

---

## Princípios de Posicionamento

| Princípio | Fundamento Jurídico-Técnico |
|-----------|---------------------------|
| **Integridade** | Qualquer alteração de um único byte no documento original gera um hash SHA-256 completamente diferente, tornando a adulteração matematicamente detetável. |
| **Autenticidade** | A impressão digital criptográfica vincula irrevogavelmente o documento à entidade emissora registada no sistema. |
| **Não-repúdio** | Cada operação (emissão, verificação, revogação) é registada imutavelmente com selo temporal sincronizado ao fuso horário oficial de Moçambique (CAT, UTC+2), fornecendo evidências técnicas de suporte. |
| **Privacidade por Design** | Armazenamento exclusivo de hashes de 64 caracteres. Zero retenção de documentos originais, zero processamento de dados pessoais identificáveis. |
| **Interoperabilidade** | API REST padronizada para integração com sistemas governamentais e corporativos existentes, sem necessidade de substituição de infraestruturas legadas. |
| **Auditabilidade** | Logs imutáveis estruturados em JSON, acessíveis para auditorias internas, externas e perícias forenses digitais. |
| **Segurança por Defeito** | Configurações técnicas seguras por padrão, com mascaramento de IPs em consultas públicas e isolamento lógico de tenants. |

---

## Os 3 Pilares

### 1. Camada de Confiança Intermédia (Middleware de Integridade)

O sistema não compete com os órgãos emissores de documentos (como o INAGE, Ministérios ou Universidades), nem tenta substituir a Infraestrutura de Chaves Públicas (ICP) do Estado. O Txeka Ntiyiso posiciona-se exatamente no meio: recebe o documento do cliente de forma local, extrai a sua impressão digital criptográfica (hash SHA-256) e carimba uma prova de existência imutável na base de dados.

> O hash SHA-256 funciona como uma impressão digital criptográfica única do documento: qualquer alteração de um único byte gera um hash completamente diferente, tornando a falsificação detetável instantaneamente.

### 2. Facilitador de Desmaterialização Pública e Privada

O projeto resolve o problema da falsificação de documentos em Moçambique através de duas frentes estratégicas:

| Frente | Descrição | Benefício |
|--------|-----------|-----------|
| **B2G (Governo)** | Permite que instituições públicas verifiquem instantaneamente a autenticidade de certidões, alvarás, DUATs ou diplomas emitidos por outras instâncias do Estado. | Redução drástica da burocracia física, filas e intermediação fraudulenta entre órgãos. |
| **B2B (Empresas)** | Permite que bancos, seguradoras e empresas privadas validem documentos submetidos por clientes de forma automatizada via API. | Redução do risco de fraude operacional, mitigação de perdas financeiras e aceleração de processos KYC. |

### 3. Motor de Auditoria Conforme a Legislação Moçambicana

Ao registar cada ação de emissão, verificação e revogação na tabela audit_logs (com mascaramento de IP, método e identificador), o Txeka Ntiyiso assume a posição de um sistema de auditoria forense digital. Isto alinha a plataforma com os princípios de tratamento de trilhas de auditoria da Lei n.º 3/2017 (Lei das Transações Eletrónicas) e com as diretrizes da Resolução n.º 69/2021 (Política de Segurança Cibernética), servindo como evidência digital de suporte.

---

## Escopo Tecnológico

| Componente | Descrição |
|------------|-----------|
| **Hash SHA-256** | Algoritmo criptográfico que gera uma impressão digital única de 64 caracteres hexadecimais para cada documento. |
| **QR Code Verificável** | Código bidimensional que permite a qualquer cidadão verificar a autenticidade de um documento via telemóvel, sem registo obrigatório. |
| **API REST** | Interface padronizada para integração com sistemas governamentais e corporativos existentes. |
| **Logs de Auditoria** | Registos imutáveis estruturados em JSON de todas as operações, com retenção mínima de 20 anos. |
| **Zero-Knowledge Architecture** | Modelo onde a plataforma processa apenas hashes criptográficos, sem nunca ver, ler ou armazenar o documento original. |

---

## Escopo Regulatório

| Legislação / Regulamento | Alinhamento Txeka Ntiyiso |
|--------------------------|---------------------------|
| **Lei n.º 3/2017** (Transações Eletrónicas) | Foi concebido em conformidade com os princípios de integridade e não-repúdio via hashes SHA-256 imutáveis e logs de auditoria detalhados. |
| **Decreto n.º 59/2019** (Regulamento de Certificação) | Estrutura técnica e pipeline preparados para suporte à retenção de registos de logs por até 20 anos. |
| **Proteção de Dados e Privacidade** | Alinhado com o Capítulo V da Lei n.º 3/2017 através da arquitetura Zero-Knowledge, mitigando riscos ao não transitar dados sensíveis ou pessoais. |
| **Resolução n.º 69/2021** (Segurança Cibernética) | Mascaramento ativo de IPs em consultas públicas e isolamento lógico para proteção de infraestruturas críticas. |
| **Soberania Digital** | Arquitetura baseada em Docker, desenhada e pronta para deploys on-premises dentro de datacenters geolocalizados em território moçambicano, em resposta às exigências de localização de dados para Infraestruturas Críticas de Informação (ICI) previstas na PENSC. |

---

## Limitações e Escopo Excluído

> ⚠️ Declaração formal de não-enquadramento e limitações de escopo:

1. **Não somos uma Entidade Certificadora** — Não emitimos, não gerimos e não revogamos certificados digitais qualificados nos termos estritos da Lei n.º 3/2017.

2. **Não somos uma ICP concorrente** — Não operamos Infraestruturas de Chaves Públicas, não geramos pares de chaves assimétricas para os utilizadores finais, nem emitimos assinaturas digitais qualificadas.

3. **Não retemos dados pessoais** — Não armazenamos documentos originais nem metadados de identificação civil ou biográfica dos cidadãos nos nossos servidores centrais.

4. **Não substituímos órgãos emissores** — Não competimos com o INAGE, Ministérios, Conservatórias ou Universidades. Somos uma camada tecnológica de validação daquilo que estas entidades de direito já emitiram.

5. **Não prestamos serviço de Validação Cronológica Qualificada** — O registo de data e hora utiliza o fuso horário de Moçambique (CAT, UTC+2) sincronizado internamente na infraestrutura, funcionando exclusivamente como rasto de auditoria cronológica transacional para consistência de logs, não constituindo um serviço de Validação Cronológica qualificada nos termos do Decreto n.º 59/2019.

---

## O que Somos (Para Clientes e Parceiros)

| Atributo | Descrição | Benefício |
|----------|-----------|-----------|
| **Validador de Integridade** | Geramos uma impressão digital criptográfica (hash SHA-256) de qualquer documento. | Falsificação torna-se detetável — qualquer alteração de 1 byte muda o hash completamente. |
| **Motor de Auditoria** | Registamos imutavelmente cada emissão, verificação e revogação com selo temporal sincronizado ao fuso horário oficial de Moçambique (CAT, UTC+2). | Trilha de evidências digitais alinhada com os princípios de rasto de auditoria exigidos por lei. |
| **Guardião de Privacidade** | Arquitetura Zero-Knowledge: armazenamos apenas hashes de 64 caracteres. Zero documentos, zero dados pessoais (PII), zero chaves privadas. | Redução drástica do risco de vazamento de dados e alinhamento com a legislação de privacidade. |
| **Facilitador de Processos** | APIs REST que transformam validações manuais e físicas em auditorias criptográficas automáticas de menos de 100 milissegundos. | Redução significativa no tempo de verificação documental e custos operacionais. |

---

## Riscos Mitigados por Stakeholder

| Stakeholder | Risco Operacional | Como o Txeka Ntiyiso Mitiga |
|-------------|-------------------|----------------------------|
| **Governo (B2G)** | Falsificação de certidões, alvarás e DUATs entre órgãos; burocracia de validação cruzada. | Verificação criptográfica instantânea (< 100ms) entre instituições, eliminando deslocações físicas e intermediários. |
| **Empresas (B2B)** | Fraude documental em processos KYC, onboarding e compliance; perdas financeiras por documentos adulterados. | Validação automatizada via API REST com deteção matemática de adulterações, reduzindo risco operacional. |
| **Reguladores (INTIC)** | Incumprimento de retenção de trilhas de auditoria; falta de evidências digitais em processos de fiscalização. | Logs imutáveis estruturados em JSON com retenção mínima de 20 anos, prontos para auditorias e perícias forenses. |
| **Cidadãos** | Vazamento de dados pessoais em plataformas de verificação; dependência de intermediários para autenticar documentos. | Arquitetura Zero-Knowledge: o documento original nunca sai do dispositivo do cidadão. Verificação via QR code sem registo obrigatório. |

---

## Para Quem É

| Stakeholder | O que Ganha | Como Acede |
|-------------|-------------|------------|
| **Governo (B2G)** | Interoperabilidade e verificação imediata de documentos entre Ministérios, INAGE, Direções Nacionais e Tribunais. | Dashboard Institucional + Integração via API REST |
| **Empresas (B2B)** | Validação automatizada de faturas, certidões de registo comercial, licenças e alvarás de clientes, reduzindo fraudes. | Chaves de API dedicadas para sistemas centrais (ERPs, CRMs, Core Bancário) |
| **Reguladores (INTIC / Auditoria)** | Transparência total e capacidade de extração de relatórios forenses digitais imutáveis. | Dashboard de Auditoria / Permissões de Leitura Exclusivas |
| **Cidadãos** | Consulta transparente e descentralizada da autenticidade do seu rasto documental. | Portal Público Web e verificação rápida via QR Code (sem registo obrigatório) |

---

## Diferenciação Competitiva

| Soluções Estrangeiras (DocuSign, Adobe Sign) | Txeka Ntiyiso |
|----------------------------------------------|---------------|
| Foco em Assinatura Eletrónica + ICP | Foco em Integridade Criptográfica |
| Retém documentos e dados sensíveis | Zero retenção de documentos/dados |
| Custo dolarizado em divisas (USD/EUR) | Faturação local em Meticais (MT) |
| Hospedagem em nuvens US/EU | Pronto para Deploy On-Premise em MZ |
| Genérico para o mercado global | Alinhado com a Legislação de Moçambique |

---

## Estado Atual do Projecto

| Fase | Período | Estado | Marco Operacional |
|------|---------|--------|-------------------|
| **Fase 1** | Q1 2026 | ✅ Concluída | MVP Core: endpoints de emissão, verificação, revogação e geração de logs estruturados em JSON. API operacional em ambiente de produção (Render + Supabase). |
| **Fase 2** | Q2–Q3 2026 | 🔄 Em curso | Dashboard Web, Módulo de Gestão de Entidades/Instituições, Emissão em Bulk e Relatórios de Auditoria. |
| **Fase 3** | Q3 2026 | ⏳ Planeada | Pilotos e Go-to-Market focado em Clientes Estratégicos (Instituições Públicas e Setor Bancário/Financeiro). |
| **Fase 4** | Q4 2026 | ⏳ Planeada | Escalabilidade corporativa avançada: Autenticação Multi-Fator (2FA), OAuth2 Enterprise e deteção de anomalias com ML. |

---

## Resumo Executivo

> "O Txeka Ntiyiso posiciona-se como a infraestrutura intermédia de transição digital que mitiga o problema da falsificação documental em Moçambique. Não emitimos certificados digitais nem chaves — validamos e blindamos matematicamente a integridade dos documentos que as instituições já emitem, com resposta em menos de 100ms, custo local em Meticais e retenção zero de documentos ou dados pessoais."

---

## Glossário de Posicionamento

| Termo | Definição no contexto Txeka Ntiyiso |
|-------|-------------------------------------|
| **Hash SHA-256** | Algoritmo criptográfico que gera uma cadeia imutável de 64 caracteres hexadecimais, funcionando como a identidade matemática irreversível de um ficheiro. |
| **Zero-Knowledge Architecture** | Modelo de engenharia onde a plataforma opera metadados e provas criptográficas sem nunca ver, ler ou armazenar o ficheiro ou dado pessoal original. |
| **Não-repúdio Transacional** | Fornecimento de evidências técnicas de que uma operação de registo ou revogação não pode ser negada pelo seu autor, devido à robustez e imutabilidade dos logs gerados pelo sistema. |
| **Prova de Existência Criptográfica** | Registo tecnológico seguro que atesta que um documento com determinado hash exato existia no momento do seu envio ao sistema. |
| **Middleware de Integridade** | Software de infraestrutura que atua de forma transparente entre o emissor e o verificador de um documento, garantindo que a informação não foi adulterada no caminho. |
| **Rasto de Auditoria Cronológica Transacional** | Registo temporal de operações (emissão, verificação, revogação) para consistência de logs e trilha forense, não constituindo validação cronológica qualificada. |

---

Txeka Ntiyiso — Infraestrutura de Confiança para a Transformação Digital de Moçambique 🇲🇿
