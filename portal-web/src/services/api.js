// Enterprise v3.0 — Axios + Interceptores + Refresh Token + Retry

import axios from 'axios';

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────
// Agora:    https://txeka-ntiyiso-api.onrender.com
// Futuro:   https://api.txeka-ntiyiso.co.mz
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com';

// ─── Instância Principal (autenticada) ───────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─── Instância Pública (sem auth — verify pública, health) ─────────────
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─── Helpers localStorage (compatível com código existente) ──────────
const getToken = () => localStorage.getItem('authToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (access, refresh) => {
  localStorage.setItem('authToken', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
};
const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('institutionId');
  window.location.href = '/login';
};

// ─── Refresh Token Queue ─────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = [];
const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};
const addRefreshSubscriber = (cb) => refreshSubscribers.push(cb);

// ─── Request Interceptor ───────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // Timestamp CAT (UTC+2) para auditoria
    config.headers['X-Request-Time'] = new Date().toISOString();
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Refresh Automático + Tradução de Erros ───
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 + não é retry + tem refresh token → renovar
    if (error.response?.status === 401 && !originalRequest._retry && getRefreshToken()) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const rs = await publicApi.post('/api/v1/auth/refresh', {
          refresh_token: getRefreshToken(),
        });
        const { access_token, refresh_token } = rs.data;
        setTokens(access_token, refresh_token);
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        onRefreshed(access_token);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        clearAuth();
        return Promise.reject(refreshError);
      }
    }

    // Tradução de erros (compatível com o seu translateError)
    const status = error.response?.status;
    const data = error.response?.data || {};
    const detail = data.detail?.[0]?.msg;

    const codeMap = {
      400: { code: 'VALIDATION', message: detail || 'Dados inválidos', type: 'error' },
      401: { code: 'UNAUTHORIZED', message: 'Sessão expirada. Faça login novamente.', type: 'error' },
      403: { code: 'FORBIDDEN', message: 'Sem permissão para esta operação.', type: 'error' },
      404: { code: 'NOT_FOUND', message: 'Recurso não encontrado.', type: 'error' },
      409: { code: 'CONFLICT', message: 'Conflito de dados.', type: 'error' },
      422: { code: 'VALIDATION', message: detail || 'Dados inválidos', type: 'error' },
      429: { code: 'RATE_LIMIT', message: 'Muitas requisições. Aguarde.', type: 'warning' },
      500: { code: 'SERVER_ERROR', message: 'Erro interno do servidor.', type: 'error' },
      503: { code: 'SERVICE_DOWN', message: 'Serviço temporariamente indisponível.', type: 'warning' },
    };

    if (status) {
      error.translated = codeMap[status] || { code: 'UNKNOWN', message: data.message || 'Erro inesperado', type: 'error' };
    } else {
      error.translated = { code: 'NETWORK', message: 'Sem conexão. Verifique a internet.', type: 'error' };
    }

    error.userMessage = error.translated.message;
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════════════
// AUTH — nomes compatíveis com código existente
// ═══════════════════════════════════════════════════════════════════════

export async function login(institution_id, password) {
  const { data } = await api.post('/api/v1/auth/login', { institution_id, password });
  if (data.access_token) {
    setTokens(data.access_token, data.refresh_token);
    localStorage.setItem('userData', JSON.stringify(data.institution || {}));
  }
  return data;
}

export async function loginAdmin(email, password) {
  const { data } = await api.post('/api/v1/auth/admin/login', null, {
    params: { email, password },
  });
  if (data.access_token) {
    setTokens(data.access_token, data.refresh_token);
  }
  return data;
}

// ═══════════════════════════════════════════════════════════════════════
// VERIFICATION — nomes compatíveis
// ═══════════════════════════════════════════════════════════════════════

export async function verifyDocumentByHash(doc_hash) {
  const { data } = await publicApi.get(`/api/v1/verify/${encodeURIComponent(doc_hash)}`);
  return data;
}

export async function verifyDocument(hash) {
  const { data } = await api.post('/api/v1/verify', { hash });
  return data;
}

// ═══════════════════════════════════════════════════════════════════════
// EMISSION — nomes compatíveis
// ═══════════════════════════════════════════════════════════════════════

export async function emitDocument(file, document_type = 'DUAT', institution_id = null) {
  const formData = new FormData();
  formData.append('file', file);

  const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
  const instId = institution_id || currentUser.id || localStorage.getItem('institutionId');

  const { data } = await api.post('/api/v1/certify', formData, {
    params: { document_type, ...(instId && { institution_id: instId }) },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ═══════════════════════════════════════════════════════════════════════
// INSTITUTION DASHBOARD — nomes compatíveis
// ═══════════════════════════════════════════════════════════════════════

export async function getMyDashboard() {
  const { data } = await api.get('/api/v1/institutions/me/dashboard');
  return data;
}

export async function getMyCredits() {
  const { data } = await api.get('/api/v1/institutions/me/credits');
  return data;
}

export async function getMyCreditHistory(skip = 0, limit = 50) {
  const { data } = await api.get(`/api/v1/institutions/me/credit-history`, {
    params: { skip, limit },
  });
  return data;
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN / AUDIT — nomes compatíveis
// ═══════════════════════════════════════════════════════════════════════

export async function getAuditStats(institution_id = null, start_date = null, end_date = null) {
  const params = {};
  if (institution_id) params.institution_id = institution_id;
  if (start_date) params.start_date = start_date;
  if (end_date) params.end_date = end_date;
  const { data } = await api.get('/api/v1/audit/stats', { params });
  return data;
}

export async function getAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.action) params.append('action', filters.action);
  if (filters.resource_type) params.append('resource_type', filters.resource_type);
  if (filters.user_email) params.append('user_email', filters.user_email);
  if (filters.institution_id) params.append('institution_id', filters.institution_id);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  params.append('limit', filters.limit || 100);
  params.append('offset', filters.offset || 0);
  const { data } = await api.get(`/api/v1/audit/logs?${params.toString()}`);
  return data;
}

export async function listInstitutions(skip = 0, limit = 100, status = null) {
  const params = { skip, limit };
  if (status) params.status = status;
  const { data } = await api.get('/api/v1/institutions', { params });
  return data;
}

export async function createInstitution(data) {
  const { data: responseData } = await api.post('/api/v1/institutions', data);
  return responseData;
}

export async function updateInstitution(institution_id, data) {
  const { data: responseData } = await api.patch(`/api/v1/institutions/${encodeURIComponent(institution_id)}`, data);
  return responseData;
}

export async function addCredits(institution_id, data) {
  const { data: responseData } = await api.post(`/api/v1/institutions/${encodeURIComponent(institution_id)}/credits`, data);
  return responseData;
}

export async function getInstitutionCreditHistory(institution_id, skip = 0, limit = 50) {
  const { data } = await api.get(`/api/v1/institutions/${encodeURIComponent(institution_id)}/credit-history`, {
    params: { skip, limit },
  });
  return data;
}

export async function resetInstitutionPassword(institution_id) {
  const { data } = await api.post(`/api/v1/institutions/${encodeURIComponent(institution_id)}/reset-password`);
  return data;
}

export async function regenerateApiKey(institution_id) {
  const { data } = await api.post(`/api/v1/institutions/${encodeURIComponent(institution_id)}/regenerate-api-key`);
  return data;
}

// ═══════════════════════════════════════════════════════════════════════
// REVOCATION — nomes compatíveis
// ═══════════════════════════════════════════════════════════════════════

export async function revokeDocument(doc_id, reason) {
  const { data } = await api.post(`/api/v1/emissions/${encodeURIComponent(doc_id)}/revoke`, { reason });
  return data;
}

// ═══════════════════════════════════════════════════════════════════════
// HEALTH — nomes compatíveis
// ═══════════════════════════════════════════════════════════════════════

export async function checkApiHealth() {
  try {
    const response = await publicApi.get('/health');
    return response.status === 200;
  } catch {
    return false;
  }
}

export async function getApiInfo() {
  const { data } = await publicApi.get('/');
  return data;
}

// ═══════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT — compatível com import api from './services/api'
// ═══════════════════════════════════════════════════════════════════════

export default {
  login,
  loginAdmin,
  verifyDocumentByHash,
  verifyDocument,
  emitDocument,
  getMyDashboard,
  getMyCredits,
  getMyCreditHistory,
  getAuditStats,
  getAuditLogs,
  listInstitutions,
  createInstitution,
  updateInstitution,
  addCredits,
  getInstitutionCreditHistory,
  resetInstitutionPassword,
  regenerateApiKey,
  revokeDocument,
  checkApiHealth,
  getApiInfo,
};

