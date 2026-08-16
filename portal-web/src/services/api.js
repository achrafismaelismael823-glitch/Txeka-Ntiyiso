import axios from 'axios';

// ============================================
// 🌐 CONFIGURAÇÃO DE DOMÍNIOS
// ============================================
// Desenvolvimento:  localhost ou Render
// Staging:          staging.txeka-ntiyiso.co.mz
// Produção:         txeka-ntiyiso.co.mz
// API:              api.txeka-ntiyiso.co.mz
// ============================================
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  
  const hostname = window.location.hostname;
  
  // Produção
  if (hostname === 'txeka-ntiyiso.co.mz' || hostname === 'www.txeka-ntiyiso.co.mz') {
    return 'https://api.txeka-ntiyiso.co.mz/api/v1';
  }
  
  // Staging
  if (hostname.includes('staging')) {
    return 'https://api-staging.txeka-ntiyiso.co.mz/api/v1';
  }
  
  // Fallback para Render (atual)
  return 'https://txekantiyiso-api.onrender.com/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30000,
});

// Request interceptor — adiciona token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('txeka_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — trata 401 e erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('txeka_token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Tempo de conexão esgotado. Verifique sua internet.'));
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
    list: (params = {}) => api.get('/emissions', { params: normalizePagination(params) }),
    get: (id) => api.get(`/emissions/${id}`),
    verify: (hash) => api.get(`/verify/${hash}`),
  },

  documents: {
    list: (params = {}) => api.get('/documents', { params: normalizePagination(params) }),
    get: (id) => api.get(`/documents/${id}`),
    revoke: (id, reason) => api.post(`/documents/${id}/revoke`, { reason }),
  },

  audit: {
    list: (params = {}) => api.get('/audit', { params: normalizePagination(params) }),
    get: (id) => api.get(`/audit/${id}`),
  },

  verify: {
    hash: (hash) => api.get(`/verify/${hash}`),
    qr: (code) => api.get(`/verify/qr/${code}`),
  },

  // ──────────────────────────────────────────
  // 🔵 ADMIN ONLY
  // ──────────────────────────────────────────
  admin: {
    dashboard: () => api.get('/admin/dashboard'),
    institutions: {
      list: (params = {}) => api.get('/admin/institutions', { params: normalizePagination(params) }),
      create: (data) => api.post('/admin/institutions', data),
      update: (id, data) => api.put(`/admin/institutions/${id}`, data),
      delete: (id) => api.delete(`/admin/institutions/${id}`),
      get: (id) => api.get(`/admin/institutions/${id}`),
    },
    credits: {
      add: (institutionId, amount) => api.post(`/admin/credits/${institutionId}`, { amount }),
      history: (params = {}) => api.get('/admin/credits/history', { params: normalizePagination(params) }),
    },
    settings: () => api.get('/admin/settings'),
    updateSettings: (data) => api.put('/admin/settings', data),
  },

  // ──────────────────────────────────────────
  // 🔐 AUTH
  // ──────────────────────────────────────────
  auth: {
    institutionLogin: (credentials) => api.post('/auth/institution/login', credentials),
    adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
    logout: () => api.post('/auth/logout'),
    refresh: () => api.post('/auth/refresh'),
    me: () => api.get('/auth/me'),
  },
};

export default api;

