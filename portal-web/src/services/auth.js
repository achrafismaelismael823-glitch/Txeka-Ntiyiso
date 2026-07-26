const TOKEN_KEY = 'txeka_token';
const USER_KEY = 'txeka_user';

// Decodifica JWT sem verificar assinatura (só para ler payload)
const decodeJWT = (token) => {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const authService = {
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  removeUser: () => localStorage.removeItem(USER_KEY),
  
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
  
  // Extrai role direto do JWT
  getRole: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = decodeJWT(token);
    return payload?.role || null;
  },
  
  // Verifica se é admin pelo JWT
  isAdmin: () => {
    const role = authService.getRole();
    return role === 'admin';
  },
  
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};
