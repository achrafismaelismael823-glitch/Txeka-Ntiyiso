import axios from 'axios';

// Instância base do Axios configurada para a API do Txeka Ntiyiso v2.0.0
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição: Injeta o Bearer Token se disponível no localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('txeka_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta: Tratamento centralizado de erros corporativos
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    if (response) {
      if (response.status === 401) {
        // Token expirado ou inválido - limpa sessão e redireciona para login
        localStorage.removeItem('txeka_token');
        localStorage.removeItem('txeka_user');
        window.location.href = '/login';
      }
      
      // O erro 422 (HTTPValidationError) será tratado individualmente nos formulários
    }
    
    return Promise.reject(error);
  }
);

export default api;
