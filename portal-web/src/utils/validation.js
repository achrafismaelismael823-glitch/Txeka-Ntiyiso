// src/utils/validation.js
/**
 * Validation Utilities - DocVerify MZ
 * 
 * Funções de validação para hashes, ficheiros e inputs de utilizador.
 * Implementa algoritmo SHA-256 no navegador para máxima segurança.
 */

/**
 * Valida se uma string é um hash SHA-256 válido
 * @param {string} hash - String a validar
 * @returns {boolean} True se válido
 */
export const validateSHA256Hash = (hash) => {
  if (!hash || typeof hash !== 'string') {
    return false;
  }

  // SHA-256 é sempre 64 caracteres hexadecimais
  const sha256Regex = /^[a-f0-9]{64}$/i;
  const isValid = sha256Regex.test(hash);

  if (!isValid) {
    console.warn('[Validation] Hash SHA-256 inválido', {
      hash: hash.substring(0, 10) + '...',
      length: hash.length,
    });
  }

  return isValid;
};

/**
 * Calcula hash SHA-256 de um ficheiro no navegador
 * @param {File} file - Ficheiro a hashificar
 * @returns {Promise<string>} Hash SHA-256 em hexadecimal
 */
export const calculateSHA256 = async (file) => {
  try {
    if (!file) {
      throw new Error('Ficheiro inválido');
    }

    console.log(`[Validation] Calculando SHA-256 de: ${file.name} (${file.size} bytes)`);

    // Converter ficheiro para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Usar Web Crypto API para calcular SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

    // Converter buffer para hexadecimal
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    console.log(`[Validation] SHA-256 calculado com sucesso: ${hashHex.substring(0, 10)}...`);

    return hashHex;
  } catch (error) {
    console.error('[Validation] Erro ao calcular SHA-256', error.message);
    throw new Error('Erro ao calcular hash do ficheiro');
  }
};

/**
 * Formata data ISO para formato legível em português
 * @param {string} dateString - Data em formato ISO
 * @returns {string} Data formatada
 */
export const formatDate = (dateString) => {
  try {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Africa/Maputo',
    };

    return new Date(dateString).toLocaleDateString('pt-MZ', options);
  } catch (error) {
    console.error('[Validation] Erro ao formatar data', error.message);
    return dateString;
  }
};

/**
 * Sanitiza input de utilizador removendo caracteres perigosos
 * @param {string} input - Input a sanitizar
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} Input sanitizado
 */
export const sanitizeInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remover espaços extras e converter para minúsculas
  let sanitized = input.trim().toLowerCase();

  // Limitar comprimento
  sanitized = sanitized.substring(0, maxLength);

  // Remover caracteres de controle (para hash, apenas hex é permitido)
  if (/^[a-f0-9]*$/.test(sanitized)) {
    return sanitized;
  }

  // Para inputs normais, remover caracteres especiais perigosos
  sanitized = sanitized.replace(/[^a-z0-9\s@._-]/gi, '');

  return sanitized;
};

/**
 * Valida tamanho de ficheiro
 * @param {File} file - Ficheiro a validar
 * @param {number} maxSizeMB - Tamanho máximo em MB
 * @returns {boolean} True se válido
 */
export const validateFileSize = (file, maxSizeMB = 50) => {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    console.warn(`[Validation] Ficheiro muito grande: ${file.size} bytes`);
    return false;
  }

  return true;
};

/**
 * Formata tamanho de ficheiro para formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default {
  validateSHA256Hash,
  calculateSHA256,
  formatDate,
  sanitizeInput,
  validateFileSize,
  formatFileSize,
};
