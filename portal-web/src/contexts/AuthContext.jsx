import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hidrata a sessão ao recarregar a aplicação
    const token = localStorage.getItem('txeka_token');
    const savedUser = localStorage.getItem('txeka_user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login para Instituições B2B
  const loginInstitution = async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/login', credentials);
      const { access_token, token_type } = response.data;
      
      localStorage.setItem('txeka_token', access_token);
      
      const userData = { role: 'institution', email: credentials.username };
      localStorage.setItem('txeka_user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Falha na autenticação da instituição.' 
      };
    }
  };

  // Login para Administradores do Sistema
  const loginAdmin = async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/admin/login', credentials);
      const { access_token } = response.data;
      
      localStorage.setItem('txeka_token', access_token);
      
      const userData = { role: 'admin', email: credentials.username };
      localStorage.setItem('txeka_user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Falha na autenticação do administrador.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('txeka_token');
    localStorage.removeItem('txeka_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, loginInstitution, loginAdmin, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
