import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
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
      Cookies.remove('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const endpoints = {
  auth: {
    login: (data) => api.post('/api/v1/auth/login', data),
    adminLogin: (params) => api.post('/api/v1/auth/admin/login', null, { params }),
  },
  certify: {
    emit: (formData, query) => api.post('/api/v1/certify', formData, { 
      params: query,
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    bulk: (data) => api.post('/api/v1/certify/bulk', data),
  },
  verify: {
    get: (docHash) => api.get(`/api/v1/verify/${docHash}`),
    post: (data) => api.post('/api/v1/verify', data),
  },
  emissions: {
    revoke: (docId, data) => api.post(`/api/v1/emissions/${docId}/revoke`, data),
  },
  audit: {
    logs: (params) => api.get('/api/v1/audit/logs', { params }),
    history: (docHash) => api.get(`/api/v1/audit/document/${docHash}/history`),
    stats: (params) => api.get('/api/v1/audit/stats', { params }),
  },
  institutions: {
    list: (params) => api.get('/api/v1/institutions', { params }),
    get: (id) => api.get(`/api/v1/institutions/${id}`),
    create: (data) => api.post('/api/v1/institutions', data),
    update: (id, data) => api.patch(`/api/v1/institutions/${id}`, data),
    addCredits: (id, data) => api.post(`/api/v1/institutions/${id}/credits`, data),
    creditHistory: (id, params) => api.get(`/api/v1/institutions/${id}/credit-history`, { params }),
    resetPassword: (id) => api.post(`/api/v1/institutions/${id}/reset-password`),
    regenerateApiKey: (id) => api.post(`/api/v1/institutions/${id}/regenerate-api-key`),
    me: {
      dashboard: () => api.get('/api/v1/institutions/me/dashboard'),
      credits: () => api.get('/api/v1/institutions/me/credits'),
      creditHistory: (params) => api.get('/api/v1/institutions/me/credit-history', { params }),
    },
  },
  health: () => api.get('/health'),
};
