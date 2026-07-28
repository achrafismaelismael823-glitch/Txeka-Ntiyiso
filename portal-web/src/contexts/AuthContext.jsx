import { createContext, useState, useCallback, useEffect } from 'react';
import { endpoints } from '../services/api';
import { authService } from '../hooks/useAuth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const decodeAndSetUser = useCallback(() => {
    const payload = authService.decodeToken();
    if (payload) {
      const role = payload.role || 'citizen';
      setIsAdmin(role === 'admin');
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
  }, []);

  useEffect(() => {
    decodeAndSetUser();
    setLoading(false);
  }, [decodeAndSetUser]);

  const extractToken = (data) => {
    // Suporta múltiplos formatos de resposta da API
    if (data?.access_token) return data.access_token;
    if (data?.token) return data.token;
    if (data?.data?.access_token) return data.data.access_token;
    if (data?.data?.token) return data.data.token;
    if (typeof data === 'string' && data.startsWith('eyJ')) return data;
    return null;
  };

  const login = useCallback(async (institutionId, password) => {
    const response = await endpoints.auth.login({
      institution_id: institutionId,
      password,
    });
    const token = extractToken(response.data);
    if (token) {
      authService.setToken(token);
      decodeAndSetUser();
      return { success: true, token };
    }
    return { success: false, data: response.data };
  }, [decodeAndSetUser]);

  const adminLogin = useCallback(async (email, password) => {
    const response = await endpoints.auth.adminLogin(email, password);
    const token = extractToken(response.data);
    if (token) {
      authService.setToken(token);
      decodeAndSetUser();
      return { success: true, token };
    }
    return { success: false, data: response.data };
  }, [decodeAndSetUser]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
