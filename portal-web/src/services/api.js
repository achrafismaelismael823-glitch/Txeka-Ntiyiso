import axios from 'axios';
import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.txekantiyiso.co.mz';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 401) {
      authService.logout();
      window.location.href = '/login?expired=1';
    }

    let message = 'Erro de comunicação com o servidor';
    if (typeof detail === 'string') message = detail;
    else if (Array.isArray(detail) && detail[0]?.msg) message = detail[0].msg;
    else if (error.message) message = error.message;

    error.normalizedMessage = message;
    return Promise.reject(error);
  }
);

export const endpoints = {
  auth: {
    login: (data) => api.post('/api/v1/auth/login', data),
    adminLogin: (data) => api.post('/api/v1/auth/admin/login', data),
    refresh: () => api.post('/api/v1/auth/refresh'),
  },
  audit: {
    logs: (params) => api.get('/api/v1/audit/logs', { params }),
    stats: () => api.get('/api/v1/audit/stats'),
    documentHistory: (docHash) => api.get(`/api/v1/audit/document/${docHash}/history`),
  },
  institutions: {
    list: (params) => api.get('/api/v1/institutions', { params }),
    create: (data) => api.post('/api/v1/institutions', data),
    update: (id, data) => api.patch(`/api/v1/institutions/${id}`, data),
    resetPassword: (id) => api.post(`/api/v1/institutions/${id}/reset-password`),
    regenerateApiKey: (id) => api.post(`/api/v1/institutions/${id}/regenerate-api-key`),
    credits: () => api.get('/api/v1/institutions/me/credits'),
    creditHistory: (params) => api.get('/api/v1/institutions/me/credit-history', { params }),
    addCredits: (id, data) => api.post(`/api/v1/institutions/${id}/credits`, data),
  },
  certify: {
    single: (formData) => api.post('/api/v1/certify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    bulk: (data) => api.post('/api/v1/certify/bulk', data),
  },
  verify: {
    public: (hash) => api.get(`/api/v1/verify/${hash}`),
    b2b: (hash) => api.post('/api/v1/verify', { hash }),
  },
  emissions: {
    revoke: (docId, data) => api.post(`/api/v1/emissions/${docId}/revoke`, data),
  },
};
