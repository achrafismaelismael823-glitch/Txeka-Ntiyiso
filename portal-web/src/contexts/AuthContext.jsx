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

  const login = useCallback(async (institutionId, password) => {
    const { data } = await endpoints.auth.login({
      institution_id: institutionId,
      password,
    });
    if (data.access_token) {
      authService.setToken(data.access_token);
      decodeAndSetUser();
    }
    return data;
  }, [decodeAndSetUser]);

  const adminLogin = useCallback(async (email, password) => {
    const { data } = await endpoints.auth.adminLogin(email, password);
    if (data.access_token) {
      authService.setToken(data.access_token);
      decodeAndSetUser();
    }
    return data;
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

