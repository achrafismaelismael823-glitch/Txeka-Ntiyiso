// src/services/api.js
// Enterprise Grade v3.0 — Compatível com Txeka Ntiyiso API v2.0.0

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function translateError(status, data) {
  const codeMap = {
    400: { code: 'VALIDATION', message: data.detail?.[0]?.msg || 'Dados invalidos', type: 'error' },
    401: { code: 'UNAUTHORIZED', message: 'Sessao expirada. Faca login novamente.', type: 'error' },
    403: { code: 'FORBIDDEN', message: 'Sem permissao para esta operacao.', type: 'error' },
    404: { code: 'NOT_FOUND', message: 'Recurso nao encontrado.', type: 'error' },
    409: { code: 'CONFLICT', message: 'Conflito de dados.', type: 'error' },
    422: { code: 'VALIDATION', message: data.detail?.[0]?.msg || 'Dados invalidos', type: 'error' },
    429: { code: 'RATE_LIMIT', message: 'Muitas requisicoes. Aguarde.', type: 'warning' },
    500: { code: 'SERVER_ERROR', message: 'Erro interno do servidor.', type: 'error' },
    503: { code: 'SERVICE_DOWN', message: 'Servico temporariamente indisponivel.', type: 'warning' },
    NETWORK: { code: 'NETWORK', message: 'Sem conexao. Verifique a internet.', type: 'error' },
    TIMEOUT: { code: 'TIMEOUT', message: 'Tempo de resposta excedido.', type: 'warning' },
  };
  return codeMap[status] || { code: 'UNKNOWN', message: data.message || 'Erro inesperado', type: 'error' };
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  // Não setar Content-Type para FormData (browser faz automaticamente)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const translated = translateError(response.status, errorData);
      throw Object.assign(new Error(translated.message), { translated, status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    if (error.translated) throw error;
    const translated = translateError('NETWORK', { message: error.message });
    throw Object.assign(new Error(translated.message), { translated, status: 'NETWORK' });
  }
}

// ==================== AUTH ====================
export async function login(institution_id, password) {
  return apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ institution_id, password }),
  });
}

export async function loginAdmin(email, password) {
  const params = new URLSearchParams({ email, password });
  return apiRequest(`/api/v1/auth/admin/login?${params.toString()}`, {
    method: 'POST',
  });
}

// ==================== VERIFICATION (Pública) ====================
export async function verifyDocumentByHash(doc_hash) {
  return apiRequest(`/api/v1/verify/${encodeURIComponent(doc_hash)}`);
}

export async function verifyDocument(hash) {
  return apiRequest('/api/v1/verify', {
    method: 'POST',
    body: JSON.stringify({ hash }),
  });
}

// ==================== EMISSION ====================
/**
 * Emitir documento
 * POST /api/v1/certify
 * Query: ?document_type=DUAT&institution_id=INAGE
 * Body: multipart/form-data com file (PDF)
 * Response: EmitResponse { status, doc_id, hash_sha256, qr_code, certificate_url, timestamp, message }
 */
export async function emitDocument(file, document_type = 'DUAT', institution_id = null) {
  const formData = new FormData();
  formData.append('file', file);

  const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
  const instId = institution_id || currentUser.id || localStorage.getItem('institutionId');

  const params = new URLSearchParams();
  params.append('document_type', document_type);
  if (instId) params.append('institution_id', instId);

  return apiRequest(`/api/v1/certify?${params.toString()}`, {
    method: 'POST',
    body: formData,
  });
}

// ==================== INSTITUTION DASHBOARD ====================
export async function getMyDashboard() {
  return apiRequest('/api/v1/institutions/me/dashboard');
}

export async function getMyCredits() {
  return apiRequest('/api/v1/institutions/me/credits');
}

export async function getMyCreditHistory(skip = 0, limit = 50) {
  return apiRequest(`/api/v1/institutions/me/credit-history?skip=${skip}&limit=${limit}`);
}

// ==================== ADMIN ====================
/**
 * Estatísticas de auditoria
 * GET /api/v1/audit/stats
 * Schema: NÃO DEFINIDO na Spec → retorna objeto genérico
 * Precisa de fallbacks defensivos no frontend
 */
export async function getAuditStats(institution_id = null, start_date = null, end_date = null) {
  const params = new URLSearchParams();
  if (institution_id) params.append('institution_id', institution_id);
  if (start_date) params.append('start_date', start_date);
  if (end_date) params.append('end_date', end_date);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/v1/audit/stats${query}`);
}

/**
 * Logs de auditoria
 * GET /api/v1/audit/logs
 * Schema: NÃO DEFINIDO na Spec → retorna objeto genérico
 * Parâmetros: action, resource_type, user_email, institution_id, start_date, end_date, limit, offset
 */
export async function getAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.action) params.append('action', filters.action);
  if (filters.resource_type) params.append('resource_type', filters.resource_type);
  if (filters.user_email) params.append('user_email', filters.user_email);
  if (filters.institution_id) params.append('institution_id', filters.institution_id);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  params.append('limit', filters.limit || 100);
  params.append('offset', filters.offset || 0);
  return apiRequest(`/api/v1/audit/logs?${params.toString()}`);
}

export async function listInstitutions(skip = 0, limit = 100, status = null) {
  const params = new URLSearchParams();
  params.append('skip', skip);
  params.append('limit', limit);
  if (status) params.append('status', status);
  return apiRequest(`/api/v1/institutions?${params.toString()}`);
}

export async function createInstitution(data) {
  return apiRequest('/api/v1/institutions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInstitution(institution_id, data) {
  return apiRequest(`/api/v1/institutions/${encodeURIComponent(institution_id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function addCredits(institution_id, data) {
  return apiRequest(`/api/v1/institutions/${encodeURIComponent(institution_id)}/credits`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInstitutionCreditHistory(institution_id, skip = 0, limit = 50) {
  return apiRequest(`/api/v1/institutions/${encodeURIComponent(institution_id)}/credit-history?skip=${skip}&limit=${limit}`);
}

export async function resetInstitutionPassword(institution_id) {
  return apiRequest(`/api/v1/institutions/${encodeURIComponent(institution_id)}/reset-password`, {
    method: 'POST',
  });
}

export async function regenerateApiKey(institution_id) {
  return apiRequest(`/api/v1/institutions/${encodeURIComponent(institution_id)}/regenerate-api-key`, {
    method: 'POST',
  });
}

// ==================== REVOCATION ====================
export async function revokeDocument(doc_id, reason) {
  return apiRequest(`/api/v1/emissions/${encodeURIComponent(doc_id)}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ==================== HEALTH ====================
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getApiInfo() {
  return apiRequest('/');
}

export default {
  login,
  loginAdmin,
  verifyDocumentByHash,
  verifyDocument,
  emitDocument,
  getMyDashboard,
  getMyCredits,
  getMyCreditHistory,
  getAuditStats,
  getAuditLogs,
  listInstitutions,
  createInstitution,
  updateInstitution,
  addCredits,
  getInstitutionCreditHistory,
  resetInstitutionPassword,
  regenerateApiKey,
  revokeDocument,
  checkApiHealth,
  getApiInfo,
};

