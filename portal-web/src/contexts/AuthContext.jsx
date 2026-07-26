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

  // Login Instituição — PROPAGA ERRO se falhar
  const login = useCallback(async (institutionId, password) => {
    try {
      const { data } = await endpoints.auth.login({ 
        institution_id: institutionId, 
        password 
      });

      // Se a API retornar erro (status 4xx/5xx), o axios já lança exceção
      // Mas se retornar 200 com dados inválidos, verificamos
      if (!data.access_token) {
        throw new Error('Resposta inválida do servidor — token não recebido');
      }

      authService.setToken(data.access_token);
      
      const userData = {
        ...data.institution,
        role: data.institution?.role || 'institution',
        _type: 'institution',
        token: data.access_token,
      };
      
      authService.setUser(userData);
      setUser(userData);
      return data;
      
    } catch (error) {
      // LIMPA tudo se falhar — garante que não fica estado sujo
      authService.logout();
      setUser(null);
      // PROPAGA o erro para o componente mostrar mensagem
      throw error;
    }
  }, []);

  // Login Admin — PROPAGA ERRO se falhar
  const adminLogin = useCallback(async (email, password) => {
    try {
      const { data } = await endpoints.auth.adminLogin({ email, password });

      if (!data.access_token) {
        throw new Error('Resposta inválida do servidor — token não recebido');
      }

      authService.setToken(data.access_token);
      
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
      
    } catch (error) {
      authService.logout();
      setUser(null);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
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
