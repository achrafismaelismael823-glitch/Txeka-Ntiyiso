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

  const login = useCallback(async (institutionId, password) => {
    try {
      const response = await endpoints.auth.login({ institution_id: institutionId, password });
      let data = response.data;

      // Se a API retornar string em vez de JSON, faz parse
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { /* ignora */ }
      }

      const token = data?.access_token || data?.token;
      if (!token) {
        const err = new Error('Token não recebido');
        err.apiResponse = data;
        err.apiStatus = response.status;
        err.apiUrl = response.config?.url;
        err.apiBaseURL = response.config?.baseURL;
        throw err;
      }

      authService.setToken(token);
      const userData = {
        ...data.institution,
        role: data.institution?.role || 'institution',
        id: data.institution?.id || institutionId,
        token: token,
      };
      authService.setUser(userData);
      setUser(userData);
      return data;
    } catch (error) {
      authService.logout();
      setUser(null);
      throw error;
    }
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    try {
      const response = await endpoints.auth.adminLogin(email, password);
      let data = response.data;

      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { /* ignora */ }
      }

      const token = data?.access_token || data?.token;
      if (!token) {
        const err = new Error('Token não recebido');
        err.apiResponse = data;
        err.apiStatus = response.status;
        err.apiUrl = response.config?.url;
        err.apiBaseURL = response.config?.baseURL;
        throw err;
      }

      authService.setToken(token);
      const userData = {
        id: 'admin',
        name: 'Administrador Txeka Ntiyiso',
        email,
        role: 'admin',
        token: token,
        expires_in_days: data?.expires_in_days || 90,
      };
      authService.setUser(userData);
      setUser(userData);
      return data;
    } catch (error) {
      authService.logout();
      setUser(null);
      throw error;
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
