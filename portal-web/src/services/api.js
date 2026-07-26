import axios from 'axios';
import { authService } from './auth';

// CRA usa process.env, não import.meta.env
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Interceptor de requisição: injeta token
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta: tratamento global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      authService.logout();
      window.location.href = '/login?expired=1';
    }

    // Normaliza mensagem de erro conforme schema da API
    let message = 'Erro de comunicação com o servidor';
    if (typeof data?.detail === 'string') message = data.detail;
    else if (Array.isArray(data?.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
    else if (data?.message) message = data.message;
    else if (error.message) message = error.message;

    error.normalizedMessage = message;
    return Promise.reject(error);
  }
);

export const endpoints = {
  auth: {
    // Admin login usa query params (conforme Swagger/curl)
    adminLogin: (email, password) => api.post(`/api/v1/auth/admin/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),
    // Institution login usa body JSON
    login: (data) => api.post('/api/v1/auth/login', data),
    refresh: () => api.post('/api/v1/auth/refresh'),
  },
  audit: {
    logs: (params) => api.get('/api/v1/audit/logs', { params }),
    stats: (params) => api.get('/api/v1/audit/stats', { params }),
    documentHistory: (docHash) => api.get(`/api/v1/audit/document/${docHash}/history`),
  },
  institutions: {
    list: (params) => api.get('/api/v1/institutions', { params }),
    get: (id) => api.get(`/api/v1/institutions/${id}`),
    create: (data) => api.post('/api/v1/institutions', data),
    update: (id, data) => api.patch(`/api/v1/institutions/${id}`, data),
    resetPassword: (id) => api.post(`/api/v1/institutions/${id}/reset-password`),
    regenerateApiKey: (id) => api.post(`/api/v1/institutions/${id}/regenerate-api-key`),
    credits: () => api.get('/api/v1/institutions/me/credits'),
    creditHistory: (params) => api.get('/api/v1/institutions/me/credit-history', { params }),
    addCredits: (id, data) => api.post(`/api/v1/institutions/${id}/credits`, data),
  },
  certify: {
    // Emissão única com multipart/form-data
    single: (formData) => api.post('/api/v1/certify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    // Emissão massiva (JSON)
    bulk: (data) => api.post('/api/v1/certify/bulk', data),
  },
  verify: {
    // Verificação pública (sem auth)
    public: (hash) => api.get(`/api/v1/verify/${hash}`),
    // Verificação B2B (com auth)
    b2b: (hash) => api.post('/api/v1/verify', { hash }),
  },
  emissions: {
    // Revogação: path param é doc_id
    revoke: (docId, data) => api.post(`/api/v1/emissions/${docId}/revoke`, data),
  },
};
