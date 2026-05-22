# 🇲🇿 DocVerify MZ
**Plataforma Digital de Verificação e Autenticação de Documentos**

O **DocVerify MZ** é uma plataforma tecnológica de infraestrutura segura concebida para eliminar a fraude documental, agilizar os processos de validação institucional e permitir a verificação em tempo real nos ecossistemas governamental, financeiro e empresarial em Moçambique. 

O sistema utiliza hashing criptográfico (SHA-256), APIs seguras e mecanismos de validação baseados em códigos QR para criar um ambiente de verificação de documentos confiável e auditável.

---

## 🎯 O Problema que Resolvemos
* **Falsificação de Documentos:** Altas taxas de certificados académicos, títulos de terra (DUATs) e licenças corporativas falsificados.
* **Atrasos Burocráticos:** Processos de verificação manual que tornam lento o processo de integração em bancos (KYC) e a prestação de serviços públicos.
* **Fricção Económica:** Perda de receitas e de confiança no setor financeiro devido à fraude de identidade.

---

## 🏗️ Arquitetura do Sistema (Monorepo)
A arquitetura modular garante máxima segurança e "Privacy by Design" (Privacidade desde a Conceção), garantindo que os dados originais dos cidadãos nunca são expostos na internet.

* 📁 **`core/` (O Motor Criptográfico):** Algoritmo SHA-256 que atua como "impressão digital" única dos documentos.
* 📁 **`api-gateway/` (O Cérebro Central):** API construída em **FastAPI** que comunica com a base de dados (SQLite) para verificar e registar a autenticidade dos hashes.
* 📁 **`portal-web/` (A Interface):** Portal em HTML/JS onde o cálculo do hash é feito *localmente no navegador do utilizador*, enviando apenas a assinatura digital para a API.

---

## 🚀 Como Executar Localmente

Para equipas técnicas e programadores que desejam testar a API do DocVerify MZ localmente:

**1. Instalar as dependências:**
```bash
pip install fastapi uvicorn pydantic
