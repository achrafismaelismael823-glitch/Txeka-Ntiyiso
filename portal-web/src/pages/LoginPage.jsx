// Página de login dual-mode: Instituição (ID+Senha) | Admin (Email+Senha)
// Integrado com AuthContext, tratamento de erros, animações

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Building2, UserCog, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, adminLogin, isAuthenticated } = useAuth();
  
  const [mode, setMode] = useState('institution'); // 'institution' | 'admin'
  const [institutionId, setInstitutionId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);

  // Se já autenticado, redirecionar
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  // Mostrar motivo do logout (sessão expirada, etc.)
  const logoutReason = searchParams.get('reason');
  useEffect(() => {
    if (logoutReason) setError({ message: logoutReason, type: 'warning' });
  }, [logoutReason]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let result;
    if (mode === 'institution') {
      result = await login(institutionId.trim().toUpperCase(), password);
    } else {
      result = await adminLogin(email.trim(), password);
    }

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError({ message: result.error, type: 'error' });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B192C] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#00D2C4] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#00D2C4] rounded-full blur-3xl" />
      </div>

      <div className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 transition-transform ${shake ? 'animate-shake' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00D2C4] rounded-2xl mb-4 shadow-lg shadow-[#00D2C4]/30">
            <ShieldCheck className="w-8 h-8 text-[#0B192C]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Txeka Ntiyiso</h1>
          <p className="text-slate-500 text-sm mt-1">Portal de Verificação Documental</p>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('institution'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'institution' ? 'bg-white text-[#0B192C] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" /> Instituição
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'admin' ? 'bg-white text-[#0B192C] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCog className="w-4 h-4" /> Administrador
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'institution' ? (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                ID da Instituição
              </label>
              <input
                type="text"
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value.toUpperCase())}
                placeholder="Ex: INAGE, UEM, CFN"
                className="w-full bg-slate-50 border border-slate-200 text-[#0B192C] text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#00D2C4] focus:ring-2 focus:ring-[#00D2C4]/20 font-semibold uppercase transition"
                disabled={loading}
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Email Administrativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@txekantiyiso.co.mz"
                className="w-full bg-slate-50 border border-slate-200 text-[#0B192C] text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#00D2C4] focus:ring-2 focus:ring-[#00D2C4]/20 transition"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-[#0B192C] text-sm rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-[#00D2C4] focus:ring-2 focus:ring-[#00D2C4]/20 transition"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
              error.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{error.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || (mode === 'institution' ? !institutionId : !email)}
            className="w-full bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0B192C]/20"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> A autenticar...</>
            ) : (
              <><ShieldCheck className="w-5 h-5" /> Entrar</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Middleware de Integridade Criptográfica — v2.0.0
          </p>
        </div>
      </div>

      {/* CSS para animação shake */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

