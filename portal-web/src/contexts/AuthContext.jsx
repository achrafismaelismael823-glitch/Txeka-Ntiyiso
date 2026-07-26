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

  // Login Instituição: POST /api/v1/auth/login (body JSON)
  const login = useCallback(async (institutionId, password) => {
    const { data } = await endpoints.auth.login({ 
      institution_id: institutionId, 
      password 
    });
    authService.setToken(data.access_token);
    
    const userData = {
      ...data.institution,
      _type: 'institution',
      _role: 'institution',
      token: data.access_token,
    };
    
    authService.setUser(userData);
    setUser(userData);
    return data;
  }, []);

  // Login Admin: POST /api/v1/auth/admin/login (query params!)
  const adminLogin = useCallback(async (email, password) => {
    const { data } = await endpoints.auth.adminLogin({ email, password });
    authService.setToken(data.access_token);
    
    const userData = {
      ...data.user,
      id: data.user?.email || 'admin',
      name: data.user?.name || 'Administrador',
      _type: 'admin',
      _role: 'admin',
      token: data.access_token,
    };
    
    authService.setUser(userData);
    setUser(userData);
    return data;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const isAdmin = user?._type === 'admin' || user?._role === 'admin';
  const isInstitution = user?._type === 'institution' || user?._role === 'institution';

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
