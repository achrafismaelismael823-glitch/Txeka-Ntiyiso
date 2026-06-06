```markdown
# Guia de Utilizador — Txeka Ntiyiso

Como usar Txeka Ntiyiso se você é instituição governamental, banco ou empresa.

## Para Instituições (Emissores)

### Passo 1: Registar Instituição

Contacte: tech@txeka.co.mz

Forneça:
- Nome da instituição
- Responsável técnico (email, telefone)
- Documentos de autorização (se governo)
- Volumes esperados (docs/mês)

Receberá:
- Chave API (instituição)
- Documentação integração
- Acesso ao dashboard

### Passo 2: Integrar API

Seu sistema interno envia documento para Txeka:

```bash
POST /api/v1/emit
Content-Type: multipart/form-data

file: [PDF do documento]
document_type: DUAT
institution_id: INAGE
Resposta:
{
  "status": "emitted",
  "doc_id": "DUAT-INAGE-20260604-A1B2C3D4",
  "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "qr_code": "data:image/png;base64,..."
}
Passo 3: Distribuir ao Cidadão
Imprima o certificado com QR code ou envie por email.
Cidadão pode verificar escaneando QR ou visitando:
https://txeka.mz/verify/{hash}
Passo 4: Revogar se Necessário
Se documento ficar inválido (fraudulento, cancelado):
POST /api/v1/emissions/{doc_id}/revoke
Content-Type: application/json

{
  "reason": "Documento falsificado"
}
Importante: A revogação não apaga o registo — ele permanece na auditoria com status "revogado". Isto garante rastreabilidade completa e conformidade com a Lei 3/2017 (não-repúdio).
Instantaneamente, verificações futuras retornarão "Revogado".
Para Cidadãos (Verificadores)
Verificar Documento
Opção 1: Scanear QR Code (Mais Rápido)
Abra câmara do telemóvel
Aponte para QR code do certificado
Clique no link que aparecer
Sistema mostra resultado de validação
Opção 2: Upload Manual
Visite: https://txeka.mz/verify
Clique "Upload PDF"
Selecione o documento
Sistema recalcula hash e compara
Resultado instantâneo
Interpretação dos Resultados de Verificação
Estado: AUTÊNTICO (VALIDADO)
O documento eletrónico foi emitido por uma instituição devidamente homologada na plataforma. A estrutura binária atual coincide integralmente com o hash criptográfico gerado no ato da emissão, garantindo a ausência de adulterações. O documento possui eficácia probatória plena quanto à sua integridade e origem autêntica, em conformidade com a Lei n.º 3/2017.
Estado: INVÁLIDO (NÃO ENCONTRADO)
O identificador ou o arquivo submetido não possui correspondência no ledger de segurança da plataforma. O documento deve ser considerado alterado, corrompido ou desprovido de origem legítima. Recomenda-se contactar a instituição emissora para esclarecimento da situação.
Estado: REVOGADO
O documento foi originalmente emitido de forma legítima, mas foi cancelado posteriormente pela autoridade emissora. A plataforma exibe a data, a hora oficial de Moçambique (UTC+2) e a fundamentação administrativa que motivou a invalidade do documento. O documento revogado não possui qualquer eficácia probatória.
Para Governo (INAGE, BM, etc)
Piloto 30 Dias
Assinamos acordo piloto (sem custos)
Você emite 100 documentos teste
Monitora auditoria completa
Colhe feedback operacional
Decide expandir ou não
Requisitos Mínimos
1 técnico seu (integração)
Acesso servidor (para testes)
Feedback semanal
Sucesso Esperado
Zero erros técnicos
Integração simples (menos de 4 horas)
Cidadãos conseguem verificar
Auditoria completa e rastreável
Perguntas Frequentes
P: E se perder o certificado físico?
R: Pode recuperar o hash pelo email que recebeu e verificar online. Hash é único, nunca muda.
P: Quanto custa?
R: Piloto: Grátis. Produção: A partir de 1.000 MZN/mês + por documento.
P: É seguro?
R: SHA-256 é militar-grade. Impossível falsificar sem ser detetado.
P: Funciona sem internet?
R: Verificação online apenas. Pode salvar certificado PDF offline.
P: Quem tem acesso aos dados?
R: Só hash SHA-256 e metadata (data, instituição). Nenhum dado pessoal guardado. Totalmente conforme Lei 3/2017.
P: Quanto tempo os registos são guardados?
R: Mínimo 20 anos, em compliance com Decreto 59/2019. Impossível apagar (imutabilidade).
