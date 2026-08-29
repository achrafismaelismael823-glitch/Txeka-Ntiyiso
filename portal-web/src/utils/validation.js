// ═══════════════════════════════════════════════
// ✅ VALIDATION UTILS — Txeka Ntiyiso
// ═══════════════════════════════════════════════
// Validações específicas de Moçambique
// ═══════════════════════════════════════════════

export const isValidNUIT = (nuit) => {
  if (!nuit) return false;
  return /^\d{9}$/.test(String(nuit).replace(/\s/g, ''));
};

export const isValidBI = (bi) => {
  if (!bi) return false;
  return /^\d{12}$/.test(String(bi).replace(/\s/g, ''));
};

export const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\s/g, '');
  return /^(\+?258)?[82-9]\d{8}$/.test(cleaned);
};

export const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidHash = (hash) => {
  if (!hash) return false;
  return /^[a-f0-9]{64}$/i.test(hash);
};

export default {
  isValidNUIT,
  isValidBI,
  isValidPhone,
  isValidEmail,
  isValidHash,
};
