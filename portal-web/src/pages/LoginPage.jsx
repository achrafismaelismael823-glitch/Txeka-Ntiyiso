import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ChevronRight, Eye, EyeOff } from 'lucide-react';
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
      const success = await login(email, password);
      if (success) { navigate('/dashboard'); } 
      else { setError('Credenciais institucionais inválidas.'); }
    } catch (err) {
      setError('Falha na ligação com a rede Ntiyiso.');
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">E-mail Institucional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="email" required placeholder="utilizador@entidade.gov.mz" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#00D2C4]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Chave de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type={showPassword ? "text" : "password"} required placeholder="••••••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-[#00D2C4]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <div className="text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl">{error}</div>}

            <button type="submit" disabled={isLoading} className="w-full bg-[#0B192C] text-white font-bold text-sm rounded-2xl py-4 flex items-center justify-center gap-2 shadow-xl">
              {isLoading ? <div className="h-5 w-5 animate-spin border-2 border-white/20 border-t-white rounded-full"></div> : <>Aceder ao Painel Seguro <ChevronRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
              }
