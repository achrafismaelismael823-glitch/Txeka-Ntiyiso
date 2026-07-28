import axios from 'axios';
import { authService } from './auth';

// ═══════════════════════════════════════════════════
// NORMALIZAÇÃO ROBUSTA DA URL BASE
// ═══════════════════════════════════════════════════
const rawUrl = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com';

// Remove /api/v1 no final (com ou sem barra) e barra final solta
const API_BASE_URL = rawUrl
  .replace(/\/api\/v1\/?$/i, '')
  .replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ═══════════════════════════════════════════════════
// REQUEST INTERCEPTOR — limpa paths duplicados
// ═══════════════════════════════════════════════════
api.interceptors.request.use(
  (config) => {
    // Se alguém passar '/api/v1/audit/stats', limpa para '/audit/stats'
    if (config.url && typeof config.url === 'string' && config.url.startsWith('/api/v1/')) {
      config.url = config.url.replace(/^\/api\/v1/, '');
    }
    const token = authService.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════
// RESPONSE INTERCEPTOR
// ═══════════════════════════════════════════════════
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const url = error.config?.url || '';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';

    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/admin')) {
      authService.logout();
      window.location.href = '/login?expired=1';
    }

    let message = 'Erro de comunicação com o servidor';
    if (typeof data?.detail === 'string') message = data.detail;
    else if (Array.isArray(data?.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
    else if (data?.message) message = data.message;
    else if (error.message) message = error.message;

    error.normalizedMessage = message;
    error.debug = { status, statusText: error.response?.statusText, url, method, data };
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════
export const endpoints = {
  auth: {
    adminLogin: (email, password) =>
      api.post(`/auth/admin/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),
    login: (data) => api.post('/auth/login', data),
    refresh: () => api.post('/auth/refresh'),
  },
  audit: {
    logs: (params) => api.get('/audit/logs', { params }),
    stats: (params) => api.get('/audit/stats', { params }),
    documentHistory: (docHash) => api.get(`/audit/document/${docHash}/history`),
  },
  institutions: {
    list: (params) => api.get('/institutions', { params }),
    get: (id) => api.get(`/institutions/${id}`),
    create: (data) => api.post('/institutions', data),
    update: (id, data) => api.patch(`/institutions/${id}`, data),
    resetPassword: (id) => api.post(`/institutions/${id}/reset-password`),
    regenerateApiKey: (id) => api.post(`/institutions/${id}/regenerate-api-key`),
    dashboard: () => api.get('/institutions/me/dashboard'),
    credits: () => api.get('/institutions/me/credits'),
    creditHistory: (params) => api.get('/institutions/me/credit-history', { params }),
    creditHistoryById: (id, params) => api.get(`/institutions/${id}/credit-history`, { params }),
    addCredits: (id, data) => api.post(`/institutions/${id}/credits`, data),
  },
  certify: {
    single: (formData) =>
      api.post('/certify', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    bulk: (data) => api.post('/certify/bulk', data),
  },
  verify: {
    public: (hash) => api.get(`/verify/${hash}`),
    b2b: (hash) => api.post('/verify', { hash }),
  },
  emissions: {
    revoke: (docId, data) => api.post(`/emissions/${docId}/revoke`, data),
  },
};

