// src/services/api.js
// v4.1 — API Txeka Ntiyiso mapeada 1:1 com o contrato OpenAPI 3.1.0
// Build-safe: sem optional chaining, sem nullish coalescing.
// Acentuacao corrigida para portugues (pt-PT).
// CORRECAO CRITICA: emitDocument agora monta FormData automaticamente.
// CORRECAO CRITICA: interceptor de request nao sobrescreve Content-Type de FormData.

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const DEBUG = process.env.REACT_APP_DEBUG === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar token e preservar Content-Type de FormData
api.interceptors.request.use(function(config) {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }

  // CRITICO: se o body for FormData, remover Content-Type para o browser
  // definir o boundary correto do multipart/form-data.
  if (config.data && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  // Nao sobrescrever Content-Type se ja foi definido manualmente (ex: blob, file)
  if (config.headers['Content-Type'] === false) {
    delete config.headers['Content-Type'];
  }

  if (DEBUG) {
    console.log('[API Request]', config.method.toUpperCase(), config.url, config.params || '', config.data instanceof FormData ? '<FormData>' : config.data);
  }

  return config;
}, function(error) {
  return Promise.reject(error);
});

// Interceptor de resposta para normalizar erros e preservar informacao de debug
api.interceptors.response.use(
  function(response) {
    if (DEBUG) {
      console.log('[API Response]', response.config.url, response.status, response.data);
    }
    return response;
  },
  function(error) {
    var message = 'Erro na comunicacao com o servidor.';
    var status = 500;
    var rawResponse = null;

    if (error.response) {
      status = error.response.status;
      rawResponse = error.response.data;
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

    if (DEBUG) {
      console.error('[API Error]', error.config && error.config.url, status, rawResponse);
    }

    var customError = new Error(message);
    customError.status = status;
    customError.userMessage = message;
    customError.rawResponse = rawResponse;
    customError.isApiError = true;
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

export async function regenerateApiKey(institution_id) {
  return api.post('/api/v1/institutions/' + institution_id + '/regenerate-api-key');
}

// ============================================
// DOCUMENTOS / CERTIFICACAO
// ============================================

/**
 * Emite um documento individual (PDF).
 * O Swagger exige multipart/form-data com:
 *   - file: File (PDF)
 *   - document_type: string (query param, opcional, default "DUAT")
 *   - institution_id: string (query param, opcional)
 *
 * @param {Object} payload
 * @param {File} payload.file — ficheiro PDF
 * @param {string} [payload.document_type="DUAT"] — tipo de documento
 * @param {string} [payload.institution_id] — ID da instituicao (se nao for a logada)
 */
export async function emitDocument(payload) {
  var formData = new FormData();
  formData.append('file', payload.file);

  var query = {};
  if (payload.document_type) query.document_type = payload.document_type;
  if (payload.institution_id) query.institution_id = payload.institution_id;

  return api.post('/api/v1/certify', formData, {
    params: query,
    headers: { 'Content-Type': false }, // forca remocao do default json
  });
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
  if (params && params.offset !== undefined) query.offset = params.offset;
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

// Interceptor de debug para publicApi tambem
publicApi.interceptors.request.use(function(config) {
  if (DEBUG) {
    console.log('[PublicAPI Request]', config.method.toUpperCase(), config.url);
  }
  return config;
});

publicApi.interceptors.response.use(
  function(response) {
    if (DEBUG) {
      console.log('[PublicAPI Response]', response.config.url, response.status);
    }
    return response;
  },
  function(error) {
    if (DEBUG) {
      console.error('[PublicAPI Error]', error.config && error.config.url, error.response && error.response.status);
    }
    return Promise.reject(error);
  }
);

// ============================================
// ALIASES DE COMPATIBILIDADE
// ============================================

export { getMyCreditHistory as getCreditHistory };
export { verifyDocumentByHash as verifyByHash };
export { verifyDocument as verifyByPost };
export { resetInstitutionPassword as resetPassword };

export default api;
