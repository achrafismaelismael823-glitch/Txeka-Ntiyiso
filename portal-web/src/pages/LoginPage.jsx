import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Eye, EyeOff, Lock, Building2, Loader2, 
  Globe, Server, Fingerprint 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../utils/validation';

const LoginPage = () => {
  const [institutionId, setInstitutionId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const institutionProfile = useMemo(() => {
    const id = institutionId.toLowerCase();
    if (id.includes('gov') || id.includes('min') || id.includes('dnt') || id.includes('inage')) {
      return { 
        type: 'B2G', 
        label: 'Nó Governamental', 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-500/15', 
        border: 'border-emerald-500/30', 
        icon: Server,
        glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]'
      };
    }
    if (id.includes('banc') || id.includes('bank') || id.includes('std') || id.includes('bim')) {
      return { 
        type: 'B2B', 
        label: 'Nó Bancário', 
        color: 'text-amber-400', 
        bg: 'bg-amber-500/15', 
        border: 'border-amber-500/30', 
        icon: Globe,
        glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]'
      };
    }
    return { 
      type: 'B2B', 
      label: 'Nó Corporativo', 
      color: 'text-cyan', 
      bg: 'bg-cyan/10', 
      border: 'border-cyan/30', 
      icon: Fingerprint,
      glow: 'shadow-[0_0_30px_rgba(0,229,255,0.15)]'
    };
  }, [institutionId]);

  const ProfileIcon = institutionProfile.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    const validationErrors = validateLoginForm(institutionId, password);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await login(institutionId, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail?.[0]?.msg || 'Credenciais inválidas ou instituição inativa';
      setErrors([msg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-brand-fundo">
      
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,229,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.4) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem'
        }}
      />

      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-[120px] opacity-30 transition-all duration-1000 ${institutionProfile.bg.replace('/15', '/20')}`} />

      <div className="relative z-10 w-full max-w-[26rem] mx-4">
        
        <div className={`relative bg-[#0d2137]/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden transition-shadow duration-700 ${institutionProfile.glow}`}>
          
          <div className="h-[2px] w-full bg-cyan-gradient" />
          
          <div className="p-8 space-y-6">
            
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-[4.5rem] h-[4.5rem]">
                <div className="absolute inset-0 rounded-2xl bg-cyan/15 blur-xl scale-110" />
                <div className="relative w-full h-full rounded-2xl bg-tn-800/90 border border-cyan/40 flex items-center justify-center shadow-neon">
                  <Shield className="w-9 h-9 text-cyan drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-[2.5px] border-[#0d2137] shadow-lg">
                  <div className="w-full h-full rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              <div>
                <h1 className="text-[1.75rem] font-bold text-silver-light tracking-tight leading-none">
                  Txeka Ntiyiso
                </h1>
                <p className="text-[0.65rem] text-silver-dark mt-2 uppercase tracking-[0.25em] font-medium">
                  Plataforma de Validação Digital
                </p>
              </div>

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${institutionProfile.bg} ${institutionProfile.border}`}>
                <ProfileIcon className={`w-3.5 h-3.5 ${institutionProfile.color}`} />
                <span className={`text-[0.65rem] font-bold uppercase tracking-wider ${institutionProfile.color}`}>
                  {institutionProfile.label}
                </span>
              </div>
            </div>

            <div className="h-px bg-white/[0.06]" />

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-silver-dark uppercase tracking-[0.15em] ml-1">
                  ID da Instituição
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 className="w-[1.1rem] h-[1.1rem] text-silver-dark group-focus-within:text-cyan transition-colors duration-300" />
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value.toUpperCase())}
                    placeholder="Ex: INAGE"
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/[0.08] rounded-xl text-silver-light placeholder-silver-dark/40 focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/10 transition-all duration-300 font-medium tracking-wider text-sm"
                  />
                  {institutionId.length >= 2 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className={`text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded-md ${institutionProfile.bg} ${institutionProfile.color} border ${institutionProfile.border}`}>
                        {institutionProfile.type}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-silver-dark uppercase tracking-[0.15em] ml-1">
                  Senha de Acesso
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-[1.1rem] h-[1.1rem] text-silver-dark group-focus-within:text-cyan transition-colors duration-300" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-black/20 border border-white/[0.08] rounded-xl text-silver-light placeholder-silver-dark/40 focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/10 transition-all duration-300 font-mono text-sm tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-silver-dark/50 hover:text-silver transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[1.1rem] h-[1.1rem]" /> : <Eye className="w-[1.1rem] h-[1.1rem]" />}
                  </button>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-red-500/[0.06] border border-red-500/20 space-y-1.5 animate-fade-in">
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400/90 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !institutionId.trim() || !password.trim()} 
                className="w-full relative overflow-hidden group bg-cyan hover:bg-cyan-light text-tn-900 font-bold py-3.5 rounded-xl transition-all duration-300 hover:shadow-neon-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm uppercase tracking-wider"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      A autenticar...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      Entrar no Portal
                    </>
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-white/25 skew-x-12" />
              </button>
            </form>

            <div className="pt-2 text-center space-y-3">
              <p className="text-[0.65rem] text-silver-dark/50 leading-relaxed">
                Acesso restrito a instituições certificadas.<br />
                Todas as tentativas são registadas nos logs de auditoria.
              </p>
              <div className="flex items-center justify-center gap-2.5 text-[0.6rem] text-silver-dark/30 uppercase tracking-[0.15em]">
                <span>SSL 256-bit</span>
                <span className="w-1 h-1 rounded-full bg-silver-dark/20" />
                <span>Lei n.º 3/2017</span>
                <span className="w-1 h-1 rounded-full bg-silver-dark/20" />
                <span>ISO 27001</span>
              </div>
            </div>

          </div>
        </div>

        <p className="text-center text-[0.6rem] text-silver-dark/25 mt-5 tracking-[0.2em] uppercase font-medium">
          Txeka Ntiyiso v2.0.0 — Infraestrutura Nacional de Validação Digital
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

