import axios from 'axios';

// ═══════════════════════════════════════════════════════════════
// API Service — Txeka Ntiyiso
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';
// URL raiz da API (sem /api/v1) — usada para health check
const API_ROOT_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

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
  // Health check usa a raiz da API, fora do prefixo /api/v1
  health: {
    check: () => axios.get(`${API_ROOT_URL}/health`, { timeout: 10000 }),
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
    // NOTA: Não há endpoints GET /emissions nem GET /emissions/{id} no backend.
    // A listagem de documentos é feita via /audit/logs (admin) ou
    // /institutions/me/dashboard (instituição — retorna total_emitted).
  },

  verify: {
    hash: (docHash) => api.get(`/verify/${docHash}`),
    post: (data) => api.post('/verify', data),
  },

  audit: {
    // Backend /audit/logs usa offset/limit (não skip)
    logs: (params = {}) => api.get('/audit/logs', { params }),
    documentHistory: (docHash) => api.get(`/audit/document/${docHash}/history`),
    stats: (params = {}) => api.get('/audit/stats', { params }),
  },

  institutions: {
    list: (params = {}) => api.get('/institutions', { params: normalizePagination(params) }),
    create: (data) => api.post('/institutions', data),
    get: (id) => api.get(`/institutions/${id}`),
    update: (id, data) => api.patch(`/institutions/${id}`, data),
    addCredits: (id, data) => api.post(`/institutions/${id}/credits`, data),
    creditHistory: (id, params = {}) => api.get(`/institutions/${id}/credit-history`, { params: normalizePagination(params) }),
    resetPassword: (id) => api.post(`/institutions/${id}/reset-password`),
    regenerateApiKey: (id) => api.post(`/institutions/${id}/regenerate-api-key`),
  },

  auth: {
    // Instituição: JSON body (institution_id + password)
    login: (credentials) => api.post('/auth/login', credentials),
    // Admin: JSON body (email + password) --- V3 compativel
    adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  },
};

export default api;
