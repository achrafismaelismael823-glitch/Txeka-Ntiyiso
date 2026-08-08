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
  // ──────────────────────────────────────────
  // 🔴 INSTITUTION ONLY — /institutions/me/*
  // ──────────────────────────────────────────
  me: {
    dashboard: () => api.get('/institutions/me/dashboard'),
    credits: () => api.get('/institutions/me/credits'),
    creditHistory: (params = {}) => api.get('/institutions/me/credit-history', { params: normalizePagination(params) }),
  },

  // ──────────────────────────────────────────
  // 🟢 BOTH — Institution + Admin
  // ──────────────────────────────────────────
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

  verify: {
    byHash: (hash) => api.get(`/verify/${hash}`),
    verify: (data) => api.post('/verify', data),
  },

  // ──────────────────────────────────────────
  // 🔵 ADMIN ONLY
  // ──────────────────────────────────────────
  auth: {
    adminLogin: (data) => api.post('/auth/admin/login', null, { params: data }),
    institutionLogin: (data) => api.post('/auth/login', data),
  },

  institutions: {
    // List: { total, institutions: [...] }
    list: (params = {}) => api.get('/institutions', { params: normalizePagination(params) }),
    // Create: { id, name, contact_email, credits, subscription_plan }
    create: (data) => api.post('/institutions', data),
    // Get: { id, name, contact_email, role, subscription_plan, credits, docs_emitted_month, status, approved, created_at, updated_at }
    get: (id) => api.get(`/institutions/${id}`),
    // Update: { name, contact_email, status, subscription_plan, approved }
    update: (id, data) => api.patch(`/institutions/${id}`, data),
    // Add Credits: { amount, type, description, payment_method, payment_reference, notes }
    addCredits: (id, data) => api.post(`/institutions/${id}/credits`, data),
    // Credit History: [ { id, institution_id, amount, type, description, payment_method, payment_reference, notes, created_by, created_at } ]
    creditHistoryById: (id, params = {}) => api.get(`/institutions/${id}/credit-history`, { params: normalizePagination(params) }),
    // Reset Password: {} (empty response)
    resetPassword: (id) => api.post(`/institutions/${id}/reset-password`),
    // Regenerate API Key: {} (empty response)
    regenerateApiKey: (id) => api.post(`/institutions/${id}/regenerate-api-key`),
  },

  audit: {
    // Logs: { success, count, limit, offset, logs: [...] }
    logs: (params = {}) => api.get('/audit/logs', { params: normalizePagination(params) }),
    // Document History: { success, doc_hash, total_actions, history: [...] }
    documentHistory: (docHash) => api.get(`/audit/document/${docHash}/history`),
    // Stats: { success, period, stats: {...} }
    stats: (params = {}) => api.get('/audit/stats', { params }),
  },
};

export default api;
