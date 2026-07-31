// ═══════════════════════════════════════════════════════════════
// authService.js — Serviço de autenticação puro (sem dependências React)
// ═══════════════════════════════════════════════════════════════

const TOKEN_KEY = 'txeka_token';
const FAILED_ATTEMPTS_KEY = 'txeka_failed_attempts';
const LOCKOUT_UNTIL_KEY = 'txeka_lockout_until';

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const authService = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  },

  decodeToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? decodeJwt(token) : null;
  },

  isAuthenticated: () => {
    const payload = authService.decodeToken();
    if (!payload) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > now;
  },

  // ── Proteção contra brute force ──
  getFailedAttempts: () => {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    return raw ? parseInt(raw, 10) : 0;
  },

  incrementFailedAttempts: () => {
    const current = authService.getFailedAttempts() + 1;
    localStorage.setItem(FAILED_ATTEMPTS_KEY, String(current));
    return current;
  },

  resetFailedAttempts: () => {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_UNTIL_KEY);
  },

  getLockoutUntil: () => {
    const raw = localStorage.getItem(LOCKOUT_UNTIL_KEY);
    return raw ? parseInt(raw, 10) : 0;
  },

  setLockout: (seconds) => {
    const until = Date.now() + seconds * 1000;
    localStorage.setItem(LOCKOUT_UNTIL_KEY, String(until));
  },

  isLockedOut: () => {
    const until = authService.getLockoutUntil();
    if (!until) return false;
    const remaining = Math.ceil((until - Date.now()) / 1000);
    if (remaining <= 0) {
      authService.resetFailedAttempts();
      return false;
    }
    return remaining;
  },

  getRemainingLockoutSeconds: () => {
    const until = authService.getLockoutUntil();
    if (!until) return 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  },
};

export default authService;
