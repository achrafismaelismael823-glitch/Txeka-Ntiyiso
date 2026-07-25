import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Lock, Building2, Loader2, 
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
      color: 'text-[#2dd4bf]', 
      bg: 'bg-[#2dd4bf]/10', 
      border: 'border-[#2dd4bf]/30', 
      icon: Fingerprint,
      glow: 'shadow-[0_0_30px_rgba(45,212,191,0.15)]'
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
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem'
        }}
      />

      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] rounded-full blur-[140px] opacity-20 transition-all duration-1000 ${institutionProfile.bg.replace('/15', '/20')}`} />

      <div className="relative z-10 w-full max-w-[26rem] mx-4">
        
        <div className={`relative bg-[#0d2137]/45 backdrop-blur-2xl border border-white/[0.05] rounded-2xl overflow-hidden transition-shadow duration-700 ${institutionProfile.glow}`}>
          
          <div className="h-[2px] w-full bg-gradient-to-r from-[#06b6d4] via-[#2dd4bf] to-[#22d3ee]" />
          
          <div className="p-8 space-y-6">
            
            <div className="text-center space-y-4">
              
              <div className="relative mx-auto w-[14rem]">
                <div className="absolute inset-0 bg-[#06b6d4]/10 blur-2xl rounded-full" />
                <img 
                  src="/images/txeka-logo-dark.png" 
                  alt="Txeka Ntiyiso — Infraestrutura Tecnológica de Verificação da Integridade e Autenticidade Documental" 
                  className="relative w-full h-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                  draggable={false}
                />
              </div>

              <p className="text-[0.6rem] text-silver-dark/50 uppercase tracking-[0.25em] font-medium leading-relaxed max-w-[16rem] mx-auto">
                Infraestrutura Tecnológica de Verificação da Integridade e Autenticidade Documental
              </p>

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${institutionProfile.bg} ${institutionProfile.border}`}>
                <ProfileIcon className={`w-3.5 h-3.5 ${institutionProfile.color}`} />
                <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${institutionProfile.color}`}>
                  {institutionProfile.label}
                </span>
              </div>
            </div>

            <div className="h-px bg-white/[0.05]" />

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-silver-dark/80 uppercase tracking-[0.15em] ml-1">
                  ID da Instituição
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 className="w-[1.1rem] h-[1.1rem] text-silver-dark/50 group-focus-within:text-[#2dd4bf] transition-colors duration-300" />
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value.toUpperCase())}
                    placeholder="Ex: INAGE"
                    className="w-full pl-10 pr-4 py-3 bg-black/15 border border-white/[0.05] rounded-xl text-[#f8fafc] placeholder-silver-dark/30 focus:outline-none focus:border-[#06b6d4]/30 focus:ring-1 focus:ring-[#06b6d4]/8 transition-all duration-300 font-medium tracking-wider text-sm"
                  />
                  {institutionId.length >= 2 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className={`text-[0.55rem] font-bold uppercase px-1.5 py-0.5 rounded-md ${institutionProfile.bg} ${institutionProfile.color} border ${institutionProfile.border}`}>
                        {institutionProfile.type}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-silver-dark/80 uppercase tracking-[0.15em] ml-1">
                  Senha de Acesso
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-[1.1rem] h-[1.1rem] text-silver-dark/50 group-focus-within:text-[#2dd4bf] transition-colors duration-300" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-black/15 border border-white/[0.05] rounded-xl text-[#f8fafc] placeholder-silver-dark/30 focus:outline-none focus:border-[#06b6d4]/30 focus:ring-1 focus:ring-[#06b6d4]/8 transition-all duration-300 font-mono text-sm tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-silver-dark/40 hover:text-silver transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[1.1rem] h-[1.1rem]" /> : <Eye className="w-[1.1rem] h-[1.1rem]" />}
                  </button>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-red-500/[0.05] border border-red-500/15 space-y-1.5 animate-fade-in">
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400/80 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !institutionId.trim() || !password.trim()} 
                className="w-full relative overflow-hidden group bg-[#06b6d4] hover:bg-[#22d3ee] text-[#080f1a] font-bold py-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm uppercase tracking-wider"
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
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-white/30 skew-x-12" />
              </button>
            </form>

            <div className="pt-2 text-center space-y-3">
              <p className="text-[0.6rem] text-silver-dark/40 leading-relaxed">
                Acesso restrito a instituições certificadas.<br />
                Todas as tentativas são registadas nos logs de auditoria.
              </p>
              <div className="flex items-center justify-center gap-2.5 text-[0.55rem] text-silver-dark/25 uppercase tracking-[0.15em]">
                <span>SSL 256-bit</span>
                <span className="w-1 h-1 rounded-full bg-silver-dark/15" />
                <span>Lei n.º 3/2017</span>
                <span className="w-1 h-1 rounded-full bg-silver-dark/15" />
                <span>ISO 27001</span>
              </div>
            </div>

          </div>
        </div>

        <p className="text-center text-[0.55rem] text-silver-dark/20 mt-5 tracking-[0.2em] uppercase font-medium">
          Txeka Ntiyiso v2.0.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

