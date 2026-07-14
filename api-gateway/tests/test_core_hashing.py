"""Testes Unitários: Core Hashing"""
import pytest
from src.core.hashing import gerar_hash_sha256, validar_hash

class TestHashingSHA256:
    def test_gerar_hash_string(self):
        resultado = gerar_hash_sha256("Txeka Ntiyiso")
        assert isinstance(resultado, str)
        assert len(resultado) == 64

    def test_hash_deterministico(self):
        assert gerar_hash_sha256("teste") == gerar_hash_sha256("teste")

    def test_hash_unico_por_input(self):
        assert gerar_hash_sha256("a") != gerar_hash_sha256("b")

    def test_hash_vazio(self):
        resultado = gerar_hash_sha256("")
        assert len(resultado) == 64

    def test_tipo_invalido(self):
        with pytest.raises(TypeError):
            gerar_hash_sha256(123)

    def test_validar_hash_sucesso(self):
        conteudo = "teste"
        hash_esperado = gerar_hash_sha256(conteudo)
        assert validar_hash(conteudo, hash_esperado) is True

    def test_validar_hash_falha(self):
        assert validar_hash("teste", "a" * 64) is False
