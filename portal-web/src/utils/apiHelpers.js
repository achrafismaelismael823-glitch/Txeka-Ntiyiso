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
 * Normaliza a resposta de stats da API.
 */
export const normalizeStats = (data) => {
  if (!data?.stats?.summary) {
    return {
      total_emitted_documents: 0,
      total_revoked_documents: 0,
      active_documents: 0,
      total_verifications: 0,
      verification_success_rate: 0,
      recent_logs_7d: 0,
    };
  }
  return data.stats.summary;
};

