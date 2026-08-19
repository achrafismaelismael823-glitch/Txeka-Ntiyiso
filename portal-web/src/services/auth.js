// ═══════════════════════════════════════════════
// 🔐 AUTH SERVICE — Txeka Ntiyiso
// ═══════════════════════════════════════════════
// Token key: txeka_token (fallback 'token' legado)
// ═══════════════════════════════════════════════

const TOKEN_KEY = 'txeka_token';
const FAILED_ATTEMPTS_KEY = 'txeka_failed_attempts';
const LOCKOUT_UNTIL_KEY = 'txeka_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 300;

export const authService = {
  setToken: (token) => {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token') || null;
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    const token = authService.getToken();
    if (!token) return false;
    try {
      const payload = authService.decodeToken();
      if (!payload) return false;
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  },

  decodeToken: () => {
    const token = authService.getToken();
    if (!token) return null;
    try {
      const base64 = token.split('.')[1];
      const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  },

  getUser: () => {
    const payload = authService.decodeToken();
    if (!payload) return null;
    return {
      id: payload.id || payload.sub || 'unknown',
      email: payload.email || payload.sub || 'unknown',
      name: payload.sub || payload.email || payload.name || 'Utilizador',
      role: payload.role || 'citizen',
      institution: payload.institution || null,
    };
  },

  logout: () => {
    authService.removeToken();
    authService.resetFailedAttempts();
    window.location.href = '/login';
  },

  getFailedAttempts: () => {
    const attempts = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    return attempts ? parseInt(attempts, 10) : 0;
  },

  incrementFailedAttempts: () => {
    const current = authService.getFailedAttempts();
    const next = current + 1;
    localStorage.setItem(FAILED_ATTEMPTS_KEY, String(next));
    if (next >= MAX_ATTEMPTS) {
      authService.setLockout(LOCKOUT_SECONDS);
    }
    return next;
  },

  resetFailedAttempts: () => {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_UNTIL_KEY);
  },

  setLockout: (seconds) => {
    const until = Date.now() + seconds * 1000;
    localStorage.setItem(LOCKOUT_UNTIL_KEY, String(until));
  },

  getRemainingLockoutSeconds: () => {
    const until = localStorage.getItem(LOCKOUT_UNTIL_KEY);
    if (!until) return 0;
    const remaining = Math.ceil((parseInt(until, 10) - Date.now()) / 1000);
    if (remaining <= 0) {
      localStorage.removeItem(LOCKOUT_UNTIL_KEY);
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      return 0;
    }
    return remaining;
  },

  isLockedOut: () => {
    return authService.getRemainingLockoutSeconds() > 0;
  },

  getLockoutConfig: () => ({
    maxAttempts: MAX_ATTEMPTS,
    lockoutSeconds: LOCKOUT_SECONDS,
  }),
};

export default authService;
