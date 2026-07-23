import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com/api/v1';
const API_ROOT_URL = 'https://txeka-ntiyiso-api.onrender.com';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;

console.log('[API Service] URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

const apiRoot = axios.create({
  baseURL: API_ROOT_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = 'Bearer ' + token;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('institutionId');
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('institutionData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const verifyDocumentByHash = async (docHash) => {
  if (!docHash || typeof docHash !== 'string') throw new Error('Hash invalido');
  if (docHash.length !== 64) throw new Error('Hash deve ter 64 caracteres (SHA-256)');
  const response = await api.get('/verify/' + docHash.toLowerCase());
  return response.data;
};

export const verifyDocument = async (docHash) => {
  const response = await api.post('/verify', { hash: docHash.toLowerCase() });
  return response.data;
};

export const emitDocument = async (file, documentType, institutionId) => {
  const formData = new FormData();
  formData.append('file', file);
  const params = new URLSearchParams();
  if (documentType) params.append('document_type', documentType);
  if (institutionId) params.append('institution_id', institutionId);
  const query = params.toString() ? '?' + params.toString() : '';
  const response = await api.post('/certify' + query, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getMyDashboard = async () => {
  const response = await api.get('/institutions/me/dashboard');
  return response.data;
};

export const getMyCredits = async () => {
  const response = await api.get('/institutions/me/credits');
  return response.data;
};

export const getMyCreditHistory = async (skip, limit) => {
  skip = skip || 0;
  limit = limit || 50;
  const response = await api.get('/institutions/me/credit-history?skip=' + skip + '&limit=' + limit);
  return response.data;
};

export const getAuditStats = async (institutionId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (institutionId) params.append('institution_id', institutionId);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const query = params.toString() ? '?' + params.toString() : '';
  const response = await api.get('/audit/stats' + query);
  return response.data;
};

export const getAuditLogs = async (filters) => {
  filters = filters || {};
  const params = new URLSearchParams();
  if (filters.action) params.append('action', filters.action);
  if (filters.institution_id) params.append('institution_id', filters.institution_id);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  const query = params.toString() ? '?' + params.toString() : '';
  const response = await api.get('/audit/logs' + query);
  return response.data;
};

export const listInstitutions = async (skip, limit, status) => {
  skip = skip || 0;
  limit = limit || 100;
  const params = new URLSearchParams();
  params.append('skip', skip);
  params.append('limit', limit);
  if (status) params.append('status', status);
  const response = await api.get('/institutions?' + params.toString());
  return response.data;
};

export const checkApiHealth = async () => {
  try {
    const response = await apiRoot.get('/health', { timeout: 5000 });
    return response.data && response.data.status === 'online';
  } catch (error) {
    return false;
  }
};

export const getApiInfo = async () => {
  try {
    const response = await apiRoot.get('/');
    return response.data;
  } catch (error) {
    return null;
  }
};

export default api;

