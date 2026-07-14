"""Configuração global do pytest — mocks mínimos necessários."""

import sys
from unittest.mock import MagicMock

# Mock APENAS do database (o que causa problemas de importação)
sys.modules['src.database'] = MagicMock()
sys.modules['src.database'].engine = MagicMock()
sys.modules['src.database'].AsyncSessionLocal = MagicMock()
sys.modules['src.database'].Base = MagicMock()
sys.modules['src.database'].AuditBase = MagicMock()
sys.modules['src.database'].get_db = MagicMock()
sys.modules['src.database'].init_db = MagicMock(return_value=True)

# Mock de services que importam database e causam circular
sys.modules['src.services.emission_service'] = MagicMock()
sys.modules['src.services.verification_service'] = MagicMock()
sys.modules['src.services.audit_service'] = MagicMock()

# NÃO mockar institution_service — ele tem funções puras que queremos testar
