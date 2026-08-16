export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Data inválida';
  const { includeTime = true, includeSeconds = false, short = false } = options;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  if (short) return `${day}/${month}/${year}`;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  let result = `${day}/${month}/${year}`;
  if (includeTime) {
    result += ` ${hours}:${minutes}`;
    if (includeSeconds) result += `:${seconds}`;
  }
  return result;
};

export const formatRelativeDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Data inválida';
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  if (diffSec < 10) return 'Agora mesmo';
  if (diffSec < 60) return `Há ${diffSec} segundos`;
  if (diffMin < 60) return `Há ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `Há ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  if (diffDay < 30) return `Há ${diffDay} dia${diffDay > 1 ? 's' : ''}`;
  if (diffMonth < 12) return `Há ${diffMonth} mês${diffMonth > 1 ? 'es' : ''}`;
  return `Há ${diffYear} ano${diffYear > 1 ? 's' : ''}`;
};

export const formatNumber = (num, decimals = 0) => {
  if (num == null || isNaN(num)) return '—';
  return Number(num).toLocaleString('pt-MZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (amount, options = {}) => {
  if (amount == null || isNaN(amount)) return '—';
  const { showSymbol = true, decimals = 2 } = options;
  const formatted = Number(amount).toLocaleString('pt-MZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showSymbol ? `${formatted} MZN` : formatted;
};

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0 || bytes == null) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

export const truncate = (text, maxLength = 50, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
};

export const capitalize = (text) => {
  if (!text) return '';
  return text.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export const getInitials = (name, max = 2) => {
  if (!name) return '?';
  return name.split(' ').filter((n) => n).map((n) => n[0].toUpperCase()).slice(0, max).join('');
};

export const stringToColor = (str) => {
  if (!str) return '#0ea5e9';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
  return colors[Math.abs(hash) % colors.length];
};

export const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidNUIT = (nuit) => {
  if (!nuit) return false;
  return /^\d{9}$/.test(String(nuit).replace(/\s/g, ''));
};

export const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\s/g, '');
  return /^(\+?258)?[82-9]\d{8}$/.test(cleaned);
};

export const isValidBI = (bi) => {
  if (!bi) return false;
  return /^\d{12}$/.test(String(bi).replace(/\s/g, ''));
};

export const isValidHash = (hash) => {
  if (!hash) return false;
  return /^[a-f0-9]{64}$/i.test(hash);
};

export const validatePassword = (password) => {
  if (!password) return { score: 0, valid: false, requirements: [] };
  const requirements = [
    { test: password.length >= 8, label: 'Mínimo 8 caracteres' },
    { test: /[A-Z]/.test(password), label: 'Pelo menos 1 maiúscula' },
    { test: /[a-z]/.test(password), label: 'Pelo menos 1 minúscula' },
    { test: /\d/.test(password), label: 'Pelo menos 1 número' },
    { test: /[^A-Za-z0-9]/.test(password), label: 'Pelo menos 1 caractere especial' },
  ];
  const passed = requirements.filter((r) => r.test).length;
  const score = Math.min(5, passed);
  return { score, valid: score >= 3, requirements, passed, total: requirements.length };
};

export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, limit = 300) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
export const generateId = (prefix = '') => `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const formatHash = (hash, showFull = false) => {
  if (!hash) return '—';
  if (showFull) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
};

export const documentStatusLabel = (status) => {
  const labels = { active: 'Ativo', revoked: 'Revogado', expired: 'Expirado', pending: 'Pendente', verified: 'Verificado' };
  return labels[status?.toLowerCase()] || status || 'Desconhecido';
};

export const auditActionLabel = (action) => {
  const labels = { create: 'Criação', update: 'Atualização', delete: 'Eliminação', verify: 'Verificação', revoke: 'Revogação', login: 'Login', logout: 'Logout', emit: 'Emissão', bulk_emit: 'Emissão Massiva', credit_add: 'Adição de Créditos', credit_remove: 'Remoção de Créditos' };
  return labels[action?.toLowerCase()] || action || 'Desconhecido';
};

export const getTimeRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry - now;
  if (diffMs <= 0) return { expired: true, text: 'Expirado', days: 0 };
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  let text;
  if (days > 30) text = `${Math.floor(days / 30)} meses restantes`;
  else if (days > 1) text = `${days} dias restantes`;
  else if (hours > 1) text = `${hours} horas restantes`;
  else text = 'Menos de 1 hora';
  return { expired: false, text, days, hours };
};

export default {
  formatDate, formatRelativeDate, formatNumber, formatCurrency, formatBytes,
  truncate, capitalize, getInitials, stringToColor,
  isValidEmail, isValidNUIT, isValidPhone, isValidBI, validatePassword,
  debounce, throttle, deepClone, generateId, copyToClipboard, downloadBlob,
  formatHash, documentStatusLabel, auditActionLabel, getTimeRemaining,
};
