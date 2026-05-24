// src/services/api.js
/**
 * API Service - DocVerify MZ
 * 
 * Gerencia todas as comunicações com a API FastAPI.
 * Implementa interceptadores para autenticação, tratamento de erros,
 * e logging estruturado para auditoria.
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;

console.log(`[API Service] Inicializando com URL: ${API_BASE_URL}`);

// Criar instância do axios com configuração profissional
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========================================
// INTERCEPTADOR DE REQUISIÇÃO
// ========================================
api.interceptors.request.use(
  (config) => {
    // Adicionar token de autenticação se disponível
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log estruturado de requisição
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

// ========================================
// INTERCEPTADOR DE RESPOSTA
// ========================================
api.interceptors.response.use(
  (response) => {
    // Log estruturado de resposta bem-sucedida
    console.log(`[API Response] ${response.status} ${response.config.url}`, {
      timestamp: new Date().toISOString(),
      status: response.status,
      url: response.config.url,
    });

    return response;
  },
  (error) => {
    // Tratamento centralizado de erros
    if (error.response) {
      // Erro retornado pela API
      const status = error.response.status;
      const data = error.response.data;

      console.error(`[API Error] ${status}`, {
        timestamp: new Date().toISOString(),
        status: status,
        url: error.config.url,
        data: data,
      });

      // Se autenticação expirou, redirecionar para login
      if (status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }

      return Promise.reject(data);
    } else if (error.request) {
      // Requisição foi feita mas sem resposta
      console.error('[API Error] Sem resposta do servidor', {
        timestamp: new Date().toISOString(),
        url: error.config?.url,
      });

      return Promise.reject({
        message: 'Sem resposta do servidor. Verifique a conexão.',
      });
    } else {
      // Erro ao configurar a requisição
      console.error('[API Error] Erro de configuração', error.message);

      return Promise.reject({
        message: 'Erro ao processar requisição.',
      });
    }
  }
);

// ========================================
// FUNÇÕES DE VERIFICAÇÃO DE DOCUMENTOS
// ========================================

/**
 * Verifica um documento usando hash SHA-256 via GET request
 * @param {string} docHash - Hash SHA-256 do documento (64 caracteres)
 * @returns {Promise} Resposta com dados públicos se encontrado
 */
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

/**
 * Verifica um documento usando hash SHA-256 via POST request
 * @param {string} docHash - Hash SHA-256 do documento
 * @param {string|null} institutionId - ID opcional da instituição
 * @returns {Promise} Resposta com dados públicos se encontrado
 */
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

// ========================================
// FUNÇÕES DE HEALTH CHECK
// ========================================

/**
 * Verifica se a API está disponível
 * @returns {Promise<boolean>} True se API está operacional
 */
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health', {
      timeout: 5000, // Timeout reduzido para health check
    });
    return response.data?.status === 'online';
  } catch (error) {
    console.warn('[checkApiHealth] API indisponível');
    return false;
  }
};

export default api;
