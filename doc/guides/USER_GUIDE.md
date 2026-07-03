# Guia de Utilizador — Txeka Ntiyiso

**Manual Operacional para Instituições, Bancos e Empresas**

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Para Instituições Emissoras](#para-instituções-emissoras)
3. [Para Cidadãos Verificadores](#para-cidadãos-verificadores)
4. [Para Governo e Entidades Reguladoras](#para-governo-e-entidades-reguladoras)
5. [Interpretação de Resultados](#interpretação-de-resultados)
6. [Perguntas Frequentes](#perguntas-frequentes)
7. [Contacto e Suporte](#contacto-e-suporte)

---

## Visão Geral

O Txeka Ntiyiso é uma plataforma de infraestrutura digital que permite às instituições emitirem documentos com **prova de integridade criptográfica** e a qualquer pessoa verificar a sua autenticidade em **menos de 100 milissegundos**.

> **Princípio fundamental:** A plataforma armazena apenas **hashes SHA-256** (impressões digitais matemáticas de 64 caracteres). Os documentos originais **nunca** saem do ambiente do cliente.

---

## Para Instituições Emissoras

### Passo 1: Registar Instituição

Contacte: **tech@txeka.co.mz**

Forneça:
- Nome da instituição
- Responsável técnico (email, telefone)
- Documentos de autorização (se governo)
- Volumes esperados (documentos/mês)

Receberá:
- Chave API da instituição
- Documentação de integração
- Acesso ao dashboard institucional

### Passo 2: Integrar API

O seu sistema interno envia o documento para a Txeka:

```bash
POST /api/v1/certify
Content-Type: multipart/form-data

file: [PDF do documento]
document_type: DUAT
institution_id: INAGE
```

**Resposta:**
```json
{
  "status": "emitted",
  "doc_id": "DUAT-INAGE-20260604-A1B2C3D4",
  "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "qr_code": "data:image/png;base64,...",
  "certificate_url": "https://txeka.mz/verify/e3b0c44...",
  "timestamp": "2026-06-04T14:32:15+02:00"
}
```

### Passo 3: Distribuir ao Cidadão

- Imprima o certificado com QR code
- Ou envie por email/SMS o link de verificação
- O cidadão pode verificar escaneando o QR ou visitando:
  ```
  https://txeka.mz/verify/{hash}
  ```

### Passo 4: Revogar se Necessário

Se o documento ficar inválido (fraudulento, cancelado, erro administrativo):

```bash
POST /api/v1/emissions/{doc_id}/revoke
Content-Type: application/json

{
  "reason": "Documento falsificado detectado em auditoria interna"
}
```

> **Importante:** A revogação **não apaga** o registo — ele permanece na auditoria com status "revogado". Isto garante rastreabilidade completa e conformidade com a Lei 3/2017 (não-repúdio).
>
> Instantaneamente, verificações futuras retornarão **"Revogado"**.

---

## Para Cidadãos Verificadores

### Verificar Documento

#### Opção 1: Scanear QR Code (Mais Rápido)

1. Abra a câmara do telemóvel
2. Aponte para o QR code do certificado
3. Clique no link que aparecer
4. O sistema mostra o resultado de validação

#### Opção 2: Upload Manual

1. Visite: [https://txeka.mz/verify](https://txeka.mz/verify)
2. Clique "Upload PDF"
3. Selecione o documento
4. O sistema recalcula o hash e compara com o registo
5. Resultado instantâneo

> **Nota:** O cálculo do hash é feito **no navegador** (client-side). O documento original **nunca** é enviado para o servidor.

---

## Para Governo e Entidades Reguladoras

### Piloto Operacional (30 Dias)

1. **Assinamos acordo piloto** (sem custos)
2. **Você emite 100 documentos teste**
3. **Monitora auditoria completa** via dashboard
4. **Colhe feedback operacional** semanal
5. **Decide expandir** ou não

**Requisitos Mínimos:**
- 1 técnico seu para integração
- Acesso a servidor para testes
- Feedback semanal estruturado

**Sucesso Esperado:**
- Zero erros técnicos
- Integração simples (menos de 4 horas)
- Cidadãos conseguem verificar autonomamente
- Auditoria completa e rastreável

---

## Interpretação de Resultados

### Estado: AUTÊNTICO (VALIDADO)

O documento eletrónico foi emitido por uma instituição devidamente homologada na plataforma. A estrutura binária atual coincide integralmente com o hash criptográfico gerado no ato da emissão, garantindo a ausência de adulterações.

**Eficácia probatória:** O documento possui eficácia probatória plena quanto à sua integridade e origem autêntica, em conformidade com a Lei n.º 3/2017.

### Estado: INVÁLIDO (NÃO ENCONTRADO)

O identificador ou o arquivo submetido não possui correspondência no ledger de segurança da plataforma. O documento deve ser considerado alterado, corrompido ou desprovido de origem legítima.

**Ação recomendada:** Contactar a instituição emissora para esclarecimento da situação.

### Estado: REVOGADO

O documento foi originalmente emitido de forma legítima, mas foi cancelado posteriormente pela autoridade emissora. A plataforma exibe:
- Data e hora oficial de Moçambique (CAT, UTC+2) da revogação
- Fundamentação administrativa que motivou a invalidade
- Identificação do autor da revogação

**Eficácia probatória:** O documento revogado não possui qualquer eficácia probatória.

---

## Perguntas Frequentes

**P: E se perder o certificado físico?**
R: Pode recuperar o hash pelo email que recebeu e verificar online. O hash é único e nunca muda.

**P: Quanto custa?**
R: Piloto: Gratuito. Produção: A partir de 1.000 MZN/mês + por documento.

**P: É seguro?**
R: SHA-256 é padrão militar e bancário. É impossível falsificar sem ser detetado.

**P: Funciona sem internet?**
R: A verificação é online apenas. Pode guardar o certificado PDF para consulta offline, mas a validação requer conectividade.

**P: Quem tem acesso aos dados?**
R: Só o hash SHA-256 e metadados (data, instituição). Nenhum dado pessoal é guardado. Totalmente conforme com a Lei 3/2017.

**P: Quanto tempo os registos são guardados?**
R: Mínimo 20 anos, em compliance com o Decreto n.º 59/2019. Impossível apagar (imutabilidade garantida).

**P: Posso integrar com o meu sistema interno?**
R: Sim. Oferecemos API REST completa com documentação Swagger e exemplos de código em Python e JavaScript.

**P: E se a plataforma falhar?**
R: A arquitetura é redundante (Render.com + Supabase). RTO de 4 horas e RPO de 15 minutos. Backups automáticos diários.

---

## Contacto e Suporte

| Canal | Detalhe |
|-------|---------|
| **Email** | tech@txeka.co.mz |
| **GitHub Issues** | [github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues](https://github.com/achrafismaelismael823-glitch/Txeka-Ntiyiso/issues) |
| **Status do Sistema** | [https://txeka-ntiyiso-api.onrender.com/health](https://txeka-ntiyiso-api.onrender.com/health) |
| **Horário de Suporte** | 24/7 para clientes institucionais |

---

*Txeka Ntiyiso — Manual do Utilizador v1.0 🇲🇿*
"""
