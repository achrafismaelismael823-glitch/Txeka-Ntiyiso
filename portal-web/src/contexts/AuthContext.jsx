import { createContext, useState, useCallback, useEffect } from 'react';
import { endpoints } from '../services/api';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

const decodeUserFromToken = () => {
  const payload = authService.decodeToken();
  if (!payload) return { user: null, isAdmin: false };
  const role = payload.role || 'citizen';
  return {
    user: {
      id: payload.id || payload.sub || 'unknown',
      email: payload.email || payload.sub || 'unknown',
      name: payload.sub || payload.email || 'Utilizador',
      role: role,
      institution: payload.institution || null,
    },
    isAdmin: role === 'admin',
  };
};

export const AuthProvider = ({ children }) => {
  const [{ user, isAdmin }, setAuth] = useState(decodeUserFromToken);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setAuth(decodeUserFromToken());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
    const handleStorage = (e) => { if (e.key === 'txeka_token') refresh(); };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refresh]);

  const extractToken = (data) => {
    if (data?.access_token) return data.access_token;
    if (data?.token) return data.token;
    if (data?.data?.access_token) return data.data.access_token;
    if (data?.data?.token) return data.data.token;
    return null;
  };

  const login = useCallback(async (institutionId, password) => {
    const response = await endpoints.auth.login({ institution_id: institutionId, password });
    const token = extractToken(response.data);
    if (token) { authService.setToken(token); setAuth(decodeUserFromToken()); return { success: true }; }
    return { success: false, error: 'Token não encontrado na resposta' };
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    const response = await endpoints.auth.adminLogin(email, password);
    const token = extractToken(response.data);
    if (token) { authService.setToken(token); setAuth(decodeUserFromToken()); return { success: true }; }
    return { success: false, error: 'Token não encontrado na resposta' };
  }, []);

  const logout = useCallback(() => {
    authService.removeToken();
    setAuth({ user: null, isAdmin: false });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, adminLogin, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};
