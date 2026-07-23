import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com/api/v1';
const API_ROOT_URL = 'https://txeka-ntiyiso-api.onrender.com';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;

console.log(`[API Service] Inicializando com URL: ${API_BASE_URL}`);

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('institutionId');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('institutionData');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    } else if (error.request) {
      return Promise.reject({ message: 'Sem resposta do servidor. Verifique a conexão.', networkError: true });
    } else {
      return Promise.reject({ message: 'Erro ao processar requisição.' });
    }
  }
);

export const verifyDocumentByHash = async (docHash) => {
  try {
    if (!docHash || typeof docHash !== 'string') throw new Error('Hash inválido');
    if (docHash.length !== 64) throw new Error('Hash deve ter exactamente 64 caracteres (SHA-256)');
    const response = await api.get(`/verify/${docHash.toLowerCase()}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Erro ao verificar documento';
    console.error('[verifyDocumentByHash]', message);
    throw new Error(message);
  }
};

export const verifyDocument = async (docHash) => {
  try {
    const response = await api.post('/verify', { hash: docHash.toLowerCase() });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Erro ao verificar documento';
    console.error('[verifyDocument]', message);
    throw new Error(message);
  }
};

export const emitDocument = async (file, documentType = 'DUAT', institutionId = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams();
    if (documentType) params.append('document_type', documentType);
    if (institutionId) params.append('institution_id', institutionId);
    const response = await api.post(`/certify?${params.toString()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Erro ao emitir documento';
    console.error('[emitDocument]', message);
    throw new Error(message);
  }
};

export const getMyDashboard = async () => {
  try {
    const response = await api.get('/institutions/me/dashboard');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Erro ao carregar dashboard';
    console.error('[getMyDashboard]', message);
    throw new Error(message);
  }
};

export const getMyCredits = async () => {
  try {
    const response = await api.get('/institutions/me/credits');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Erro ao carregar créditos';
    console.error('[getMyCredits]', message);
    throw new Error(message);
  }
};

export const getMyCreditHistory = async (skip = 0, limit = 50) => {
  try {
    const response = await api.get(`/institutions/me/credit-history?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Erro ao carregar histórico';
    console.error('[getMyCreditHistory]', message);
    throw new Error(message);
  }
};

export const getAuditStats = async (institutionId = null, startDate = null, endDate = null) => {
  try {
    const params = new URLSearchParams();
    if (institutionId) params.append('institution_id', institutionId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/audit/stats${query}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Erro ao carregar estatísticas';
    console.error('[getAuditStats]', message);
    throw new Error(message);
  }
};

export const getAuditLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.institution_id) params.append('institution_id', filters.institution_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/audit/logs${query}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Erro ao carregar logs';
    console.error('[getAuditLogs]', message);
    throw new Error(message);
  }
};

export const listInstitutions = async (skip = 0, limit = 100, status = null) => {
  try {
    const params = new URLSearchParams();
    params.append('skip', skip);
    params.append('limit', limit);
    if (status) params.append('status', status);
    const response = await api.get(`/institutions?${params.toString()}`);
n    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'Erro ao listar instituições';
    console.error('[listInstitutions]', message);
    throw new Error(message);
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await apiRoot.get('/health', { timeout: 5000 });
    return response.data?.status === 'online';
  } catch (error) {
    console.warn('[checkApiHealth] API indisponível');
    return false;
  }
};

export const getApiInfo = async () => {
  try {
    const response = await apiRoot.get('/');
    return response.data;
  } catch (error) {
    console.warn('[getApiInfo] Não foi possível obter info');
    return null;
  }
};

export default api;

