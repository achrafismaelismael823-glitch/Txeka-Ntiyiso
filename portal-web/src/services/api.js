import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  const hostname = window.location.hostname;

  if (hostname === 'txeka-ntiyiso.co.mz' || hostname === 'www.txeka-ntiyiso.co.mz') {
    return 'https://api.txeka-ntiyiso.co.mz/api/v1';
  }
  if (hostname.includes('staging')) {
    return 'https://api-staging.txeka-ntiyiso.co.mz/api/v1';
  }
  return '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('txeka_token');
      localStorage.removeItem('token');
      localStorage.removeItem('txeka_institution');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    if (error.response?.status === 429) {
      return Promise.reject(new Error('Muitas requisições. Aguarde um momento.'));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Tempo de conexão esgotado. Verifique sua internet.'));
    }
    return Promise.reject(error);
  }
);

const normalizePagination = (params = {}) => {
  const clean = { ...params };
  if (clean.offset !== undefined) {
    clean.skip = clean.offset;
    delete clean.offset;
  }
  return clean;
};

export const endpoints = {
  health: {
    check: () => api.get('/health'),
  },

  me: {
    dashboard: () => api.get('/institutions/me/dashboard'),
    credits: () => api.get('/institutions/me/credits'),
    creditHistory: (params = {}) => api.get('/institutions/me/credit-history', { params: normalizePagination(params) }),
  },

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
  },

  verify: {
    hash: (docHash) => api.get(`/verify/${docHash}`),
    post: (data) => api.post('/verify', data),
    qr: (code) => api.get(`/verify/qr/${code}`),
  },

  audit: {
    logs: (params = {}) => api.get('/audit/logs', { params: normalizePagination(params) }),
    documentHistory: (docHash) => api.get(`/audit/document/${docHash}/history`),
    stats: () => api.get('/audit/stats'),
  },

  institutions: {
    list: (params = {}) => api.get('/institutions', { params: normalizePagination(params) }),
    create: (data) => api.post('/institutions', data),
    get: (id) => api.get(`/institutions/${id}`),
    update: (id, data) => api.patch(`/institutions/${id}`, data),
    addCredits: (id, amount) => api.post(`/institutions/${id}/credits`, { amount }),
    creditHistory: (id, params = {}) => api.get(`/institutions/${id}/credit-history`, { params: normalizePagination(params) }),
    resetPassword: (id) => api.post(`/institutions/${id}/reset-password`),
    regenerateApiKey: (id) => api.post(`/institutions/${id}/regenerate-api-key`),
  },

  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
    logout: () => api.post('/logout'),
    refresh: () => api.post('/refresh'),
    me: () => api.get('/auth/me'),
  },
};

export default api;
