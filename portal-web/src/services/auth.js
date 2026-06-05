// Autenticação de utilizador
export const login = async (username, password) => {
  try {
    // Valida credenciais básicas
    if (!username || !password) {
      throw new Error('Nome de utilizador e senha são obrigatórios');
    }

    if (username.length < 3) {
      throw new Error('Nome de utilizador deve ter mínimo 3 caracteres');
    }

    if (password.length < 6) {
      throw new Error('Senha deve ter mínimo 6 caracteres');
    }

    // Gera token simples
    const token = btoa(`${username}:${password}`);

    // Cria sessão do utilizador
    const user = {
      username: username,
      role: 'user',
      authenticated: true,
      loginTime: new Date().toISOString(),
    };

    // Guarda dados de sessão
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

// Termina sessão
export const logout = () => {
  try {
    const username = localStorage.getItem('username');
    
    // Limpa dados de sessão
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

// Verifica autenticação
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('username');
  return !!(token && username);
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
  };
};

// Obtém token
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
