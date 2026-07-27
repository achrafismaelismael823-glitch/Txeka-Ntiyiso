import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';
import { endpoints } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = authService.getUser();
    if (stored && authService.isAuthenticated()) setUser(stored);
    setLoading(false);
  }, []);

  const handleLoginError = (error) => {
    authService.logout();
    setUser(null);
    throw error;
  };

  const login = useCallback(async (institutionId, password) => {
    try {
      const { data } = await endpoints.auth.login({ institution_id: institutionId, password });
      if (!data.access_token) throw new Error('Token não recebido');

      authService.setToken(data.access_token);
      const userData = { ...data.institution, role: 'institution', id: data.institution?.id, token: data.access_token };
      authService.setUser(userData);
      setUser(userData);
      return data;
    } catch (error) {
      handleLoginError(error);
    }
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    try {
      const { data } = await endpoints.auth.adminLogin(email, password);
      if (!data.access_token) throw new Error('Token não recebido');

      authService.setToken(data.access_token);
      const userData = { id: 'admin', name: 'Administrador', email, role: 'admin', token: data.access_token };
      authService.setUser(userData);
      setUser(userData);
      return data;
    } catch (error) {
      handleLoginError(error);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      adminLogin,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isInstitution: user?.role === 'institution',
      institutionId: user?.role === 'institution' ? user?.id : null,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
