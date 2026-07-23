import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com/api/v1';
const API_ROOT_URL = 'https://txeka-ntiyiso-api.onrender.com';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

console.log('[API Service] URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

const apiRoot = axios.create({
  baseURL: API_ROOT_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function translateError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return { code: 'TIMEOUT', message: 'Servidor demorou a responder. Tente novamente.', type: 'warning' };
    }
    if (error.code === 'ERR_NETWORK') {
      return { code: 'NETWORK', message: 'Sem conexao com a internet. Verifique sua rede.', type: 'error' };
    }
    return { code: 'OFFLINE', message: 'Servidor indisponivel. Verifique a conexao.', type: 'error' };
  }

  const status = error.response.status;
  const detail = error.response.data?.detail || '';

  const map = {
    400: { code: 'BAD_REQUEST', message: detail || 'Dados invalidos. Verifique e tente novamente.', type: 'warning' },
    401: { code: 'UNAUTHORIZED', message: 'Sessao expirada. Faca login novamente.', type: 'error' },
    403: { code: 'FORBIDDEN', message: detail || 'Acesso negado. Sem permissao.', type: 'error' },
    404: { code: 'NOT_FOUND', message: detail || 'Recurso nao encontrado.', type: 'warning' },
    409: { code: 'CONFLICT', message: detail || 'Conflito de dados. Recurso ja existe.', type: 'warning' },
    422: { code: 'VALIDATION', message: detail || 'Dados invalidos. Verifique os campos.', type: 'warning' },
    429: { code: 'RATE_LIMIT', message: 'Muitas requisicoes. Aguarde um momento.', type: 'warning' },
    500: { code: 'SERVER_ERROR', message: 'Erro interno do servidor. Equipe notificada.', type: 'error' },
    502: { code: 'BAD_GATEWAY', message: 'Servidor temporariamente indisponivel. Tente em instantes.', type: 'warning' },
    503: { code: 'SERVICE_DOWN', message: 'Servico em manutencao. Volte em breve.', type: 'warning' },
    504: { code: 'GATEWAY_TIMEOUT', message: 'Servidor demorou a responder. Tente novamente.', type: 'warning' },
  };

  return map[status] || { code: 'UNKNOWN', message: detail || 'Erro inesperado. Tente novamente.', type: 'error' };
}

export async function requestWithRetry(requestFn, retriesLeft) {
  retriesLeft = retriesLeft || MAX_RETRIES;
  try {
    return await requestFn();
  } catch (error) {
    const translated = translateError(error);
    
    if (retriesLeft > 0 && ['TIMEOUT', 'OFFLINE', 'NETWORK', 'BAD_GATEWAY', 'GATEWAY_TIMEOUT', 'SERVICE_DOWN'].includes(translated.code)) {
      console.warn('[API Retry] ' + translated.code + ' — tentativa ' + (MAX_RETRIES - retriesLeft + 1) + '/' + MAX_RETRIES);
      await sleep(RETRY_DELAY * (MAX_RETRIES - retriesLeft + 1));
      return requestWithRetry(requestFn, retriesLeft - 1);
    }

    error.translated = translated;
    throw error;
  }
}

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
    const translated = translateError(error);
    
    if (translated.code === 'UNAUTHORIZED') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('institutionId');
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('institutionData');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    error.translated = translated;
    return Promise.reject(error);
  }
);

apiRoot.interceptors.response.use(
  (response) => response,
  (error) => {
    error.translated = translateError(error);
    return Promise.reject(error);
  }
);

export const verifyDocumentByHash = async (docHash) => {
  if (!docHash || typeof docHash !== 'string') {
    const err = new Error('Hash invalido');
    err.translated = { code: 'VALIDATION', message: 'Hash invalido. Digite um hash SHA-256 valido.', type: 'warning' };
    throw err;
  }
  if (docHash.length !== 64) {
    const err = new Error('Hash deve ter 64 caracteres');
    err.translated = { code: 'VALIDATION', message: 'O hash deve ter exactamente 64 caracteres (SHA-256).', type: 'warning' };
    throw err;
  }
  return requestWithRetry(() => api.get('/verify/' + docHash.toLowerCase()).then(r => r.data));
};

export const verifyDocument = async (docHash) => {
  return requestWithRetry(() => api.post('/verify', { hash: docHash.toLowerCase() }).then(r => r.data));
};

export const emitDocument = async (file, documentType, institutionId) => {
  const formData = new FormData();
  formData.append('file', file);
  const params = new URLSearchParams();
  if (documentType) params.append('document_type', documentType);
  if (institutionId) params.append('institution_id', institutionId);
  const query = params.toString() ? '?' + params.toString() : '';
  return requestWithRetry(() => api.post('/certify' + query, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data));
};

export const getMyDashboard = async () => {
  return requestWithRetry(() => api.get('/institutions/me/dashboard').then(r => r.data));
};

export const getMyCredits = async () => {
  return requestWithRetry(() => api.get('/institutions/me/credits').then(r => r.data));
};

export const getMyCreditHistory = async (skip, limit) => {
  skip = skip || 0;
  limit = limit || 50;
  return requestWithRetry(() => api.get('/institutions/me/credit-history?skip=' + skip + '&limit=' + limit).then(r => r.data));
};

export const getAuditStats = async (institutionId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (institutionId) params.append('institution_id', institutionId);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const query = params.toString() ? '?' + params.toString() : '';
  return requestWithRetry(() => api.get('/audit/stats' + query).then(r => r.data));
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
  const response = await requestWithRetry(() => api.get('/audit/logs' + query).then(r => r.data));
  return response.logs || [];
};

export const listInstitutions = async (skip, limit, status) => {
  skip = skip || 0;
  limit = limit || 100;
  const params = new URLSearchParams();
  params.append('skip', skip);
  params.append('limit', limit);
  if (status) params.append('status', status);
  return requestWithRetry(() => api.get('/institutions?' + params.toString()).then(r => r.data));
};

export const checkApiHealth = async () => {
  try {
    const response = await apiRoot.get('/health', { timeout: 8000 });
    return response.data && response.data.status === 'online';
  } catch (error) {
    console.warn('[checkApiHealth] API indisponivel:', (error.translated && error.translated.code) || error.message);
    return false;
  }
};

export const getApiInfo = async () => {
  try {
    const response = await apiRoot.get('/');
    return response.data;
  } catch (error) {
    console.warn('[getApiInfo] Indisponivel');
    return null;
  }
};

export default api;

