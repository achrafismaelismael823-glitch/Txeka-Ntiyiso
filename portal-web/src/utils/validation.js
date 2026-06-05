// Validação de hash SHA-256
export const validateSHA256Hash = (hash) => {
  if (!hash || typeof hash !== 'string') {
    return false;
  }

  // Verifica formato SHA-256 (64 hex)
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

// Calcula SHA-256 de ficheiro
export const calculateSHA256 = async (file) => {
  try {
    if (!file) {
      throw new Error('Ficheiro inválido');
    }

    console.log(`[Validation] Calculando SHA-256 de: ${file.name} (${file.size} bytes)`);

    // Converte ficheiro para buffer
    const arrayBuffer = await file.arrayBuffer();

    // Calcula hash com Web Crypto
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

    // Converte para hexadecimal
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    console.log(`[Validation] SHA-256 calculado: ${hashHex.substring(0, 10)}...`);

    return hashHex;
  } catch (error) {
    console.error('[Validation] Erro ao calcular SHA-256', error.message);
    throw new Error('Erro ao calcular hash do ficheiro');
  }
};

// Formata data para pt-MZ
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

// Sanitiza input
export const sanitizeInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') {
    return '';
  }

  // Normaliza texto
  let sanitized = input.trim().toLowerCase();

  // Limita tamanho
  sanitized = sanitized.substring(0, maxLength);

  // Permite apenas hex (hash)
  if (/^[a-f0-9]*$/.test(sanitized)) {
    return sanitized;
  }

  // Remove caracteres perigosos
  sanitized = sanitized.replace(/[^a-z0-9\s@._-]/gi, '');

  return sanitized;
};

// Valida tamanho de ficheiro
export const validateFileSize = (file, maxSizeMB = 50) => {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    console.warn(`[Validation] Ficheiro muito grande: ${file.size} bytes`);
    return false;
  }

  return true;
};

// Formata tamanho de ficheiro
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
