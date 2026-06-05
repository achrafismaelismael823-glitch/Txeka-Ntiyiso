# Txeka Ntiyiso — Core Module

Módulo central de criptografia e segurança para a plataforma Txeka Ntiyiso.

## Descrição

O módulo `core` implementa os fundamentos criptográficos da plataforma, incluindo geração de hashes SHA-256, validação de integridade de documentos, geração de códigos QR, e utilitários de segurança.

## Funcionalidades

O módulo fornece as seguintes capacidades críticas para custódia e validação de documentos em Moçambique:

**Hashing Criptográfico:** Implementação de SHA-256 para geração de assinaturas únicas de documentos, permitindo verificação de integridade sem armazenar o documento original.

**Geração de Códigos QR:** Codificação de hashes de documentos em formatos QR escaneáveis, facilitando verificação móvel instantânea através de qualquer dispositivo com câmara.

**Validação de Segurança:** Sanitização de entrada de dados, validação de formatos, verificação de integridade, e assinatura HMAC-SHA256 para não-repudiação.

## Estrutura
core/
├── src/
│   ├── init.py           # Exportações do módulo
│   ├── hashing.py            # Algoritmo SHA-256
│   ├── qr_generator.py       # Geração de códigos QR
│   └── security.py           # Utilitários de segurança
├── tests/
│   └── init.py           # Testes unitários
├── pyproject.toml            # Dependências do workspace
└── README.md                 # Este ficheiro
## Instalação

O módulo é gerido como workspace Poetry. Para instalar dependências:

```bash
poetry install
Uso
Importar funcionalidades do módulo:
from core.src import (
    gerar_hash_sha256,
    validar_hash,
    gerar_qr_code,
    sanitizar_entrada,
    validar_hash_sha256,
)

# Gerar hash de um documento
doc_content = b"Conteúdo do documento"
hash_value = gerar_hash_sha256(doc_content)

# Validar hash
is_valid = validar_hash(doc_content, hash_value)

# Gerar código QR
qr_bytes = gerar_qr_code(hash_value, "DOC-ID-2026")
Dependências
O módulo depende de bibliotecas de criptografia estabelecidas e mantidas pela comunidade Python:
cryptography: Primitivas criptográficas de baixo nível
qrcode: Geração de códigos QR
pillow: Processamento de imagens (necessário para QR codes)
pydantic: Validação de dados com type hints
Testes
Para executar testes unitários:
poetry run pytest core/tests/ -v
Roadmap
Melhorias futuras incluem suporte para assinaturas digitais baseadas em certificados X.509, integração com armazenamento distribuído (IPFS), e otimizações de desempenho para processamento em lote de documentos.
Segurança
Este módulo implementa práticas de segurança estabelecidas. Contudo, qualquer descoberta de vulnerabilidades deve ser reportada responsavelmente através do email security@txekantiyiso.mz.
Licença
properitary licença- Veja LICENSE para detalhes
**Commit:** "Add core module README with comprehensive documentation"

---

## Arquivo 6: `core/tests/__init__.py`

Este arquivo é um simples inicializador do módulo de testes.

**Instruções:** No GitHub, navegue até `core/tests/__init__.py` e substitua o conteúdo vazio pelo seguinte:

```python
"""
Tests Module - DocVerify Core

Testes unitários e de integração para o módulo core de criptografia e segurança.
"""

__version__ = "0.1.0"
