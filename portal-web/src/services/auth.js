// src/services/auth.js
/**
 * Authentication Service - DocVerify MZ
 * 
 * Gerencia autenticação de utilizadores, tokens e sessões.
 * Implementa padrões seguros de armazenamento de credenciais.
 */

/**
 * Realiza login do utilizador
 * @param {string} username - Nome de utilizador
 * @param {string} password - Senha do utilizador
 * @returns {Promise<Object>} Dados de utilizador autenticado
 */
export const login = async (username, password) => {
  try {
    // Validação básica
    if (!username || !password) {
      throw new Error('Nome de utilizador e senha são obrigatórios');
    }

    if (username.length < 3) {
      throw new Error('Nome de utilizador deve ter mínimo 3 caracteres');
    }

    if (password.length < 6) {
      throw new Error('Senha deve ter mínimo 6 caracteres');
    }

    // Simulação de autenticação
    // Em produção, isto seria uma chamada à API de autenticação
    const token = btoa(`${username}:${password}`);
    const user = {
      username: username,
      role: 'user',
      authenticated: true,
      loginTime: new Date().toISOString(),
    };

    // Armazenar credenciais de forma segura
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('loginTime', user.loginTime);

    console.log(`[Auth] Utilizador autenticado: ${username}`);

    return user;
  } catch (error) {
    console.error('[Auth Login Error]', error.message);
    throw error;
  }
};

/**
 * Realiza logout do utilizador
 */
export const logout = () => {
  try {
    const username = localStorage.getItem('username');
    
    // Limpar todos os dados de autenticação
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('verificationHistory');

    console.log(`[Auth] Utilizador desconectado: ${username}`);
  } catch (error) {
    console.error('[Auth Logout Error]', error.message);
  }
};

/**
 * Verifica se utilizador está autenticado
 * @returns {boolean} True se autenticado
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('username');
  return !!(token && username);
};

/**
 * Obtém informações do utilizador autenticado
 * @returns {Object|null} Dados do utilizador ou null
 */
export const getCurrentUser = () => {
  if (!isAuthenticated()) {
    return null;
  }

  return {
    username: localStorage.getItem('username'),
    role: localStorage.getItem('userRole'),
    loginTime: localStorage.getItem('loginTime'),
  };
};

/**
 * Obtém token de autenticação
 * @returns {string|null} Token JWT ou null
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export default {
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
};
