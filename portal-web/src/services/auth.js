// src/services/auth.js
// v3.0 — Compatível com Txeka Ntiyiso API v2.0.0
// SPEC: InstitutionResponse.role é required, não hardcoded!

import api from './api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com';

/**
 * Login de Instituição
 * POST /api/v1/auth/login
 * Body: { institution_id, password }
 * Response: InstitutionLoginResponse { access_token, token_type, institution, message }
 * SPEC: InstitutionResponse.role é required → usamos data.institution.role
 */
export async function login(institution_id, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institution_id, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const translated = translateError(response.status, errorData);
      throw Object.assign(new Error(translated.message), { translated, status: response.status });
    }

    const data = await response.json();

    // ENTERPRISE: Usar role da API, não hardcoded
    const role = data.institution?.role || 'institution';

    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('tokenType', data.token_type || 'bearer');
    localStorage.setItem('institutionId', data.institution?.id || institution_id);
    localStorage.setItem('username', data.institution?.name || institution_id);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userData', JSON.stringify(data.institution || {}));

    return data;
  } catch (error) {
    if (error.translated) throw error;
    const translated = translateError('NETWORK', { message: error.message });
    throw Object.assign(new Error(translated.message), { translated, status: 'NETWORK' });
  }
}

/**
 * Login de Administrador
 * POST /api/v1/auth/admin/login?email=...&password=...
 * Query params (não body!)
 * Response: { access_token, token_type } — SEM institution!
 */
export async function loginAdmin(email, password) {
  try {
    const params = new URLSearchParams({ email, password });
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/admin/login?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const translated = translateError(response.status, errorData);
      throw Object.assign(new Error(translated.message), { translated, status: response.status });
    }

    const data = await response.json();

    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('tokenType', data.token_type || 'bearer');
    localStorage.setItem('username', email);
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('userData', JSON.stringify({ email, role: 'admin' }));

    return data;
  } catch (error) {
    if (error.translated) throw error;
    const translated = translateError('NETWORK', { message: error.message });
    throw Object.assign(new Error(translated.message), { translated, status: 'NETWORK' });
  }
}

export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenType');
  localStorage.removeItem('institutionId');
  localStorage.removeItem('username');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userData');
}

export function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

export function getAuthToken() {
  return localStorage.getItem('authToken');
}

export function getCurrentUser() {
  const userData = localStorage.getItem('userData');
  return {
    username: localStorage.getItem('username'),
    role: localStorage.getItem('userRole'),
    institutionId: localStorage.getItem('institutionId'),
    ...(userData ? JSON.parse(userData) : {}),
  };
}

function translateError(status, data) {
  const codeMap = {
    400: { code: 'VALIDATION', message: data.detail?.[0]?.msg || 'Dados invalidos', type: 'error' },
    401: { code: 'UNAUTHORIZED', message: 'Credenciais invalidas. Verifique ID e senha.', type: 'error' },
    403: { code: 'FORBIDDEN', message: 'Acesso negado. Instituicao nao aprovada.', type: 'error' },
    404: { code: 'NOT_FOUND', message: 'Instituicao nao encontrada.', type: 'error' },
    429: { code: 'RATE_LIMIT', message: 'Muitas tentativas. Aguarde.', type: 'warning' },
    500: { code: 'SERVER_ERROR', message: 'Erro interno do servidor.', type: 'error' },
    503: { code: 'SERVICE_DOWN', message: 'Servico temporariamente indisponivel.', type: 'warning' },
    NETWORK: { code: 'NETWORK', message: 'Sem conexao. Verifique a internet.', type: 'error' },
    TIMEOUT: { code: 'TIMEOUT', message: 'Tempo de resposta excedido.', type: 'warning' },
  };
  return codeMap[status] || { code: 'UNKNOWN', message: data.message || 'Erro inesperado', type: 'error' };
}

