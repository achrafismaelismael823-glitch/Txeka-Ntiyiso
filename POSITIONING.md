# Txeka Ntiyiso — Posicionamento Estratégico

**Infraestrutura tecnológica para o registo e a consulta de referências criptográficas associadas a documentos digitais em Moçambique**

---

## Declaração de Posição

> O Txeka Ntiyiso é uma infraestrutura tecnológica B2G/B2B destinada ao registo e à consulta de referências criptográficas associadas a documentos digitais. Permite consultar a existência e o estado dos respectivos registos e, quando suportado, a rastreabilidade operacional das operações. No fluxo de emissão inspecionado, o PDF é processado no servidor para cálculo da referência; o ficheiro original não é persistido neste fluxo. A plataforma não substitui as entidades competentes para emitir documentos ou manter os registos oficiais, nem compete com a ICP do Estado. A correspondência de uma referência criptográfica não prova, por si só, a identidade do emissor, a veracidade do conteúdo, a validade jurídica do documento nem o não-repúdio.

---

## Objetivo

Disponibilizar uma infraestrutura tecnológica que permita às instituições públicas e privadas registar referências criptográficas de documentos digitais e consultar a existência e o estado desses registos. A plataforma visa apoiar a gestão de risco documental. A redução de fraudes, os ganhos de eficiência e a interoperabilidade são benefícios esperados, dependentes dos mecanismos de integração, das permissões e dos acordos institucionais. A validade jurídica ou a autenticidade de um documento não são garantidas isoladamente pelo hash.

---

## Princípios de Posicionamento

| Princípio | Fundamento Jurídico-Técnico |
|-----------|---------------------------|
| **Integridade documental** | Princípio pretendido: a referência SHA-256 corresponde ao conteúdo processado no fluxo de emissão inspecionado. A detecção de alterações depende da correspondência entre esse conteúdo processado e a referência consultada; não constitui garantia universal de detecção de qualquer alteração nos bytes originais do ficheiro. |
| **Associação institucional** | Princípio pretendido: o registo associa a referência criptográfica a metadados da entidade emissora registada. Esta associação não equivale, por si só, a prova independente da identidade, da competência legal do emissor nem a uma vinculação irrevogável. |
| **Rastreabilidade operacional** | Capacidade implementada: operações de emissão, verificação e revogação são registadas com timestamp CAT (UTC+2). Isto constitui evidência operacional, não o não-repúdio jurídico do SCDM. |
| **Privacidade por Design** | Princípio pretendido, parcialmente implementado: no fluxo de emissão inspecionado, o PDF é processado no servidor para cálculo da referência e o ficheiro original não é persistido. Persistimos hashes, metadados e dados operacionais de conta/auditoria. A não persistência do PDF não equivale a Zero-Knowledge nem demonstra, por si só, conformidade integral com legislação de privacidade. |
| **Interoperabilidade** | Princípio pretendido: API REST para integração com sistemas existentes, sem necessidade de substituição de infraestruturas legadas. A interoperabilidade efectiva depende dos mecanismos de integração, das permissões e dos acordos institucionais. |
| **Auditabilidade** | Princípio pretendido: existem registos operacionais estruturados associados às operações suportadas. A existência destes registos não prova, por si só, imutabilidade absoluta, suficiência probatória para qualquer processo nem integridade criptográfica dos próprios logs. |
| **Segurança por Defeito** | Princípio pretendido: configurações técnicas seguras por padrão. Os registos associam operações a um identificador de instituição. O isolamento lógico integral entre tenants e o mascaramento de IPs em consultas públicas não foram confirmados no código inspecionado e não são aqui apresentados como capacidades verificadas. |

---

## Os 3 Pilares

### 1. Camada de Confiança Intermédia (Middleware de Integridade)

O sistema não compete com os órgãos emissores de documentos (como o INAGE, Ministérios ou Universidades), nem tenta substituir a Infraestrutura de Chaves Públicas (ICP) do Estado. O Txeka Ntiyiso posiciona-se como camada tecnológica de apoio: no fluxo de emissão inspecionado, recebe o PDF via API, processa-o no servidor, calcula a referência SHA-256 segundo o método actual, regista essa referência e os metadados associados, e não persiste o ficheiro original neste fluxo. A consulta permite verificar a existência e o estado do registo (incluindo INVALID, REVOKED e VALID).

O resultado da consulta não substitui a entidade emissora e não constitui, isoladamente, prova da identidade do emissor, da veracidade do conteúdo, da validade jurídica do documento nem do não-repúdio. A detecção de alterações depende da correspondência entre o conteúdo processado e a referência consultada; não é uma garantia universal de detecção de qualquer alteração do ficheiro original.

### 2. Facilitador de Desmaterialização Pública e Privada

O projecto apoia a modernização dos processos públicos e privados, disponibilizando o registo de referências criptográficas e a consulta do estado desses registos. Não substitui registos oficiais, entidades emissoras nem procedimentos legalmente obrigatórios. Distinguem-se as capacidades actuais, os casos de utilização pretendidos e os benefícios esperados:

| Frente | Capacidade actual / caso de utilização pretendido | Benefício esperado |
|--------|-----------|-----------|
| **B2G (Governo)** | Caso de utilização pretendido: instituições públicas consultam a existência e o estado do registo associado a certidões, alvarás, DUATs ou diplomas emitidos por outras instâncias do Estado. A consulta depende da API, das permissões e dos acordos institucionais. | Redução da burocracia física, filas e intermediação fraudulenta entre órgãos, quando a integração estiver operacional. |
| **B2B (Empresas)** | Caso de utilização pretendido: bancos, seguradoras e empresas privadas consultam o estado do registo de documentos submetidos por clientes, de forma automatizada via API. | Redução do risco de fraude operacional e aceleração de processos KYC, enquanto apoio à gestão de risco, sem garantia isolada de autenticidade ou validade jurídica. |

### 3. Motor de Auditoria e Rastreabilidade Operacional

Ao registar operações de emissão, verificação e revogação na tabela audit_logs (com identificador, método e endereço IP observados no código inspecionado), o Txeka Ntiyiso produz rasto de auditoria operacional. Estes registos podem apoiar o acompanhamento e a análise das operações. Não garantem automaticamente não-repúdio jurídico, suficiência probatória, imutabilidade absoluta, selagem temporal qualificada nem conformidade integral com a legislação. A Lei n.º 3/2017 e a Resolução n.º 69/2021 constituem referências para análise jurídica; a aplicabilidade concreta deverá ser determinada em função das actividades efectivamente prestadas e do regime aplicável. A plataforma não constitui certificado digital do SCDM.

---

## Escopo Tecnológico

| Componente | Descrição |
|------------|-----------|
| **Hash SHA-256** | Algoritmo criptográfico que gera uma referência de 64 caracteres hexadecimais a partir do conteúdo processado no fluxo de emissão inspecionado. Não constitui assinatura digital nem prova da identidade do emissor. |
| **QR Code Verificável** | Código bidimensional que contém o identificador documental e a referência/hash utilizados na consulta. Não constitui assinatura digital, certificado digital qualificado nem prova criptográfica independente da identidade do emissor. |
| **API REST** | Interface padronizada para integração com sistemas governamentais e corporativos existentes. A integração efectiva depende de permissões e acordos institucionais. |
| **Logs de Auditoria** | Registos operacionais estruturados das operações suportadas (emissão, verificação e revogação). Podem apoiar o acompanhamento das operações; não garantem automaticamente não-repúdio, imutabilidade absoluta nem suficiência probatória. O Txeka Ntiyiso não é Entidade Certificadora. |
| **Privacidade por Design** | No fluxo de emissão inspecionado, o PDF é processado no servidor para cálculo da referência e o ficheiro original não é persistido. Persistimos hashes, metadados e dados de conta/auditoria. A não persistência do PDF não equivale a Zero-Knowledge nem a ausência de dados pessoais. |

---

## Escopo Regulatório

| Legislação / Regulamento | Relevância para o Txeka Ntiyiso |
|--------------------------|---------------------------|
| **Lei n.º 3/2017** (Transações Eletrónicas) | Referência para análise jurídica. A plataforma regista referências SHA-256 e evidência operacional de emissão e verificação; não é Entidade Certificadora. Trata dados operacionais (email, IP, actor). A aplicabilidade concreta deverá ser determinada em função das actividades efectivamente prestadas e do regime aplicável. |
| **Decreto n.º 59/2019** (SCDM) | Referência de delimitação: o Txeka Ntiyiso **não se posiciona** como Entidade Certificadora do SCDM, **não se apresenta** como operador da ICP do Estado, e a consulta do registo **não constitui certificado digital**. |
| **Decreto n.º 59/2023** e **Decreto n.º 44/2025** (provedores intermediários e operadores de plataformas digitais) | Referências para análise jurídica. A classificação regulatória e a eventual necessidade de registo, licença, autorização ou declaração prévia encontram-se por determinar. A enumeração não constitui declaração de conformidade nem de isenção. |
| **Protecção de Dados e Privacidade** | Princípio de minimização: o PDF não é persistido no fluxo de emissão inspecionado. Persistimos hashes, metadados e dados de conta/auditoria. A não persistência do PDF não demonstra, por si só, conformidade integral com legislação de privacidade. |
| **Resolução n.º 69/2021** (Política e Estratégia Nacional de Segurança Cibernética) | Referência de governação. Os registos associam operações a um identificador de instituição. O isolamento lógico integral entre tenants e o mascaramento de IPs em consultas públicas não foram confirmados no código inspecionado. |
| **Lei n.º 13/2026** (Segurança Cibernética) e **Lei n.º 14/2026** (Crimes Cibernéticos) | Referências potencialmente relevantes. A incidência concreta sobre o Txeka Ntiyiso não foi estabelecida. |
| **Decreto n.º 71/2025** e **Decreto n.º 72/2025** (centros de dados e computação em nuvem) | Referências potencialmente relevantes. A utilização de serviços de alojamento não determina, por si só, a classificação jurídica da plataforma. A aplicabilidade deverá ser determinada em função das actividades e do regime aplicável. |
| **Soberania Digital** | Objectivo estratégico: arquitectura baseada em Docker, desenhada para eventual deploy on-premises em território moçambicano. Não constitui declaração de soberania digital garantida nem de conformidade com exigências de localização de dados. |

---

## Limitações e Escopo Excluído

> Declaração formal de não-enquadramento e limitações de escopo:

1. **Não nos posicionamos como Entidade Certificadora do SCDM** — Não emitimos, não gerimos e não revogamos certificados digitais qualificados. A classificação jurídica das actividades prestadas deverá ser determinada em função do regime aplicável.

2. **Não nos apresentamos como substituto da ICP do Estado** — Não operamos Infraestruturas de Chaves Públicas, não geramos pares de chaves assimétricas para os utilizadores finais, nem emitimos assinaturas digitais qualificadas.

3. **O PDF original não é persistido no fluxo de emissão inspecionado** — O ficheiro é processado no servidor para cálculo da referência. Persistimos hashes, metadados operacionais e dados de conta/auditoria (email, IP, actor). A não persistência do PDF não equivale a ausência de processamento, a ausência de dados pessoais nem a Zero-Knowledge. Não solicitamos identificação civil do titular do documento (nome, BI, NIF).

4. **Não substituímos a entidade competente para emitir o documento** — Não competimos com o INAGE, Ministérios, Conservatórias ou Universidades. Somos uma camada tecnológica de apoio ao registo e à consulta de referências associadas àquilo que estas entidades de direito já emitiram.

5. **Não oferecemos serviço de selagem temporal qualificada** — O registo de data e hora utiliza o fuso horário de Moçambique (CAT, UTC+2) sincronizado internamente na infraestrutura, funcionando exclusivamente como rasto de auditoria cronológica transacional para consistência de logs, não constituindo um serviço de selagem temporal qualificada nos termos do Decreto n.º 59/2019.

6. **Não declaramos isenção legal absoluta** — A classificação regulatória, incluindo eventual necessidade de registo, licença, autorização ou declaração prévia, depende da análise das actividades efectivamente prestadas e dos regimes aplicáveis. A enumeração de diplomas neste documento identifica possíveis referências normativas, não constituindo declaração de conformidade.

---

## O que Somos (Para Clientes e Parceiros)

| Atributo | Descrição | Benefício |
|----------|-----------|-----------|
| **Validador de Integridade** | Geramos uma impressão digital criptográfica (hash SHA-256) de qualquer documento. | Falsificação torna-se detetável — qualquer alteração de 1 byte muda o hash completamente. |
| **Motor de Auditoria** | Registamos cada emissão, verificação e revogação com selo temporal sincronizado ao fuso horário oficial de Moçambique (CAT, UTC+2). | Trilha de evidências digitais de suporte operacional. |
| **Guardião de Privacidade** | Privacy by Design: o PDF é processado em memória e não é persistido no fluxo de emissão inspecionado. Persistimos hashes, metadados e dados operacionais. | Redução do risco de exposição do conteúdo documental. |
| **Facilitador de Processos** | APIs REST que transformam validações manuais e físicas em auditorias criptográficas automáticas de menos de 100 milissegundos. | Redução significativa no tempo de verificação documental e custos operacionais. |

---

## Riscos Mitigados por Stakeholder

| Stakeholder | Risco Operacional | Como o Txeka Ntiyiso Mitiga |
|-------------|-------------------|----------------------------|
| **Governo (B2G)** | Falsificação de certidões, alvarás e DUATs entre órgãos; burocracia de validação cruzada. | Verificação criptográfica instantânea (< 100ms) entre instituições, eliminando deslocações físicas e intermediários. |
| **Empresas (B2B)** | Fraude documental em processos KYC, onboarding e compliance; perdas financeiras por documentos adulterados. | Validação automatizada via API REST com deteção matemática de adulterações, reduzindo risco operacional. |
| **Reguladores (INTIC)** | Falta de evidências digitais em processos de fiscalização. | Logs estruturados em JSON, prontos para auditorias e perícias forenses. A retenção mínima de 20 anos do Decreto n.º 59/2019 aplica-se ao SCDM e não está comprovada como funcionalidade desta plataforma. |
| **Cidadãos** | Vazamento do conteúdo documental em plataformas de verificação; dependência de intermediários para autenticar documentos. | Privacy by Design: o PDF transita para a API na emissão e não é persistido neste fluxo. Verificação via QR code sem registo obrigatório. |

---

## Para Quem É

| Stakeholder | O que Ganha | Como Acede |
|-------------|-------------|------------|
| **Governo (B2G)** | Interoperabilidade e verificação imediata de documentos entre Ministérios, INAGE, Direções Nacionais e Tribunais. | Dashboard Institucional + Integração via API REST |
| **Empresas (B2B)** | Validação automatizada de faturas, certidões de registo comercial, licenças e alvarás de clientes, reduzindo fraudes. | Chaves de API dedicadas para sistemas centrais (ERPs, CRMs, Core Bancário) |
| **Reguladores (INTIC / Auditoria)** | Capacidade de extração de relatórios forenses digitais. | Dashboard de Auditoria / Permissões de Leitura Exclusivas |
| **Cidadãos** | Consulta transparente e descentralizada da autenticidade do seu rasto documental. | Portal Público Web e verificação rápida via QR Code (sem registo obrigatório) |

---

## Diferenciação Competitiva

| Soluções Estrangeiras (DocuSign, Adobe Sign) | Txeka Ntiyiso |
|----------------------------------------------|---------------|
| Foco em Assinatura Eletrónica + ICP | Foco em Integridade Criptográfica |
| Retém documentos e dados sensíveis | Não retém o PDF no fluxo de emissão inspecionado |
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

> "O Txeka Ntiyiso posiciona-se como a infraestrutura intermédia de transição digital que mitiga o problema da falsificação documental em Moçambique. Não emitimos certificados digitais nem chaves — validamos a integridade dos documentos que as instituições já emitem, com resposta em menos de 100ms, custo local em Meticais e sem persistência do PDF original no fluxo de emissão inspecionado."

---

## Glossário de Posicionamento

| Termo | Definição no contexto Txeka Ntiyiso |
|-------|-------------------------------------|
| **Hash SHA-256** | Algoritmo criptográfico que gera uma cadeia de 64 caracteres hexadecimais, funcionando como a identidade matemática irreversível de um ficheiro. |
| **Privacy by Design** | Minimização de dados: o PDF é processado em memória no servidor para calcular o hash e não é persistido no fluxo de emissão inspecionado. Não constitui Zero-Knowledge. |
| **Rastreabilidade operacional** | Fornecimento de evidências técnicas de que uma operação de registo ou revogação foi efectuada, através dos logs gerados pelo sistema. Não equivale ao não-repúdio jurídico do SCDM. |
| **Prova de Existência Criptográfica** | Registo tecnológico seguro que atesta que um documento com determinado hash exato existia no momento do seu envio ao sistema. |
| **Middleware de Integridade** | Software de infraestrutura que atua de forma transparente entre o emissor e o verificador de um documento, garantindo que a informação não foi adulterada no caminho. |
| **Rasto de Auditoria Cronológica Transacional** | Registo temporal de operações (emissão, verificação, revogação) para consistência de logs e trilha forense, não constituindo validação cronológica qualificada. |

---

Txeka Ntiyiso — Infraestrutura de Confiança para a Transformação Digital de Moçambique 🇲🇿
