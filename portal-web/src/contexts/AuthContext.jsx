import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';
import { endpoints } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = authService.getUser();
    if (stored && authService.isAuthenticated()) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (institutionId, password) => {
    const { data } = await endpoints.auth.login({ institution_id: institutionId, password });
    authService.setToken(data.access_token);
    authService.setUser(data.institution);
    setUser(data.institution);
    return data;
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    const { data } = await endpoints.auth.adminLogin({ email, password });
    authService.setToken(data.access_token);
    authService.setUser(data.user || data.institution);
    setUser(data.user || data.institution);
    return data;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, adminLogin, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
