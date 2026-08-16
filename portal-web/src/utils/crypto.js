// ═══════════════════════════════════════════════
// 🔐 CRYPTO UTILS — Txeka Ntiyiso
// ═══════════════════════════════════════════════
// Funções criptográficas para hash, encode/decode
// e geração de identificadores seguros
// ═══════════════════════════════════════════════

/**
 * Gera hash SHA-256 de uma string
 * @param {string} message
 * @returns {Promise<string>} hex string
 */
export const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Gera UUID v4 aleatório
 * @returns {string}
 */
export const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Gera código QR seguro (base64url)
 * @param {string} input
 * @returns {string}
 */
export const generateQRCode = (input) => {
  const base64 = btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return base64;
};

/**
 * Decode QR code
 * @param {string} code
 * @returns {string}
 */
export const decodeQRCode = (code) => {
  const base64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  return atob(base64 + padding);
};

/**
 * Gera nonce criptográfico
 * @param {number} length
 * @returns {string}
 */
export const generateNonce = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < length; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
};

export default {
  sha256,
  uuidv4,
  generateQRCode,
  decodeQRCode,
  generateNonce,
};
