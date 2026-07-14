# SECURITY_FIX.md

## 🔒 Correções de Segurança Críticas

### 1. Remover Segredos do Código-Fonte

**Problema:** `JWT_SECRET_KEY` e `SECRET_KEY` têm fallbacks em texto.

**Arquivos afetados:**
- `api-gateway/src/security.py`
- `api-gateway/src/settings.py`

**Correção em security.py:**
```python
# ANTES (INSEGURO):
SECRET_KEY = os.getenv("SECRET_KEY", "txeka-dev-secret")

# DEPOIS (SEGURO):
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")
# ============================================
# PASSO 12: Verificar tudo foi criado (confirmação)
# ============================================
echo "=== ARQUIVOS CRIADOS ==="
echo ""
echo "--- Testes ---"
ls -la api-gateway/tests/
echo ""
echo "--- CI/CD ---"
ls -la .github/workflows/
echo ""
echo "--- Documentação ---"
ls -la *.md 2>/dev/null | grep -E "(SECURITY|IMPLEMENTATION)"

# ============================================
# PASSO 13: Commit e push
# ============================================
git add .
git status

git commit -m "feat: adiciona testes automatizados e CI/CD pipeline

- 10 arquivos de teste (core, services, routes)
- pytest com fixtures e mocks
- GitHub Actions CI/CD
- SECURITY_FIX.md com hardening guide
- IMPLEMENTATION_GUIDE.md com roadmap"

git push origin feature/fase1-testes-e-qualidade
Q
cd /workspaces/Txeka-Ntiyiso/api-gateway

# Instalar dependências de teste
poetry install --with test

# Ativar ambiente
poetry shell

# Executar testes que já validei
pytest tests/test_core_hashing.py tests/test_core_security.py -v

# Se passar, executar todos
pytest tests/ -v --cov=src --cov-report=term-missing
# Sair de qualquer heredoc ou modo de input
Ctrl + C

# Ou se estiver em um editor de texto (nano/vim)
Ctrl + X

Ctrl + C

exit
clear
