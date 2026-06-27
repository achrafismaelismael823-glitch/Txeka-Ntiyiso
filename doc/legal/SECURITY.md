# Políticas de Segurança Cibernética — Txeka Ntiyiso

**Threat Model, Criptografia, Resposta a Incidentes e Conformidade Regulatória**

---

## Índice

1. [Visão Geral de Segurança](#visão-geral-de-segurança)
2. [Threat Model (STRIDE)](#threat-model-stride)
3. [Criptografia e Proteção de Dados](#criptografia-e-proteção-de-dados)
4. [Autenticação e Autorização](#autenticação-e-autorização)
5. [Endpoints Protegidos](#endpoints-protegidos)
6. [Ataques Mitigados](#ataques-mitigados)
7. [Gestão de Segredos](#gestão-de-segredos)
8. [Backup e Disaster Recovery](#backup-e-disaster-recovery)
9. [Resposta a Incidentes](#resposta-a-incidentes)
10. [Conformidade Regulatória](#conformidade-regulatória)
11. [Auditoria e Contacto](#auditoria-e-contacto)

---

## Visão Geral de Segurança

O Txeka Ntiyiso adota uma postura de segurança **defesa em profundidade**, com múltiplas camadas de proteção que garantem a confidencialidade, integridade e disponibilidade dos dados de auditoria, sem nunca comprometer a privacidade dos cidadãos.

| Princípio | Implementação |
|-----------|---------------|
| **Confidencialidade** | Zero retenção de documentos originais; hashes apenas |
| **Integridade** | SHA-256 imutável; logs append-only |
| **Disponibilidade** | RTO 4h; RPO 15min; backups redundantes |
| **Não-repúdio** | Logs forenses com timestamp, actor e evidência |
| **Privacidade** | Arquitetura Zero-Knowledge; IPs mascarados |

---

## Threat Model (STRIDE)

### S — Spoofing (Falsificação de Identidade)

**Risco:** Atacante assume identidade de instituição ou administrador.

**Mitigação:**
- JWT assinado com HMAC-SHA256 (secret ≥ 256 bits)
- Tokens com expiração curta (1 hora)
- Validação de `institution_id` no token contra o pedido
- Não existe endpoint de registo público — contas criadas apenas por admin

### T — Tampering (Adulteração de Dados)

**Risco:** Atacante altera documento ou registo de auditoria.

**Mitigação:**
- SHA-256 do documento: qualquer alteração de 1 byte = hash diferente
- Logs append-only: não existe endpoint DELETE para audit_logs
- PostgreSQL ACID: transações atómicas garantem consistência
- Revogação é soft-update (status + timestamp), nunca eliminação

### R — Repudiation (Negação de Ação)

**Risco:** Emissora nega ter emitido ou revogado documento.

**Mitigação:**
- `issued_at` + `issued_by` + `institution_id` imutáveis
- Audit log: quem, quando, de que IP, que ação, que resultado
- Logs estruturados em JSON, exportáveis para evidência judicial

### I — Information Disclosure (Vazamento de Informação)

**Risco:** Dados sensíveis expostos a não-autorizados.

**Mitigação:**
- Zero-Knowledge: servidor nunca vê documento original
- Hashes SHA-256 não revelam conteúdo (one-way)
- IPs mascarados em logs públicos (PENSC compliant)
- Rate limiting previne scraping massivo de hashes

### D — Denial of Service (Negação de Serviço)

**Risco:** Sistema torna-se indisponível por ataque ou sobrecarga.

**Mitigação:**
- Rate limiting por IP e por endpoint
- Render.com auto-scaling (Produção Cloud)
- Docker Compose com health checks e restart automático
- Monitoramento de métricas (Prometheus + Grafana opcional)

### E — Elevation of Privilege (Escalada de Privilégios)

**Risco:** Utilizador comum obtém acesso de administrador.

**Mitigação:**
- Roles hardcoded no servidor (`user.role = "institution"` forçado)
- Nunca confiar no cliente para definir role
- Middleware de autorização em cada endpoint protegido
- Separação de permissões: emit ≠ revoke ≠ audit

---

## Criptografia e Proteção de Dados

### SHA-256 (Integridade de Documentos)

| Propriedade | Valor |
|-------------|-------|
| Tipo | Função de hash criptográfica |
| Tamanho | 256 bits (64 caracteres hexadecimais) |
| Propriedade | One-way (não reversível) |
| Resistência a colisão | ~2^128 operações (computacionalmente impossível) |
| Uso | Hash do PDF binário antes de registo |

> **Nota:** SHA-256 é padrão FIPS 180-4, aprovado pelo NIST para aplicações governamentais e financeiras.

### JWT (Autenticação State-less)

| Propriedade | Valor |
|-------------|-------|
| Biblioteca | pyjwt 2.8.0 |
| Algoritmo | HS256 (HMAC + SHA-256) |
| Secret | Armazenado em variável de ambiente (nunca em código) |
| Payload | `{sub, email, id, role, institution, exp, iat}` |
| Expiração | 3600 segundos (1 hora) |

### bcrypt (Hashing de Passwords — Futuro)

| Propriedade | Valor |
|-------------|-------|
| Tipo | Password hashing adaptativo |
| Salt rounds | 12 |
| Tempo de processamento | ~100ms por hash (lento propositalmente) |
| Defesa | Rainbow tables, brute-force, timing attacks |

### TLS/SSL (Cifragem em Trânsito)

| Propriedade | Valor |
|-------------|-------|
| Protocolo | TLS 1.3 (obrigatório) |
| Certificado | Válido e verificável |
| Redirect | HTTP → HTTPS automático |
| HSTS | Ativo (opcional, recomendado) |

---

## Autenticação e Autorização

### Roles e Permissões

```python
ROLES = {
    "system":    ["verify", "emit", "revoke"],           # Serviços internos
    "admin":     ["verify", "emit", "revoke", "manage_institutions", "audit"],
    "institution": ["emit", "verify", "revoke_own"],      # Revogação própria apenas
    "citizen":   ["verify"]                                # Sem login necessário
}
```

> **Nota:** O role "citizen" não requer autenticação — verificação pública via QR code.

### Fluxo de Autenticação JWT

1. Login (endpoint dedicado ou setup manual)
2. Sistema cria token: `jwt.encode(payload, SECRET_KEY)`
3. Payload: `{sub, email, id, role, institution, exp, iat}`
4. Cliente envia: `Authorization: Bearer {token}`
5. `security.py`: `jwt.decode(token, SECRET_KEY, algorithms=["HS256"])`
6. Se válido: continua. Se não: 401 Unauthorized

---

## Endpoints Protegidos

### POST /api/v1/certify

- **Requer:** JWT válido + role "institution" ou "admin"
- **Validação:** `institution_id` no token deve corresponder ao pedido
- **Log:** EMIT — quem emitiu, quando, doc_id, hash, IP
- **Privacidade:** PDF processado em memória, nunca persistido

### GET /api/v1/verify/{hash}

- **Requer:** Nenhum (público)
- **Log:** VERIFY — IP (mascarado), timestamp, resultado
- **Rate limit:** 30 req/min por IP
- **Privacidade:** Hash apenas, nunca documento original

### POST /api/v1/verify

- **Requer:** API Key (B2B/B2G)
- **Log:** VERIFY — institution_id, IP, timestamp, resultado
- **Rate limit:** 100 req/min por API key

### POST /api/v1/emissions/{doc_id}/revoke

- **Requer:** JWT + role "admin" ou "institution" dona do documento
- **Validação:** Ownership-based (`doc.institution_id == token.institution`)
- **Log:** REVOKE — quem revogou, quando, razão, doc_id
- **Imutabilidade:** Soft update (status='revoked'), nunca DELETE

### GET /api/v1/audit/logs

- **Requer:** JWT + role "admin"
- **Filtros:** action, institution_id, data, paginação
- **Privacidade:** IPs mascarados em exportação pública

---

## Ataques Mitigados

### Ataque 1: Falsificação de Documento

**Vetor:** Atacante edita PDF e tenta verificar como válido.

**Mitigação:**
- Hash do PDF alterado muda completamente
- Verificação retorna "INVALID" — hash não existe no sistema
- Se hash existir (duplicado): 409 Conflict

### Ataque 2: Duplicação Maliciosa

**Vetor:** Atacante reemite documento já existente para confundir.

**Mitigação:**
- `doc_hash` é UNIQUE na base de dados
- Tentativa de reemissão: 409 Conflict
- Audit log regista tentativa com IP e timestamp

### Ataque 3: Uso de Documento Revogado

**Vetor:** Atacante ignora revogação e usa documento antigo.

**Mitigação:**
- Verificação verifica campo `revoked = TRUE`
- Se revogado: retorna "REVOKED" + metadados da revogação
- Não existe bypass: revogação é imutável

### Ataque 4: Forja de Token JWT

**Vetor:** Atacante cria token falso com role "admin".

**Mitigação:**
- `jwt.decode()` verifica assinatura HMAC-SHA256
- Secret ≥ 256 bits, armazenado em ambiente seguro
- Token inválido: 401 Unauthorized

### Ataque 5: SQL Injection

**Vetor:** Atacante injeta SQL no parâmetro hash.

**Mitigação:**
- Prepared statements (SQLAlchemy ORM)
- Validação: hash deve ter exatamente 64 caracteres hexadecimais
- Regex: `^[a-fA-F0-9]{64}$`

### Ataque 6: Brute-force de Hashes

**Vetor:** Atacante tenta adivinhar hashes válidos.

**Mitigação:**
- Rate limiting: 30 req/min por IP em verificação pública
- Espaço de busca: 2^256 (impossível computacionalmente)
- Monitoramento de IPs com padrão anómalo

### Ataque 7: Man-in-the-Middle

**Vetor:** Atacante intercepta tráfego entre cliente e API.

**Mitigação:**
- TLS 1.3 obrigatório (HTTPS apenas)
- HSTS ativo
- Certificados válidos e verificáveis

---

## Gestão de Segredos

### Onde Guardar `JWT_SECRET_KEY`

| Ambiente | Método | Nível de Segurança |
|----------|--------|-------------------|
| **Produção Cloud** | Render Environment Variables | Alto (encriptado em repouso) |
| **Produção Nacional** | Docker Secrets ou HashiCorp Vault | Muito Alto |
| **Desenvolvimento** | `.env` local (nunca no Git) | Médio |

### Rotação de Segredos

| Tipo | Frequência | Procedimento |
|------|------------|--------------|
| JWT Secret | Trimestral | Gerar novo, reiniciar serviço, notificar instituições |
| API Keys | Anual | Revogar antigas, emitir novas, atualizar integrações |
| DB Password | Semestral | Alterar em `.env`, reiniciar containers |
| SSL Certificates | Anual | Renovar antes da expiração |

---

## Backup e Disaster Recovery

### Estratégia de Backup

| Componente | Frequência | Retenção | Método |
|------------|------------|----------|--------|
| PostgreSQL | Diário (02:00 CAT) | 30 dias | `pg_dump` + gzip |
| Logs de auditoria | Contínuo | 20 anos (mínimo) | Append-only em BD |
| Configurações | Após alteração | Indefinido | Git + Docker Compose |

### Métricas de Recuperação

| Métrica | Valor | Base Legal |
|---------|-------|------------|
| **RTO** (Recovery Time Objective) | 4 horas | Boa prática enterprise |
| **RPO** (Recovery Point Objective) | 15 minutos | Decreto 59/2019 (continuidade) |
| **Backup test frequency** | Mensal | Boa prática |

### Procedimento de Restauração

```bash
# 1. Identificar backup mais recente válido
ls -la /backups/txeka/ | tail -5

# 2. Parar serviços dependentes
docker-compose -f docker-compose.prod.yml stop api

# 3. Restaurar base de dados
gunzip -c /backups/txeka/txeka_ntiyiso_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i txeka-db psql -U txeka -d txeka_ntiyiso

# 4. Verificar integridade
docker exec txeka-db psql -U txeka -c "SELECT COUNT(*) FROM documents;"
docker exec txeka-db psql -U txeka -c "SELECT COUNT(*) FROM audit_logs;"

# 5. Reiniciar serviços
docker-compose -f docker-compose.prod.yml up -d api

# 6. Validar health check
curl -f http://localhost:8000/health
```

---

## Resposta a Incidentes

### Classificação de Severidade

| Nível | Descrição | Exemplo | Tempo de Resposta | Escalation |
|-------|-----------|---------|-------------------|------------|
| **P1-Crítico** | Sistema inacessível, todos os serviços down | Render offline, DB corrompido | 15 minutos | CTO + Clientes |
| **P2-Alto** | Funcionalidade core degradada | Verificações > 5s, erro > 5% | 1 hora | Tech Lead |
| **P3-Médio** | Funcionalidade não-core afetada | Dashboard lento, relatórios indisponíveis | 4 horas | DevOps |
| **P4-Baixo** | Questões cosméticas | Erro de ortografia, badge desatualizado | 24 horas | Backlog |

### Playbook: Documento Fraudulento Detectado

```
T+0min    Deteção: verificação anómala ou denúncia
T+5min    Confirmar fraudulência via análise de logs
T+10min   Revogar documento: POST /emissions/{doc_id}/revoke
          Razão: "Documento fraudulento detectado"
T+15min   Notificar instituição emissora e entidades reguladoras
T+30min   Exportar logs forenses dos últimos 90 dias
T+60min   Publicar aviso no dashboard (se necessário)
T+24h     Relatório de incidente + lições aprendidas
```

### Playbook: Suspeita de Breach de Segurança

```
T+0min    Deteção: logs anómalos, acessos não autorizados, alertas de monitorização
T+1min    ISOLAR: revogar TODOS os tokens JWT ativos (forçar re-login)
T+5min    PRESERVAR: exportar logs dos últimos 7 dias para análise forense
T+10min   ANALISAR: identificar vetor de ataque, IPs envolvidos, dados potencialmente afetados
T+30min   NOTIFICAR: security@txeka.co.mz + INTIC (se infraestrutura crítica) + 
          Banco de Moçambique (se sector financeiro)
T+60min   REMEDIAR: aplicar patch de segurança, rotação de todas as credenciais, 
          reforço de regras de firewall e rate limiting
T+24h     RELATÓRIO: documentar incidente, lições aprendidas, medidas preventivas implementadas
```

### Playbook: Negação de Serviço (DoS/DDoS)

```
T+0min    Deteção: latência anómala, spike de requisições
T+2min    Ativar rate limiting agressivo (cloudflare ou nginx)
T+5min    Identificar padrão de ataque (IPs, user-agents, endpoints)
T+10min   Bloquear IPs maliciosos no firewall
T+15min   Escalar para Render.com (se cloud) ou ISP (se nacional)
T+30min   Considerar ativar modo "manutenção" se persistir
T+60min   Análise post-incidente + ajuste de regras de proteção
```

---

## Conformidade Regulatória

### Lei n.º 3/2017 — Transações Eletrónicas

| Requisito | Estado | Evidência |
|-----------|--------|-----------|
| Autenticidade | ✅ Implementado | JWT + institution_id + issued_by |
| Integridade | ✅ Implementado | SHA-256 imutável |
| Não-repúdio | ✅ Implementado | Logs append-only com timestamp |
| Proteção de Dados | ✅ Implementado | Capítulo V — Zero-Knowledge Architecture |

### Decreto n.º 59/2019 — Validação Cronológica

| Requisito | Estado | Evidência |
|-----------|--------|-----------|
| Retenção 20 anos | ✅ Implementado | PostgreSQL append-only, backups diários |
| Auditoria completa | ✅ Implementado | audit_logs com todos os campos obrigatórios |
| Imutabilidade | ✅ Implementado | Sem endpoint DELETE para registos históricos |

### Resolução n.º 69/2021 — PENSC (Segurança Cibernética)

| Requisito | Estado | Evidência |
|-----------|--------|-----------|
| Proteção de infraestruturas críticas | ✅ Implementado | Docker air-gapped, rede isolada |
| Prevenção de crimes cibernéticos | ✅ Implementado | Mitigação de falsificação, roubo de identidade |
| Resiliência e continuidade | ✅ Implementado | RTO 4h, RPO 15min, backups redundantes |
| Governança e auditoria | ✅ Implementado | Logs imutáveis, acesso restrito |
| Mascaramento de dados | ✅ Implementado | IPs anonimizados em consultas públicas |

### Banco de Moçambique — Requisitos Transacionais

| Requisito | Estado | Evidência |
|-----------|--------|-----------|
| Validação de entrada | ✅ Implementado | Tipo, tamanho, formato, magic bytes |
| Rate limiting | ✅ Implementado | 100 req/min por IP / 30 req/min verificação pública |
| HTTPS obrigatório | ✅ Implementado | TLS 1.3, redirect HTTP→HTTPS |
| Certificado SSL válido | ✅ Implementado | Let's Encrypt / AC-MZ |
| Zero PII | ✅ Implementado | Apenas hashes e metadados |

---

## Auditoria e Contacto

### Para Auditorias Técnicas (Governo / Reguladores)

**Email:** security@txeka.co.mz

**Disponibilizamos:**
- Desenho da arquitetura completa (diagramas C4)
- Acesso ao código-fonte (repositório privado sob NDA)
- Logs de auditoria dos últimos 90 dias (exportação JSON)
- Resultados de testes de intrusão (Penetration Tests)
- Documentação de conformidade (este dossiê)

### Checklist de Conformidade

- [x] Lei 3/2017: Autenticidade implementada
- [x] Lei 3/2017: Integridade implementada
- [x] Lei 3/2017: Não-repúdio implementado
- [x] Lei 3/2017: Proteção de Dados (Capítulo V) implementada
- [x] Decreto 59/2019: Retenção de 20 anos configurada
- [x] Decreto 59/2019: Imutabilidade de logs garantida
- [x] Resolução 69/2021: PENSC alinhada
- [x] Banco de Moçambique: Rate limiting ativo
- [x] Banco de Moçambique: Zero PII confirmado
- [x] Banco de Moçambique: Trilha de auditoria completa
- [x] Backup: Automatizado diário
- [x] Cifragem em trânsito: TLS 1.3
- [x] Cifragem em repouso: PostgreSQL encriptado
- [x] Gestão de segredos: Variáveis de ambiente / Docker Secrets
- [x] Rotação de credenciais: Procedimento trimestral

---

*Txeka Ntiyiso — Políticas de Segurança Cibernética v1.0 🇲🇿*
*Alinhado com Lei 3/2017, Decreto 59/2019 e Resolução 69/2021 (PENSC)*
