import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { AlertCircle, LogIn, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0B192C] to-[#1a365d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-[#0B192C] rounded-2xl mb-4">
              <ShieldCheck className="h-8 w-8 text-[#00D2C4]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0B192C] mb-1">
              Txeka Ntiyiso
            </h2>
            <p className="text-slate-500 text-sm">
              Plataforma de Verificação de Documentos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                E-mail Institucional
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#00D2C4]"
                placeholder="utilizador@entidade.gov.mz"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#00D2C4]"
                placeholder="Digite sua senha"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#0B192C] hover:bg-slate-800 text-white font-semibold text-sm py-3 px-4 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
              disabled={loading}
            >
              <LogIn size={20} />
              {loading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-500 text-xs">
              Sistema seguro de custódia e verificação de documentos
            </p>
            <p className="text-center text-slate-400 text-xs mt-2">
              Lei nº 3/2017 — Transações Eletrônicas de Moçambique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

