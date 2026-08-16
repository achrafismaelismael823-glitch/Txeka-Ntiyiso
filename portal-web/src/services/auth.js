// ═══════════════════════════════════════════════
// 🔐 AUTH SERVICE — Unificado e Seguro
// ═══════════════════════════════════════════════
// Substitui authService.js + auth.js duplicados
// Token key: txeka_token (fallback para 'token' legado)
// ═══════════════════════════════════════════════

const TOKEN_KEY = 'txeka_token';

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
    window.location.href = '/login';
  },
};

export default authService;
