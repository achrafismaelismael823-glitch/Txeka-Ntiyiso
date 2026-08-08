import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txekantiyiso-api.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — adiciona token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — trata 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper: converte offset para skip (backend usa skip/limit)
const normalizePagination = (params = {}) => {
  const clean = { ...params };
  if (clean.offset !== undefined) {
    clean.skip = clean.offset;
    delete clean.offset;
  }
  return clean;
};

export const endpoints = {
  // ── AUTH ──
  auth: {
    adminLogin: (data) => api.post('/auth/admin/login', null, { params: data }),
    institutionLogin: (data) => api.post('/auth/login', data),
  },

  // ── EMISSION (certify + revoke) ──
  // 🟢 Ambos: institution + admin
  emissions: {
    certify: (formData, queryString = '') => {
      const url = queryString ? `/certify?${queryString}` : '/certify';
      return api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    bulkCertify: (payload) => api.post('/certify/bulk', payload),
    revoke: (docId, reason) => api.post(`/emissions/${docId}/revoke`, { reason }),
  },

  // ── VERIFY (público) ──
  verify: {
    byHash: (hash) => api.get(`/verify/${hash}`),
    verify: (data) => api.post('/verify', data),
  },

  // ── INSTITUTIONS ──
  // 🔴 /me/* — Institution apenas
  // 🔵 /institutions/* — Admin apenas
  institutions: {
    // 🔵 Admin
    list: (params = {}) => api.get('/institutions', { params: normalizePagination(params) }),
    create: (data) => api.post('/institutions', data),
    get: (id) => api.get(`/institutions/${id}`),
    update: (id, data) => api.patch(`/institutions/${id}`, data),
    addCredits: (id, data) => api.post(`/institutions/${id}/credits`, data),
    creditHistoryById: (id, params = {}) => api.get(`/institutions/${id}/credit-history`, { params: normalizePagination(params) }),
    resetPassword: (id) => api.post(`/institutions/${id}/reset-password`),
    regenerateApiKey: (id) => api.post(`/institutions/${id}/regenerate-api-key`),
    // 🔴 Institution (me)
    dashboard: () => api.get('/institutions/me/dashboard'),
    credits: () => api.get('/institutions/me/credits'),
    creditHistory: (params = {}) => api.get('/institutions/me/credit-history', { params: normalizePagination(params) }),
  },

  // ── AUDIT ──
  // 🔵 Admin apenas
  audit: {
    logs: (params = {}) => api.get('/audit/logs', { params: normalizePagination(params) }),
    documentHistory: (docHash) => api.get(`/audit/document/${docHash}/history`),
    stats: (params = {}) => api.get('/audit/stats', { params }),
  },
};

export default api;
