// src/services/api.js
// Cliente HTTP Enterprise Grade — Axios com interceptores, refresh token, retry e tratamento global

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.txekantiyiso.co.mz';

// ─── Instância Principal ─────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─── Instância Pública (sem auth) ────────────────────────────────────
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('txeka_access_token');
const getRefreshToken = () => localStorage.getItem('txeka_refresh_token');
const setTokens = (access, refresh) => {
  localStorage.setItem('txeka_access_token', access);
  if (refresh) localStorage.setItem('txeka_refresh_token', refresh);
};
const clearAuth = () => {
  localStorage.removeItem('txeka_access_token');
  localStorage.removeItem('txeka_refresh_token');
  localStorage.removeItem('txeka_institution');
  window.location.href = '/login';
};

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

// ─── Request Interceptor ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Timestamp CAT (UTC+2) para auditoria
    config.headers['X-Request-Time'] = new Date().toISOString();
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Erro 401 + não é retry + tem refresh token
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

    // Erro 403 — Acesso negado
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('txeka:forbidden'));
    }

    // Erro 422 — Validação
    if (error.response?.status === 422) {
      const details = error.response.data?.detail || [];
      const messages = details.map((d) => `${d.loc?.join('.')}: ${d.msg}`).join('; ');
      error.userMessage = messages || 'Dados inválidos. Verifique os campos.';
    }

    // Erro 500+
    if (error.response?.status >= 500) {
      error.userMessage = 'Erro interno do servidor. A equipe técnica foi notificada.';
    }

    // Network Error / Timeout
    if (!error.response) {
      error.userMessage = 'Sem conexão com o servidor. Verifique a sua internet.';
    }

    return Promise.reject(error);
  }
);

// ─── Endpoints Documentados (OpenAPI v2.0.0) ─────────────────────────

// AUTH
export const loginInstitution = (data) => api.post('/api/v1/auth/login', data);
export const loginAdmin = (email, password) => api.post('/api/v1/auth/admin/login', null, { params: { email, password } });

// EMISSION
export const emitDocument = (file, documentType = 'DUAT', institutionId = 'INAGE') => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/v1/certify', formData, {
    params: { document_type: documentType, institution_id: institutionId },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const emitBulk = (payload) => api.post('/api/v1/certify/bulk', payload);

// VERIFICATION
export const verifyByHash = (hash) => publicApi.get(`/api/v1/verify/${hash}`);
export const verifyByPost = (hash) => api.post('/api/v1/verify', { hash });

// REVOCATION
export const revokeDocument = (docId, reason) => api.post(`/api/v1/emissions/${docId}/revoke`, { reason });

// AUDIT
export const getAuditLogs = (params) => api.get('/api/v1/audit/logs', { params });
export const getDocumentHistory = (docHash) => api.get(`/api/v1/audit/document/${docHash}/history`);
export const getAuditStats = (params) => api.get('/api/v1/audit/stats', { params });

// INSTITUTIONS
export const listInstitutions = (params) => api.get('/api/v1/institutions', { params });
export const getInstitution = (id) => api.get(`/api/v1/institutions/${id}`);
export const createInstitution = (data) => api.post('/api/v1/institutions', data);
export const updateInstitution = (id, data) => api.patch(`/api/v1/institutions/${id}`, data);
export const addCredits = (id, data) => api.post(`/api/v1/institutions/${id}/credits`, data);
export const getCreditHistory = (id, params) => api.get(`/api/v1/institutions/${id}/credit-history`, { params });
export const resetPassword = (id) => api.post(`/api/v1/institutions/${id}/reset-password`);
export const regenerateApiKey = (id) => api.post(`/api/v1/institutions/${id}/regenerate-api-key`);

// ME (Instituição logada)
export const getMyDashboard = () => api.get('/api/v1/institutions/me/dashboard');
export const getMyCredits = () => api.get('/api/v1/institutions/me/credits');
export const getMyCreditHistory = (params) => api.get('/api/v1/institutions/me/credit-history', { params });

// HEALTH
export const healthCheck = () => publicApi.get('/health');

export default api;
