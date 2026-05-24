// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { AlertCircle, LogIn } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao autenticar');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card de Login */}
        <div className="card shadow-2xl">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">🇲🇿</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              DocVerify MZ
            </h2>
            <p className="text-gray-600 text-sm">
              Plataforma de Verificação de Documentos
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Nome de Utilizador */}
            <div>
              <label className="label-field">Nome de Utilizador</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Digite seu nome de utilizador"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* Campo Senha */}
            <div>
              <label className="label-field">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Digite sua senha"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
                <AlertCircle className="text-danger flex-shrink-0" size={20} />
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            {/* Botão de Login */}
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              <LogIn size={20} />
              {loading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          {/* Rodapé */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 text-xs">
              Sistema seguro de custódia e verificação de documentos
            </p>
            <p className="text-center text-gray-500 text-xs mt-2">
              Lei nº 3/2017 — Transações Eletrônicas de Moçambique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
              }
