import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, WifiOff, ServerOff, UserCog, Building } from 'lucide-react';
import { login, loginAdmin } from '../services/auth';

export default function LoginPage() {
  const [loginType, setLoginType] = useState('institution');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (attempts >= 5) {
      setIsLocked(true);
      setLockTimer(30);
    }
  }, [attempts]);

  useEffect(() => {
    if (isLocked && lockTimer > 0) {
      const interval = setInterval(() => {
        setLockTimer(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, lockTimer]);

  const getErrorIcon = (code) => {
    if (code === 'NETWORK' || code === 'OFFLINE') return <WifiOff className="h-5 w-5 text-rose-500" />;
    if (code === 'TIMEOUT' || code === 'SERVER_ERROR' || code === 'SERVICE_DOWN') return <ServerOff className="h-5 w-5 text-amber-500" />;
    return <AlertCircle className="h-5 w-5 text-rose-500" />;
  };

  const getErrorStyle = (type) => {
    if (type === 'warning') return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-rose-50 border-rose-200 text-rose-700';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setIsLoading(true);
    setError(null);

    try {
      if (loginType === 'admin') {
        await loginAdmin(identifier, password);
      } else {
        await login(identifier, password);
      }
      setAttempts(0);
      navigate('/dashboard');
    } catch (err) {
      setAttempts(prev => prev + 1);
      const translated = err.translated || { code: 'UNKNOWN', message: err.message || 'Erro inesperado', type: 'error' };
      setError(translated);
      console.error('[Login Error]', translated.code, translated.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholder = () => {
    if (loginType === 'admin') return 'ex: admin@txeka.co.mz';
    return 'ex: INAGE';
  };

  const getLabel = () => {
    if (loginType === 'admin') return 'Email de Administrador';
    return 'ID da Instituicao';
  };

  const getIcon = () => {
    if (loginType === 'admin') return <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />;
    return <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />;
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
            Custodia de Autenticidade Digital
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-2xl">
          {/* Toggle Admin / Institution */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setLoginType('institution'); setIdentifier(''); setError(null); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${loginType === 'institution' ? 'bg-white text-[#0B192C] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Building className="h-4 w-4" /> Instituicao
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('admin'); setIdentifier(''); setError(null); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${loginType === 'admin' ? 'bg-white text-[#0B192C] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserCog className="h-4 w-4" /> Administrador
            </button>
          </div>

          {isLocked && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5 flex items-center gap-3">
              <Lock className="h-5 w-5 text-rose-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-700">Conta temporariamente bloqueada</p>
                <p className="text-xs text-rose-600">Muitas tentativas falhadas. Aguarde {lockTimer}s.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{getLabel()}</label>
              <div className="relative">
                {getIcon()}
                <input
                  type={loginType === 'admin' ? 'email' : 'text'}
                  required
                  placeholder={getPlaceholder()}
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
                  disabled={isLocked || isLoading}
                  className={`w-full bg-slate-50 border text-slate-900 text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none transition ${error?.code === 'VALIDATION' ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#00D2C4]'}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  disabled={isLocked || isLoading}
                  className={`w-full bg-slate-50 border text-slate-900 text-sm rounded-2xl pl-12 pr-12 py-4 focus:outline-none transition ${error?.code === 'VALIDATION' ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#00D2C4]'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className={`border rounded-xl p-3 flex items-center gap-3 ${getErrorStyle(error.type)}`}>
                {getErrorIcon(error.code)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{error.message}</p>
                  {attempts > 0 && attempts < 5 && (
                    <p className="text-xs opacity-70 mt-0.5">Tentativa {attempts}/5</p>
                  )}
                </div>
              </div>
            )}

            <button type="submit" disabled={isLocked || isLoading}
              className="w-full bg-[#0B192C] hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Autenticando...</span>
                </>
              ) : isLocked ? (
                <>
                  <Lock className="w-5 h-5" />
                  <span className="text-sm">Bloqueado ({lockTimer}s)</span>
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
              Sistema de Custodia Digital — Republica de Mocambique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

