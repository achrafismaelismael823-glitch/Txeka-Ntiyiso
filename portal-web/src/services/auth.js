import api, { translateError, requestWithRetry } from './api';

function validateCredentials(institution_id, password) {
  const errors = [];
  if (!institution_id || institution_id.trim().length === 0) {
    errors.push('ID da instituicao e obrigatorio');
  } else if (institution_id.trim().length < 2) {
    errors.push('ID da instituicao deve ter pelo menos 2 caracteres');
  }
  if (!password || password.length === 0) {
    errors.push('Senha e obrigatoria');
  } else if (password.length < 4) {
    errors.push('Senha deve ter pelo menos 4 caracteres');
  }
  return errors;
}

export const login = async (institution_id, password) => {
  const validationErrors = validateCredentials(institution_id, password);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors[0]);
    err.translated = { code: 'VALIDATION', message: validationErrors.join('. '), type: 'warning', fields: validationErrors };
    throw err;
  }

  try {
    const data = await requestWithRetry(() => api.post('/auth/login', {
      institution_id: institution_id.trim(),
      password: password,
    }).then(r => r.data));

    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('institutionId', data.institution?.id || institution_id);
    localStorage.setItem('username', data.institution?.name || institution_id);
    localStorage.setItem('userRole', 'institution');
    localStorage.setItem('loginTime', new Date().toISOString());
    localStorage.setItem('institutionData', JSON.stringify(data.institution || {}));

    console.log('[Auth] Instituicao autenticada:', data.institution?.name || institution_id);
    return data;
  } catch (error) {
    if (error.translated) throw error;
    const translated = translateError(error);
    error.translated = translated;
    throw error;
  }
};

export const loginAdmin = async (email, password) => {
  if (!email || !email.includes('@')) {
    const err = new Error('Email invalido');
    err.translated = { code: 'VALIDATION', message: 'Digite um email valido.', type: 'warning' };
    throw err;
  }
  if (!password || password.length < 4) {
    const err = new Error('Senha invalida');
    err.translated = { code: 'VALIDATION', message: 'Senha deve ter pelo menos 4 caracteres.', type: 'warning' };
    throw err;
  }

  try {
    const data = await requestWithRetry(() => api.post('/auth/admin/login', null, {
      params: { email, password }
    }).then(r => r.data));

    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('username', email);
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('loginTime', new Date().toISOString());

    console.log('[Auth] Admin autenticado:', email);
    return data;
  } catch (error) {
    if (error.translated) throw error;
    const translated = translateError(error);
    error.translated = translated;
    throw error;
  }
};

export const logout = () => {
  try {
    const username = localStorage.getItem('username');
    localStorage.removeItem('authToken');
    localStorage.removeItem('institutionId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('institutionData');
    localStorage.removeItem('verificationHistory');
    console.log('[Auth] Sessao terminada:', username);
  } catch (error) {
    console.error('[Auth Logout Error]', error.message);
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

export const getInstitutionId = () => {
  return localStorage.getItem('institutionId');
};

export const getCurrentUser = () => {
  if (!isAuthenticated()) return null;
  return {
    username: localStorage.getItem('username'),
    institutionId: localStorage.getItem('institutionId'),
    role: localStorage.getItem('userRole'),
    loginTime: localStorage.getItem('loginTime'),
    institution: JSON.parse(localStorage.getItem('institutionData') || '{}'),
  };
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export default {
  login,
  loginAdmin,
  logout,
  isAuthenticated,
  getInstitutionId,
  getCurrentUser,
  getAuthToken,
};

