import axios from 'axios';

// ============================================
// INSTÂNCIA AXIOS BASE
// ============================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor: adiciona token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('txeka_token') || sessionStorage.getItem('txeka_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: trata erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('txeka_token');
      sessionStorage.removeItem('txeka_token');
      localStorage.removeItem('txeka_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// ENDPOINTS ORGANIZADOS
// ============================================

export const endpoints = {
  auth: {
    login: (data) => api.post('/api/v1/auth/login', data),
    adminLogin: (params) => api.post('/api/v1/auth/admin/login', null, { params }),
  },
  
  emission: {
    certify: (data) => api.post('/api/v1/certify', data),
    bulk: (data) => api.post('/api/v1/certify/bulk', data),
    revoke: (docId, data) => api.post(`/api/v1/emissions/${docId}/revoke`, data),
  },
  
  verification: {
    get: (docHash) => api.get(`/api/v1/verify/${docHash}`),
    post: (data) => api.post('/api/v1/verify', data),
  },
  
  audit: {
    logs: (params) => api.get('/api/v1/audit/logs', { params }),
    documentHistory: (docHash) => api.get(`/api/v1/audit/document/${docHash}/history`),
    stats: () => api.get('/api/v1/audit/stats'),
  },
  
  institutions: {
    list: () => api.get('/api/v1/institutions'),
    get: (id) => api.get(`/api/v1/institutions/${id}`),
    create: (data) => api.post('/api/v1/institutions', data),
    update: (id, data) => api.patch(`/api/v1/institutions/${id}`, data),
    addCredits: (id, data) => api.post(`/api/v1/institutions/${id}/credits`, data),
    creditHistory: (id) => api.get(`/api/v1/institutions/${id}/credit-history`),
    resetPassword: (id, data) => api.post(`/api/v1/institutions/${id}/reset-password`, data),
    regenerateApiKey: (id) => api.post(`/api/v1/institutions/${id}/regenerate-api-key`),
    me: {
      dashboard: () => api.get('/api/v1/institutions/me/dashboard'),
      credits: () => api.get('/api/v1/institutions/me/credits'),
      creditHistory: () => api.get('/api/v1/institutions/me/credit-history'),
    },
  },
  
  health: () => api.get('/health'),
};

export default api;
