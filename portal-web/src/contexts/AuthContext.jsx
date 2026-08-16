import { createContext, useState, useCallback, useEffect, useMemo } from 'react';
import { endpoints } from '../services/api';
import { authService } from '../services/auth';

export const AuthContext = createContext(null);

const decodeUserFromToken = () => {
  const payload = authService.decodeToken();
  if (!payload) return { user: null, isAdmin: false, isInstitution: false };
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
    isInstitution: role === 'institution',
  };
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => decodeUserFromToken());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setAuthState(decodeUserFromToken());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
    const handleStorage = (e) => { if (e.key === 'txeka_token') refresh(); };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refresh]);

  const isAuthenticated = useMemo(() => {
    return authService.isAuthenticated();
  }, [authState]);

  const extractToken = (data) => {
    if (data?.access_token) return data.access_token;
    if (data?.token) return data.token;
    if (data?.data?.access_token) return data.data.access_token;
    if (data?.data?.token) return data.data.token;
    return null;
  };

  const login = useCallback(async (institutionId, password) => {
    try {
      const response = await endpoints.auth.login({ institution_id: institutionId, password });
      const token = extractToken(response.data);
      if (token) {
        authService.setToken(token);
        setAuthState(decodeUserFromToken());
        return { success: true };
      }
      return { success: false, error: 'Token não encontrado na resposta' };
    } catch (err) {
      return { success: false, error: err.normalizedMessage || 'Erro no login' };
    }
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    try {
      const response = await endpoints.auth.adminLogin(email, password);
      const token = extractToken(response.data);
      if (token) {
        authService.setToken(token);
        setAuthState(decodeUserFromToken());
        return { success: true };
      }
      return { success: false, error: 'Token não encontrado na resposta' };
    } catch (err) {
      return { success: false, error: err.normalizedMessage || 'Erro no login' };
    }
  }, []);

  const logout = useCallback(() => {
    authService.removeToken();
    setAuthState({ user: null, isAdmin: false, isInstitution: false });
  }, []);

  const value = useMemo(() => ({
    user: authState.user,
    isAdmin: authState.isAdmin,
    isInstitution: authState.isInstitution,
    isAuthenticated,
    loading,
    login,
    adminLogin,
    logout,
  }), [authState, isAuthenticated, loading, login, adminLogin, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
