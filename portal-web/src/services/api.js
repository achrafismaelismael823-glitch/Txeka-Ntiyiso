import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
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
    // Adiciona token
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log de requisição
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, {
      timestamp: new Date().toISOString(),
      method: config.method,
      url: config.url,
    });

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
    // Log de resposta
    console.log(`[API Response] ${response.status} ${response.config.url}`, {
      timestamp: new Date().toISOString(),
      status: response.status,
      url: response.config.url,
    });

    return response;
  },
  (error) => {
    // Trata erros da API
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      console.error(`[API Error] ${status}`, {
        timestamp: new Date().toISOString(),
        status: status,
        url: error.config.url,
        data: data,
      });

      // Redireciona se não autorizado
      if (status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }

      return Promise.reject(data);
    } else if (error.request) {
      // Sem resposta do servidor
      console.error('[API Error] Sem resposta do servidor', {
        timestamp: new Date().toISOString(),
        url: error.config?.url,
      });

      return Promise.reject({
        message: 'Sem resposta do servidor. Verifique a conexão.',
      });
    } else {
      // Erro de configuração
      console.error('[API Error] Erro de configuração', error.message);

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
      doc_hash: docHash.toLowerCase(),
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
