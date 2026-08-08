import axios from 'axios';
import { authService } from './authService';

const rawUrl = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com';
const API_BASE_URL = rawUrl.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    // ── CORREÇÃO: Evitar duplicação de /api/v1 ──
    if (config.url && typeof config.url === 'string' && config.url.startsWith('/api/v1/')) {
      config.url = config.url.replace(/^\/api\/v1/, '');
    }
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const url = error.config?.url || '';

    // Logout em 401 (exceto login)
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/admin')) {
      authService.logout();
    }

    // Normalizar mensagem de erro
    let message = 'Erro de comunicação com o servidor';
    if (typeof data?.detail === 'string') message = data.detail;
    else if (Array.isArray(data?.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
    else if (data?.message) message = data.message;
    else if (data?.error) message = data.error;
    else if (error.message) message = error.message;

    error.normalizedMessage = message;
    return Promise.reject(error);
  }
);

// ── LOGIN ADAPTATIVO ──
const adaptiveAdminLogin = async (email, password) => {
  try {
    return await api.post('/auth/admin/login', { email, password });
  } catch (err) {
    if (err.response?.status === 422) {
      console.warn('[api.js] Admin login via body rejeitado (422). Fallback para query params.');
      return api.post(`/auth/admin/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    }
    throw err;
  }
};

export const endpoints = {
  health: {
    check: () => fetch(`${API_BASE_URL}/health`, { method: 'GET', mode: 'cors' }),
  },
  auth: {
    adminLogin: adaptiveAdminLogin,
    login: (data) => api.post('/auth/login', data),
  },
  audit: {
    logs: (params = {}) => api.get('/audit/logs', { params }),
    stats: (params = {}) => api.get('/audit/stats', { params }),
    documentHistory: (docHash) => api.get(`/audit/document/${docHash}/history`),
  },
  institutions: {
    list: (params = {}) => {
      // ── CORREÇÃO: Converter offset → skip se necessário ──
      const cleanParams = { ...params };
      if (cleanParams.offset !== undefined) {
        cleanParams.skip = cleanParams.offset;
        delete cleanParams.offset;
      }
      return api.get('/institutions', { params: cleanParams });
    },
    get: (id) => api.get(`/institutions/${id}`),
    create: (data) => api.post('/institutions', data),
    update: (id, data) => api.patch(`/institutions/${id}`, data),
    resetPassword: (id) => api.post(`/institutions/${id}/reset-password`),
    regenerateApiKey: (id) => api.post(`/institutions/${id}/regenerate-api-key`),
    dashboard: () => api.get('/institutions/me/dashboard'),
    credits: () => api.get('/institutions/me/credits'),
    // ── CORREÇÃO: Converter offset → skip (Swagger usa skip/limit) ──
    creditHistory: (params = {}) => {
      const clean = { ...params };
      if (clean.offset !== undefined) {
        clean.skip = clean.offset;
        delete clean.offset;
      }
      return api.get('/institutions/me/credit-history', { params: clean });
    },
    creditHistoryById: (id, params = {}) => {
      const clean = { ...params };
      if (clean.offset !== undefined) {
        clean.skip = clean.offset;
        delete clean.offset;
      }
      return api.get(`/institutions/${id}/credit-history`, { params: clean });
    },
    addCredits: (id, data) => api.post(`/institutions/${id}/credits`, data),
  },
  certify: {
    // single: multipart/form-data com document_type (query) e file (body)
    // institution_id só enviar se for admin a emitir por outra instituição
    single: (formData, queryParams = {}) => {
      const qs = new URLSearchParams();
      if (queryParams.document_type) qs.append('document_type', queryParams.document_type);
      if (queryParams.institution_id) qs.append('institution_id', queryParams.institution_id);
      const url = qs.toString() ? `/certify?${qs.toString()}` : '/certify';
      return api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    // bulk: JSON body com institution_id + documents[]
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
