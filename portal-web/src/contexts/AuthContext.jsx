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

  // Login Instituição: POST /api/v1/auth/login
  const login = useCallback(async (institutionId, password) => {
    const { data } = await endpoints.auth.login({ 
      institution_id: institutionId, 
      password 
    });
    
    authService.setToken(data.access_token);
    
    // Estrutura real: data.institution contém tudo
    const userData = {
      ...data.institution,           // id, name, contact_email, credits, etc.
      role: data.institution?.role || 'institution',
      _type: 'institution',
      token: data.access_token,
    };
    
    authService.setUser(userData);
    setUser(userData);
    return data;
  }, []);

  // Login Admin: POST /api/v1/auth/admin/login (query params)
  const adminLogin = useCallback(async (email, password) => {
    const { data } = await endpoints.auth.adminLogin({ email, password });
    
    authService.setToken(data.access_token);
    
    // Admin não tem objeto institution — vem do JWT
    const userData = {
      id: 'admin',
      name: 'Administrador Txeka Ntiyiso',
      email: email,
      role: 'admin',
      _type: 'admin',
      token: data.access_token,
      expires_in_days: data.expires_in_days || 90,
    };
    
    authService.setUser(userData);
    setUser(userData);
    return data;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Usa o JWT decodificado + user object para determinar role
  const isAdmin = user?.role === 'admin' || authService.isAdmin();
  const isInstitution = user?.role === 'institution';

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      adminLogin, 
      logout, 
      isAdmin, 
      isInstitution,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
