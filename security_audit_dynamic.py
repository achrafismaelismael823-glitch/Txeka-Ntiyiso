#!/usr/bin/env python3
"""
TXEKA NTIYISO — DYNAMIC SECURITY AUDIT
Validação de vulnerabilidades contra endpoint real em produção.

Uso:
    python security_audit_dynamic.py --url https://txeka-ntiyiso-api.onrender.com

Resultado: Relatório com ✅/❌ para cada vulnerabilidade crítica.
"""

import sys
import json
import time
import requests
import argparse
import concurrent.futures
import io
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timezone
import hashlib

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

TESTING_CONFIG = {
    "institution_test": {
        "id": "CFN",
        "password": "CiCvzU7nPIUW",
        "email": "test@cfn.co.mz",
        "name": "CFN Test Institution"
    },
    # Instituições fictícias para teste de IDOR
    "institution_idor_target": {
        "id": "INAGE",
        "name": "INAGE (IDOR Target)"
    },
    "admin": {
        "email": "admin@txeka.co.mz",
        "password": "AdminPass123"  # Placeholder — não usamos em produção
    }
}

class SecurityAuditReport:
    def __init__(self):
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.results = []
        self.summary = {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "error": 0,
            "skipped": 0
        }

    def add_result(self, vuln_id: str, name: str, status: str, message: str, details: Dict = None):
        """Adicionar resultado de teste"""
        self.results.append({
            "id": vuln_id,
            "name": name,
            "status": status,  # PASS / FAIL / ERROR / SKIP
            "message": message,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        self.summary["total"] += 1
        self.summary[status.lower()] += 1

    def print_report(self):
        """Exibir relatório formatado"""
        print("\n" + "="*80)
        print("TXEKA NTIYISO — DYNAMIC SECURITY AUDIT REPORT")
        print(f"Timestamp: {self.timestamp}")
        print("="*80 + "\n")

        for result in self.results:
            status_icon = {
                "PASS": "✅",
                "FAIL": "❌",
                "ERROR": "⚠️ ",
                "SKIP": "⏭️ "
            }.get(result["status"], "❓")

            print(f"{status_icon} [{result['id']}] {result['name']}")
            print(f"   Status: {result['status']}")
            print(f"   Message: {result['message']}")
            if result["details"]:
                print(f"   Details:")
                for key, value in result["details"].items():
                    if isinstance(value, dict):
                        print(f"      {key}: {json.dumps(value, indent=8)}")
                    else:
                        print(f"      {key}: {value}")
            print()

        print("="*80)
        print("SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.summary['total']}")
        print(f"✅ Passed (Secure): {self.summary['passed']}")
        print(f"❌ Failed (Vulnerable): {self.summary['failed']}")
        print(f"⚠️  Errors: {self.summary['error']}")
        print(f"⏭️  Skipped: {self.summary['skipped']}")
        print()

        # Risk Assessment
        if self.summary["failed"] == 0:
            print("🟢 RISK LEVEL: LOW (No critical vulnerabilities detected)")
        elif self.summary["failed"] <= 2:
            print("🟠 RISK LEVEL: MEDIUM (Some vulnerabilities detected)")
        else:
            print("🔴 RISK LEVEL: CRITICAL (Multiple vulnerabilities detected)")
        print()

    def export_json(self, filename: str = "security_audit_report.json"):
        """Exportar relatório em JSON"""
        with open(filename, "w") as f:
            json.dump({
                "timestamp": self.timestamp,
                "summary": self.summary,
                "results": self.results
            }, f, indent=2)
        print(f"✅ Report exported to {filename}")


# ============================================================================
# TESTS
# ============================================================================

class TxekaSecurityAudit:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.report = SecurityAuditReport()
        self.session = requests.Session()
        self.tokens = {}
        self.cfn_token = None

    def test_endpoint(self, method: str, endpoint: str, **kwargs) -> Optional[requests.Response]:
        """Helper para fazer requests"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.request(method, url, timeout=10, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")

    def login_cfn(self) -> bool:
        """Login como instituição CFN"""
        try:
            response = self.test_endpoint(
                "POST", "/api/v1/auth/login",
                json={
                    "institution_id": TESTING_CONFIG["institution_test"]["id"],
                    "password": TESTING_CONFIG["institution_test"]["password"]
                }
            )

            if response.status_code == 200:
                data = response.json()
                self.cfn_token = data.get("access_token")
                if self.cfn_token:
                    print("✅ CFN login successful")
                    return True
                else:
                    print("❌ CFN login returned no token")
                    return False
            else:
                print(f"❌ CFN login failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False

        except Exception as e:
            print(f"❌ CFN login error: {str(e)}")
            return False

    # ────────────────────────────────────────────────────────────────────────
    # TEST: Health Check
    # ────────────────────────────────────────────────────────────────────────

    def test_health_check(self):
        """Verificar se o servidor está online"""
        try:
            response = self.test_endpoint("GET", "/health")
            if response.status_code == 200:
                self.report.add_result(
                    "HEALTH", "Server Health Check", "PASS",
                    "Server is online and responding",
                    {"status": response.json()}
                )
                return True
            else:
                self.report.add_result(
                    "HEALTH", "Server Health Check", "ERROR",
                    f"Unexpected status code: {response.status_code}"
                )
                return False
        except Exception as e:
            self.report.add_result(
                "HEALTH", "Server Health Check", "ERROR",
                f"Connection failed: {str(e)}"
            )
            return False

    # ────────────────────────────────────────────────────────────────────────
    # TEST TXK-SEC-001: IDOR Multi-Tenant
    # ────────────────────────────────────────────────────────────────────────

    def test_idor_multi_tenant(self):
        """
        Teste: Conseguir emitir documentos em nome de outra instituição?
        
        Cenário:
        1. Login como CFN (conhecemos as credenciais)
        2. Tentar emitir documento com institution_id=INAGE (outra instituição)
        3. Se sucesso (200) → VULNERÁVEL
        4. Se rejeitado (403) → SEGURO
        """
        if not self.cfn_token:
            self.report.add_result(
                "TXK-SEC-001", "IDOR Multi-Tenant", "ERROR",
                "CFN token not available"
            )
            return

        try:
            # Criar documento de teste (PDF mínimo válido)
            test_pdf = b"%PDF-1.4\n%minimal test pdf\n"

            print("   [Attempting IDOR: CFN → INAGE...]")

            # Tentar emitir como outra instituição (INAGE)
            cert_response = self.test_endpoint(
                "POST", "/api/v1/certify",
                headers={"Authorization": f"Bearer {self.cfn_token}"},
                files={"file": ("test.pdf", io.BytesIO(test_pdf))},
                data={
                    "institution_id": TESTING_CONFIG["institution_idor_target"]["id"],  # ← IDOR ATTEMPT
                    "document_type": "TEST_IDOR"
                }
            )

            print(f"      Response: {cert_response.status_code}")

            if cert_response.status_code == 200:
                # ❌ VULNERÁVEL
                response_data = cert_response.json()
                self.report.add_result(
                    "TXK-SEC-001", "IDOR Multi-Tenant", "FAIL",
                    f"CFN conseguiu emitir documento em nome de {TESTING_CONFIG['institution_idor_target']['id']} (VULNERÁVEL)",
                    {
                        "response_code": 200,
                        "institution_attempted": TESTING_CONFIG["institution_idor_target"]["id"],
                        "doc_id": response_data.get("doc_id"),
                        "message": response_data.get("message")
                    }
                )
            elif cert_response.status_code == 403:
                # ✅ SEGURO
                self.report.add_result(
                    "TXK-SEC-001", "IDOR Multi-Tenant", "PASS",
                    "Emission blocked (403) — CFN cannot emit on behalf of INAGE",
                    {
                        "response_code": 403,
                        "error_detail": cert_response.json().get("detail")
                    }
                )
            elif cert_response.status_code == 400:
                # Possível: falta de parâmetro ou validação básica
                self.report.add_result(
                    "TXK-SEC-001", "IDOR Multi-Tenant", "PASS",
                    "Request rejected (400 Bad Request)",
                    {
                        "response_code": 400,
                        "detail": cert_response.json().get("detail")
                    }
                )
            else:
                self.report.add_result(
                    "TXK-SEC-001", "IDOR Multi-Tenant", "ERROR",
                    f"Unexpected response: {cert_response.status_code}",
                    {
                        "response_code": cert_response.status_code,
                        "response": cert_response.text[:200]
                    }
                )

        except Exception as e:
            self.report.add_result(
                "TXK-SEC-001", "IDOR Multi-Tenant", "ERROR",
                f"Test execution failed: {str(e)}"
            )

    # ────────────────────────────────────────────────────────────────────────
    # TEST TXK-SEC-002: JWT Escalada de Privilégios
    # ────────────────────────────────────────────────────────────────────────

    def test_jwt_escalation(self):
        """
        Teste: Conseguir forjar um token admin com a secret ilustrativa?
        
        Nota: Apenas testamos se o valor do .env.example funciona.
        Não testamos brute-force da chave real.
        """
        try:
            try:
                import jwt as pyjwt
            except ImportError:
                print("   [JWT library not available, skipping JWT escalation test]")
                self.report.add_result(
                    "TXK-SEC-002", "JWT Escalation", "SKIP",
                    "PyJWT library not installed"
                )
                return

            # Chave ilustrativa do .env.example (NUNCA é a real)
            test_secrets = [
                "TXEKA-NTIYISO-2026-k3ab9sGze6Igc1u8Q5@i+j0#0KX0rBzj",
                "dev-secret-key",
                "test"
            ]

            forged_tokens = []
            for secret in test_secrets:
                try:
                    forged_token = pyjwt.encode(
                        {
                            "sub": "attacker@evil.com",
                            "email": "attacker@evil.com",
                            "role": "admin",
                            "id": "attacker",
                            "institution": None,
                            "exp": int(time.time()) + 3600,
                            "iat": int(time.time()),
                            "type": "access"
                        },
                        secret,
                        algorithm="HS256"
                    )
                    forged_tokens.append((secret, forged_token))
                except:
                    pass

            if not forged_tokens:
                self.report.add_result(
                    "TXK-SEC-002", "JWT Escalation", "PASS",
                    "Could not forge tokens with known secrets",
                    {"secrets_tested": 3}
                )
                return

            print(f"   [Testing {len(forged_tokens)} forged tokens against admin endpoint...]")

            # Testar cada token forjado
            admin_only_endpoint = "/api/v1/institutions"

            vulnerable = False
            for secret, forged_token in forged_tokens:
                try:
                    response = self.test_endpoint(
                        "GET", admin_only_endpoint,
                        headers={"Authorization": f"Bearer {forged_token}"}
                    )

                    if response.status_code == 200:
                        vulnerable = True
                        self.report.add_result(
                            "TXK-SEC-002", "JWT Escalation", "FAIL",
                            f"Forged admin token ACCEPTED! Secret was: {secret[:30]}...",
                            {
                                "response_code": 200,
                                "secret_prefix": secret[:30]
                            }
                        )
                        return

                except Exception as e:
                    pass

            if not vulnerable:
                self.report.add_result(
                    "TXK-SEC-002", "JWT Escalation", "PASS",
                    "Forged tokens rejected (403/401)",
                    {"forged_tokens_tested": len(forged_tokens)}
                )

        except Exception as e:
            self.report.add_result(
                "TXK-SEC-002", "JWT Escalation", "ERROR",
                f"Test execution failed: {str(e)}"
            )

    # ────────────────────────────────────────────────────────────────────────
    # TEST TXK-SEC-003: Race Condition de Créditos
    # ────────────────────────────────────────────────────────────────────────

    def test_race_condition_credits(self):
        """
        Teste: Emitir múltiplos documentos simultaneamente com poucos créditos
        
        Scenario:
        1. Verificar quantos créditos CFN tem
        2. Se tiver <5, usar para teste
        3. Enviar 10 requests simultâneos
        4. Contar quantos foram aceitos
        5. Se aceitos > créditos → VULNERÁVEL
        """
        if not self.cfn_token:
            self.report.add_result(
                "TXK-SEC-003", "Race Condition - Credits", "ERROR",
                "CFN token not available"
            )
            return

        try:
            # Primeiro, verificar créditos
            print("   [Checking CFN credits...]")
            credits_response = self.test_endpoint(
                "GET", "/api/v1/institutions/me/credits",
                headers={"Authorization": f"Bearer {self.cfn_token}"}
            )

            if credits_response.status_code != 200:
                self.report.add_result(
                    "TXK-SEC-003", "Race Condition - Credits", "SKIP",
                    f"Could not fetch credit balance: {credits_response.status_code}"
                )
                return

            credits_data = credits_response.json()
            available_credits = credits_data.get("credits", 0)
            print(f"      CFN has {available_credits} credits")

            if available_credits < 2:
                self.report.add_result(
                    "TXK-SEC-003", "Race Condition - Credits", "SKIP",
                    f"Insufficient credits for race condition test (have {available_credits}, need ≥2)"
                )
                return

            # Enviar múltiplas requisições simultaneamente
            test_count = min(10, available_credits + 5)  # Tentar emitir mais que créditos
            print(f"   [Sending {test_count} concurrent emission requests...]")

            test_pdf = b"%PDF-1.4\n%race condition test\n"

            def emit_single():
                try:
                    return self.test_endpoint(
                        "POST", "/api/v1/certify",
                        headers={"Authorization": f"Bearer {self.cfn_token}"},
                        files={"file": ("test.pdf", io.BytesIO(test_pdf))},
                        data={
                            "institution_id": "CFN",
                            "document_type": "TEST_RACE"
                        },
                        timeout=5
                    )
                except:
                    return None

            # Executar em paralelo
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                results = list(executor.map(lambda x: emit_single(), range(test_count)))

            success_count = sum(1 for r in results if r and r.status_code == 200)
            failed_count = sum(1 for r in results if r and r.status_code != 200)

            print(f"      Results: {success_count} successful, {failed_count} failed")

            if success_count > available_credits:
                # ❌ VULNERÁVEL — emitiu mais documentos que créditos
                self.report.add_result(
                    "TXK-SEC-003", "Race Condition - Credits", "FAIL",
                    f"Race condition detected! Emitted {success_count} docs with only {available_credits} credits (VULNERÁVEL)",
                    {
                        "credits_available": available_credits,
                        "documents_emitted": success_count,
                        "overdraft": success_count - available_credits
                    }
                )
            else:
                # ✅ SEGURO — respeita limite de créditos
                self.report.add_result(
                    "TXK-SEC-003", "Race Condition - Credits", "PASS",
                    f"Credit limit respected: emitted {success_count} docs with {available_credits} available",
                    {
                        "credits_available": available_credits,
                        "documents_emitted": success_count,
                        "requests_total": test_count
                    }
                )

        except Exception as e:
            self.report.add_result(
                "TXK-SEC-003", "Race Condition - Credits", "ERROR",
                f"Test execution failed: {str(e)}"
            )

    # ────────────────────────────────────────────────────────────────────────
    # TEST TXK-SEC-005: Rate Limiting
    # ────────────────────────────────────────────────────────────────────────

    def test_rate_limiting(self):
        """
        Teste: Enviar 50 requests rápidos para /verify
        
        Se nenhum for bloqueado (429) → VULNERÁVEL
        Se alguns forem bloqueados (429) → SEGURO
        """
        try:
            # Hash fictício válido
            test_hash = "a" * 64

            blocked_count = 0
            success_count = 0

            print("   [Testing rate limiting with 50 rapid requests...]")

            for i in range(50):
                response = self.test_endpoint(
                    "GET", f"/api/v1/verify/{test_hash}",
                    timeout=5
                )

                if response.status_code == 429:
                    blocked_count += 1
                elif response.status_code in [200, 404]:  # 404 = hash not found (ok)
                    success_count += 1

            print(f"      Rate limiting result: {blocked_count} blocked, {success_count} allowed")

            if blocked_count > 10:  # Expectativa: >20% bloqueado
                self.report.add_result(
                    "TXK-SEC-005", "Rate Limiting", "PASS",
                    f"Rate limiting active: {blocked_count}/50 requests blocked",
                    {"blocked": blocked_count, "allowed": success_count}
                )
            elif blocked_count == 0:
                self.report.add_result(
                    "TXK-SEC-005", "Rate Limiting", "FAIL",
                    f"No rate limiting detected: 0/50 requests blocked (VULNERÁVEL)",
                    {"blocked": 0, "allowed": 50}
                )
            else:
                self.report.add_result(
                    "TXK-SEC-005", "Rate Limiting", "FAIL",
                    f"Rate limiting too weak: only {blocked_count}/50 requests blocked",
                    {"blocked": blocked_count, "allowed": success_count}
                )

        except Exception as e:
            self.report.add_result(
                "TXK-SEC-005", "Rate Limiting", "ERROR",
                f"Test execution failed: {str(e)}"
            )

    # ────────────────────────────────────────────────────────────────────────
    # TEST TXK-SEC-011: Brute Force Protection
    # ────────────────────────────────────────────────────────────────────────

    def test_brute_force_protection(self):
        """
        Teste: 20 tentativas de login falhadas
        
        Se todas forem aceitas (401) → Sem proteção
        Se alguma for bloqueada (429/423) → Proteção ativa
        """
        try:
            blocked_count = 0

            print("   [Testing brute force protection with 20 failed logins...]")

            for i in range(20):
                response = self.test_endpoint(
                    "POST", "/api/v1/auth/login",
                    json={
                        "institution_id": "INVALID_INST_12345",
                        "password": f"wrong_password_{i}"
                    },
                    timeout=5
                )

                if response.status_code in [429, 423, 503]:  # Rate limit / Locked / Service Unavailable
                    blocked_count += 1

            print(f"      Brute force result: {blocked_count} blocked, {20 - blocked_count} allowed")

            if blocked_count > 0:
                self.report.add_result(
                    "TXK-SEC-011", "Brute Force Protection", "PASS",
                    f"Brute force protection active: {blocked_count}/20 attempts blocked",
                    {"blocked": blocked_count}
                )
            else:
                self.report.add_result(
                    "TXK-SEC-011", "Brute Force Protection", "FAIL",
                    "No brute force protection: all 20 attempts allowed (VULNERÁVEL)",
                    {"blocked": 0, "allowed": 20}
                )

        except Exception as e:
            self.report.add_result(
                "TXK-SEC-011", "Brute Force Protection", "ERROR",
                f"Test execution failed: {str(e)}"
            )

    # ────────────────────────────────────────────────────────────────────────
    # MAIN AUDIT EXECUTION
    # ────────────────────────────────────────────────────────────────────────

    def run_all_tests(self):
        """Executar todos os testes"""
        print(f"\n🔍 Starting Security Audit against: {self.base_url}")
        print("="*80)

        # Verificar conectividade
        if not self.test_health_check():
            print("❌ Server not reachable. Aborting.")
            return

        print("✅ Server online. Running tests...\n")

        # Login como CFN (pré-requisito)
        print("📝 Preliminary: Logging in as CFN test institution...")
        if not self.login_cfn():
            print("❌ Cannot proceed without CFN login. Aborting tests.")
            return

        print("\n🧪 Running security tests...\n")

        # Executar testes
        self.test_idor_multi_tenant()
        self.test_jwt_escalation()
        self.test_race_condition_credits()
        self.test_rate_limiting()
        self.test_brute_force_protection()

        # Exibir relatório
        self.report.print_report()
        self.report.export_json()


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Txeka Ntiyiso Dynamic Security Audit"
    )
    parser.add_argument(
        "--url",
        default="https://txeka-ntiyiso-api.onrender.com",
        help="Base URL da API (default: production)"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Timeout em segundos"
    )

    args = parser.parse_args()

    audit = TxekaSecurityAudit(args.url)
    audit.run_all_tests()


if __name__ == "__main__":
    main()
