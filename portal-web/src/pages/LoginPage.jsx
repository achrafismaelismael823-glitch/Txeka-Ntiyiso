import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { login } from '../services/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Falha na ligação com a rede Ntiyiso.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B192C] flex flex-col justify-center p-4 font-sans antialiased">
      <div className="relative w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 border border-[#00D2C4]/30 rounded-2xl mb-4 shadow-2xl">
            <ShieldCheck className="h-10 w-10 text-[#00D2C4]" />
          </div>
          <h1 className="text-3xl tracking-tight text-white font-sans">
            <span className="font-bold">Txeka</span>
            <span className="font-medium text-[#00D2C4]">Ntiyiso</span>
          </h1>
          <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-[0.2em] font-medium">
            Custódia de Autenticidade Digital
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ID da Instituição</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="text" required placeholder="ex: INAGE" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#00D2C4]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-[#00D2C4]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-sm">!</span>
                </div>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full bg-[#0B192C] hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Autenticando...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span className="text-sm">Aceder ao Painel Seguro</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              Sistema de Custódia Digital — República de Moçambique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
