// Autenticação REAL — chama backend Txeka Ntiyiso API
import api from './api';

// Login institucional (chama backend real)
export const login = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios');
    }

    // Chama API real de autenticação
    const response = await api.post('/auth/login', {
      institution_id: email,
      password: password,
    });

    const data = response.data;

    // Guarda token JWT real do backend
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('username', data.institution?.name || email);
    localStorage.setItem('userRole', data.institution ? 'institution' : 'user');
    localStorage.setItem('loginTime', new Date().toISOString());
    localStorage.setItem('institutionData', JSON.stringify(data.institution || {}));

    console.log(`[Auth] Instituição autenticada: ${data.institution?.name || email}`);

    return data;
  } catch (error) {
    console.error('[Auth Login Error]', error);
    
    if (error.response?.status === 401) {
      throw new Error('Credenciais institucionais inválidas.');
    } else if (error.response?.status === 403) {
      throw new Error(error.response.data?.detail || 'Conta inativa. Contacte o administrador.');
    } else if (!error.response) {
      throw new Error('Servidor indisponível. Verifique a conexão.');
    } else {
      throw new Error(error.response.data?.detail || 'Erro ao autenticar.');
    }
  }
};

// Login admin (chama backend real)
export const loginAdmin = async (email, password) => {
  try {
    const response = await api.post('/auth/admin/login', null, {
      params: { email, password }
    });

    const data = response.data;

    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('username', email);
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('loginTime', new Date().toISOString());

    console.log(`[Auth] Admin autenticado: ${email}`);

    return data;
  } catch (error) {
    console.error('[Auth Admin Login Error]', error);
    
    if (error.response?.status === 401) {
      throw new Error('Credenciais de administrador inválidas.');
    } else {
      throw new Error(error.response?.data?.detail || 'Erro ao autenticar administrador.');
    }
  }
};

// Termina sessão
export const logout = () => {
  try {
    const username = localStorage.getItem('username');
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('institutionData');
    localStorage.removeItem('verificationHistory');

    console.log(`[Auth] Sessão terminada: ${username}`);
  } catch (error) {
    console.error('[Auth Logout Error]', error.message);
  }
};

// Verifica autenticação (token existe)
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

// Obtém utilizador atual
export const getCurrentUser = () => {
  if (!isAuthenticated()) {
    return null;
  }

  return {
    username: localStorage.getItem('username'),
    role: localStorage.getItem('userRole'),
    loginTime: localStorage.getItem('loginTime'),
    institution: JSON.parse(localStorage.getItem('institutionData') || '{}'),
  };
};

// Obtém token
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export default {
  login,
  loginAdmin,
  logout,
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
};
