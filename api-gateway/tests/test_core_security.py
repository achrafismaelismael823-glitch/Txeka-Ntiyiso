"""Testes Unitários: Core Security"""
import pytest
from src.core.security import (
    sanitizar_entrada, validar_hash_sha256, validar_documento_id,
    criar_assinatura_segura, validar_assinatura
)

class TestSanitizacao:
    def test_sanitizar_string_limpa(self):
        assert sanitizar_entrada("Txeka") == "Txeka"

    def test_sanitizar_trim(self):
        assert sanitizar_entrada("  Txeka  ") == "Txeka"

    def test_sanitizar_tipo_invalido(self):
        with pytest.raises(TypeError):
            sanitizar_entrada(123)

class TestValidacaoHash:
    def test_hash_valido(self):
        assert validar_hash_sha256("a" * 64) is True

    def test_hash_muito_curto(self):
        assert validar_hash_sha256("a" * 63) is False

    def test_hash_com_caracteres_invalidos(self):
        assert validar_hash_sha256("g" * 64) is False

class TestHMAC:
    def test_criar_e_validar(self):
        dados = "documento"
        chave = "chave_secreta_32_chars!!"
        assinatura = criar_assinatura_segura(dados, chave)
        assert validar_assinatura(dados, assinatura, chave) is True

    def test_assinatura_dados_alterados(self):
        dados = "original"
        chave = "chave_secreta_32_chars!!"
        assinatura = criar_assinatura_segura(dados, chave)
        assert validar_assinatura("alterado", assinatura, chave) is False
