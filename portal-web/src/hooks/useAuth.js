import { useState, useEffect, useCallback } from 'react';

const TOKEN_KEY = 'txeka_token';

// Decodifica JWT payload (base64url)
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
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const payload = authService.decodeToken();
    if (payload) {
      const role = payload.role || 'citizen';
      const isAdminRole = role === 'admin';
      setIsAdmin(isAdminRole);
      setUser({
        id: payload.id || payload.sub || 'unknown',
        email: payload.email || payload.sub || 'unknown',
        name: payload.sub || payload.email || 'Utilizador',
        role: role,
        institution: payload.institution || null,
      });
    } else {
      setUser(null);
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handleStorage = (e) => {
      if (e.key === TOKEN_KEY) refresh();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refresh]);

  return { user, isAdmin, loading, refresh };
}

export default useAuth;
