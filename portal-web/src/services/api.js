// v3.0 — API Txeka Ntiyiso mapeada 1:1 com o contrato Swagger.

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar token
api.interceptors.request.use(function(config) {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
}, function(error) {
  return Promise.reject(error);
});

// Interceptor de resposta para normalizar erros
api.interceptors.response.use(
  function(response) {
    return response;
  },
  function(error) {
    var message = 'Erro na comunicacao com o servidor.';
    var status = 500;
    if (error.response) {
      status = error.response.status;
      var data = error.response.data;
      if (data && data.detail) {
        if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          var detail = data.detail && data.detail[0] && data.detail[0].msg;
          message = detail || JSON.stringify(data.detail);
        } else {
          message = JSON.stringify(data.detail);
        }
      } else if (data && data.message) {
        message = data.message;
      }
    } else if (error.request) {
      message = 'Sem resposta do servidor. Verifique a conexao.';
    }
    var customError = new Error(message);
    customError.status = status;
    customError.userMessage = message;
    return Promise.reject(customError);
  }
);

// ============================================
// AUTENTICACAO
// ============================================

export async function loginInstitution(institution_id, password) {
  return api.post('/api/v1/auth/login', { institution_id, password });
}

export async function loginAdmin(email, password) {
  return api.post('/api/v1/auth/admin/login', null, { params: { email, password } });
}

// ============================================
// INSTITUICAO (ME)
// ============================================

export async function getMyDashboard() {
  return api.get('/api/v1/institutions/me/dashboard');
}

export async function getMyCredits() {
  return api.get('/api/v1/institutions/me/credits');
}

export async function getMyCreditHistory(params) {
  var query = {};
  if (params && params.skip !== undefined) query.skip = params.skip;
  if (params && params.limit !== undefined) query.limit = params.limit;
  return api.get('/api/v1/institutions/me/credit-history', { params: query });
}

// ============================================
// INSTITUICOES (ADMIN)
// ============================================

export async function listInstitutions(params) {
  var query = {};
  if (params && params.skip !== undefined) query.skip = params.skip;
  if (params && params.limit !== undefined) query.limit = params.limit;
  if (params && params.search) query.search = params.search;
  if (params && params.status) query.status = params.status;
  return api.get('/api/v1/institutions', { params: query });
}

export async function createInstitution(data) {
  return api.post('/api/v1/institutions', data);
}

export async function getInstitution(id) {
  return api.get('/api/v1/institutions/' + id);
}

export async function updateInstitution(id, data) {
  return api.patch('/api/v1/institutions/' + id, data);
}

export async function addCredits(institution_id, data) {
  return api.post('/api/v1/institutions/' + institution_id + '/credits', data);
}

export async function getInstitutionCreditHistory(institution_id, params) {
  var query = {};
  if (params && params.skip !== undefined) query.skip = params.skip;
  if (params && params.limit !== undefined) query.limit = params.limit;
  return api.get('/api/v1/institutions/' + institution_id + '/credit-history', { params: query });
}

export async function resetInstitutionPassword(institution_id) {
  return api.post('/api/v1/institutions/' + institution_id + '/reset-password');
}

// Alias para compatibilidade com imports existentes
export async function resetPassword(institution_id) {
  return resetInstitutionPassword(institution_id);
}

export async function regenerateApiKey(institution_id) {
  return api.post('/api/v1/institutions/' + institution_id + '/regenerate-api-key');
}

// ============================================
// DOCUMENTOS / CERTIFICACAO
// ============================================

export async function emitDocument(data) {
  return api.post('/api/v1/certify', data);
}

export async function emitBulk(data) {
  return api.post('/api/v1/certify/bulk', data);
}

export async function verifyDocument(data) {
  return api.post('/api/v1/verify', data);
}

export async function verifyDocumentByHash(hash) {
  return api.get('/api/v1/verify/' + hash);
}

export async function revokeDocument(doc_id, data) {
  return api.post('/api/v1/emissions/' + doc_id + '/revoke', data);
}

// ============================================
// AUDITORIA
// ============================================

export async function getAuditLogs(params) {
  var query = {};
  if (params && params.limit !== undefined) query.limit = params.limit;
  if (params && params.skip !== undefined) query.skip = params.skip;
  if (params && params.action) query.action = params.action;
  if (params && params.resource_type) query.resource_type = params.resource_type;
  if (params && params.institution_id) query.institution_id = params.institution_id;
  if (params && params.user_email) query.user_email = params.user_email;
  if (params && params.start_date) query.start_date = params.start_date;
  if (params && params.end_date) query.end_date = params.end_date;
  return api.get('/api/v1/audit/logs', { params: query });
}

export async function getDocumentAuditHistory(doc_hash) {
  return api.get('/api/v1/audit/document/' + doc_hash + '/history');
}

export async function getAuditStats(params) {
  var query = {};
  if (params && params.start_date) query.start_date = params.start_date;
  if (params && params.end_date) query.end_date = params.end_date;
  if (params && params.institution_id) query.institution_id = params.institution_id;
  return api.get('/api/v1/audit/stats', { params: query });
}

// ============================================
// HEALTH / INFO
// ============================================

export async function checkApiHealth() {
  return api.get('/health');
}

export async function getApiInfo() {
  return api.get('/');
}

// ============================================
// PUBLIC API (sem auth)
// ============================================

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default api;

