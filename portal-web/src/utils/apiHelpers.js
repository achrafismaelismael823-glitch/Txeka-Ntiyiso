/**
 * Parseia o campo `details` dos logs de auditoria (vem como string JSON).
 */
export const parseLogDetails = (log) => {
  if (!log?.details) return {};
  try {
    return typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
  } catch {
    return {};
  }
};

/**
 * Extrai o doc_id de um log de emissão (está dentro de details).
 */
export const getDocIdFromLog = (log) => {
  const details = parseLogDetails(log);
  return details.doc_id || log.doc_id || log.id;
};

/**
 * Extrai o hash de um log (resource_id é o hash SHA-256).
 */
export const getHashFromLog = (log) => {
  return log.resource_id || log.hash_sha256 || log.doc_hash || log.hash || '';
};

/**
 * Extrai o tipo de documento de um log.
 */
export const getDocTypeFromLog = (log) => {
  const details = parseLogDetails(log);
  return details.document_type || log.document_type || 'Documento';
};

/**
 * Extrai o nome do ficheiro de um log.
 */
export const getFileNameFromLog = (log) => {
  const details = parseLogDetails(log);
  return details.file_name || log.file_name || '';
};

/**
 * Formata o status de verificação (VALID, INVALID, REVOKED).
 */
export const formatVerificationStatus = (status) => {
  const map = {
    VALID: { label: 'Válido', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    INVALID: { label: 'Inválido', color: 'text-red-400', bg: 'bg-red-500/10' },
    REVOKED: { label: 'Revogado', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  };
  return map[status] || { label: status || '—', color: 'text-slate-400', bg: 'bg-white/[0.03]' };
};

/**
 * Normaliza a resposta de logs da API (pode vir como array ou objeto com .logs).
 */
export const normalizeLogsResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.logs && Array.isArray(data.logs)) return data.logs;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.history && Array.isArray(data.history)) return data.history;
  return [];
};

/**
 * Normaliza a resposta de créditos da API.
 */
export const normalizeCreditsResponse = (data) => {
  if (data?.credits !== undefined) return data.credits;
  if (data?.balance !== undefined) return data.balance;
  if (data?.amount !== undefined) return data.amount;
  return data || 0;
};

/**
 * Extrai o nome da instituição de um log (para auditoria).
 */
export const getInstitutionNameFromLog = (log) => {
  const details = parseLogDetails(log);
  return details.institution_name || log.institution_name || log.institution || '—';
};

/**
 * Formata o tipo de ação de auditoria para exibição.
 */
export const formatAuditActionType = (action) => {
  const map = {
    CREATE: 'Criação',
    UPDATE: 'Atualização',
    VERIFY: 'Verificação',
    REVOKE: 'Revogação',
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    EMIT: 'Emissão',
    BULK_EMIT: 'Emissão Massiva',
    CREDIT_ADD: 'Adição de Créditos',
    CREDIT_REMOVE: 'Remoção de Créditos',
  };
  return map[action] || action || '—';
};

export default {
  parseLogDetails,
  getDocIdFromLog,
  getHashFromLog,
  getDocTypeFromLog,
  getFileNameFromLog,
  formatVerificationStatus,
  normalizeLogsResponse,
  normalizeCreditsResponse,
  getInstitutionNameFromLog,
  formatAuditActionType,
};

