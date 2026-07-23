import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://txeka-ntiyiso-api.onrender.com/api/v1';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;

console.log(`[API Service] Inicializando com URL: ${API_BASE_URL}`);

// Instância axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepta requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Intercepta respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('institutionData');
        window.location.href = '/login';
      }

      return Promise.reject(error);
    } else if (error.request) {
      return Promise.reject({
        message: 'Sem resposta do servidor. Verifique a conexão.',
        networkError: true,
      });
    } else {
      return Promise.reject({
        message: 'Erro ao processar requisição.',
      });
    }
  }
);

// Verifica documento via GET
export const verifyDocumentByHash = async (docHash) => {
  try {
    if (!docHash || typeof docHash !== 'string') {
      throw new Error('Hash inválido');
    }

    if (docHash.length !== 64) {
      throw new Error('Hash deve ter exactamente 64 caracteres');
    }

    const response = await api.get(`/verify/${docHash.toLowerCase()}`);
    return response.data;
  } catch (error) {
    const message = error.message || 'Erro ao verificar documento';
    console.error('[verifyDocumentByHash]', message);
    throw error;
  }
};

// Verifica documento via POST
export const verifyDocument = async (docHash, institutionId = null) => {
  try {
    const payload = {
      hash: docHash.toLowerCase(),
    };

    if (institutionId) {
      payload.institution_id = institutionId;
    }

    const response = await api.post('/verify', payload);
    return response.data;
  } catch (error) {
    const message = error.message || 'Erro ao verificar documento';
    console.error('[verifyDocument]', message);
    throw error;
  }
};

// Verifica estado da API
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health', {
      timeout: 5000,
    });
    return response.data?.status === 'online';
  } catch (error) {
    console.warn('[checkApiHealth] API indisponível');
    return false;
  }
};

export default api;

