import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Lock, Building2, Loader2, 
  Globe, Server, Fingerprint 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../utils/validation';

/* === LOGO SVG EXATO — Escudo metálico com padrão ciano neon === */
const LogoTxeka = ({ className = "w-20 h-20" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="metal" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="35%" stopColor="#f8fafc" />
        <stop offset="65%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="cyan-neon" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="50%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#00b8cc" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Escudo externo metálico */}
    <path 
      d="M50 4 L88 18 L84 66 L50 92 L16 66 L12 18 Z" 
      fill="url(#metal)" 
      stroke="#334155" 
      strokeWidth="1.2"
    />
    {/* Escudo interno (fundo escuro) */}
    <path 
      d="M50 12 L80 23 L77 62 L50 84 L23 62 L20 23 Z" 
      fill="#0a1929" 
      stroke="url(#cyan-neon)" 
      strokeWidth="1"
    />
    {/* Padrão geométrico ciano — hexágonos/rosácea */}
    <path 
      d="M50 22 L64 34 L64 52 L50 64 L36 52 L36 34 Z" 
      fill="none" 
      stroke="url(#cyan-neon)" 
      strokeWidth="0.8"
      filter="url(#glow)"
    />
    <path 
      d="M50 28 L58 36 L58 48 L50 56 L42 48 L42 36 Z" 
      fill="none" 
      stroke="url(#cyan-neon)" 
      strokeWidth="0.6"
      opacity="0.8"
    />
    {/* Círculo central — "olho" */}
    <circle cx="50" cy="43" r="10" fill="none" stroke="url(#cyan-neon)" strokeWidth="1" filter="url(#glow)" />
    <circle cx="50" cy="43" r="5" fill="url(#cyan-neon)" opacity="0.9" />
    <circle cx="50" cy="43" r="2.5" fill="#0a1929" />
    {/* Linhas de energia */}
    <path d="M50 12 L50 22" stroke="url(#cyan-neon)" strokeWidth="0.5" opacity="0.6" />
    <path d="M50 64 L50 84" stroke="url(#cyan-neon)" strokeWidth="0.5" opacity="0.6" />
    <path d="M20 23 L36 34" stroke="url(#cyan-neon)" strokeWidth="0.5" opacity="0.6" />
    <path d="M80 23 L64 34" stroke="url(#cyan-neon)" strokeWidth="0.5" opacity="0.6" />
    <path d="M23 62 L36 52" stroke="url(#cyan-neon)" strokeWidth="0.5" opacity="0.6" />
    <path d="M77 62 L64 52" stroke="url(#cyan-neon)" strokeWidth="0.5" opacity="0.6" />
  </svg>
);

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
      
      {/* Malha cibernética sutil */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,229,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.35) 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem'
        }}
      />

      {/* Glow difuso adaptativo */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] rounded-full blur-[140px] opacity-25 transition-all duration-1000 ${institutionProfile.bg.replace('/15', '/20')}`} />

      <div className="relative z-10 w-full max-w-[26rem] mx-4">
        
        <div className={`relative bg-[#0d2137]/45 backdrop-blur-2xl border border-white/[0.06] rounded-2xl overflow-hidden transition-shadow duration-700 ${institutionProfile.glow}`}>
          
          {/* Faixa superior ciano */}
          <div className="h-[2px] w-full bg-gradient-to-r from-[#00e5ff] via-[#2dd4bf] to-[#00b8cc]" />
          
          <div className="p-8 space-y-6">
            
            {/* === CABEÇALHO COM LOGO EXATO === */}
            <div className="text-center space-y-4">
              {/* Logo SVG Escudo Metálico */}
              <div className="relative mx-auto w-[5rem] h-[5rem]">
                <div className="absolute inset-0 rounded-2xl bg-[#00e5ff]/10 blur-xl scale-125" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <LogoTxeka className="w-full h-full drop-shadow-[0_0_15px_rgba(0,229,255,0.35)]" />
                </div>
                {/* Badge online */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[2.5px] border-[#0d2137] shadow-lg">
                  <div className="w-full h-full rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Txeka Ntiyiso — Cores exatas da imagem */}
              <div className="space-y-0.5">
                <h1 className="text-[2rem] font-extrabold text-txeka leading-none tracking-tight">
                  Txeka
                </h1>
                <h2 className="text-[1.65rem] font-light text-ntiyiso leading-none tracking-wide">
                  Ntiyiso
                </h2>
              </div>
              <p className="text-[0.6rem] text-silver-dark/60 uppercase tracking-[0.3em] font-medium">
                Plataforma de Validação Digital
              </p>

              {/* Badge dinâmico */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${institutionProfile.bg} ${institutionProfile.border}`}>
                <ProfileIcon className={`w-3.5 h-3.5 ${institutionProfile.color}`} />
                <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${institutionProfile.color}`}>
                  {institutionProfile.label}
                </span>
              </div>
            </div>

            <div className="h-px bg-white/[0.05]" />

            {/* Formulário */}
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
                    className="w-full pl-10 pr-4 py-3 bg-black/15 border border-white/[0.06] rounded-xl text-[#f8fafc] placeholder-silver-dark/30 focus:outline-none focus:border-[#00e5ff]/30 focus:ring-1 focus:ring-[#00e5ff]/8 transition-all duration-300 font-medium tracking-wider text-sm"
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
                    className="w-full pl-10 pr-11 py-3 bg-black/15 border border-white/[0.06] rounded-xl text-[#f8fafc] placeholder-silver-dark/30 focus:outline-none focus:border-[#00e5ff]/30 focus:ring-1 focus:ring-[#00e5ff]/8 transition-all duration-300 font-mono text-sm tracking-widest"
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
                className="w-full relative overflow-hidden group bg-[#00e5ff] hover:bg-[#33eaff] text-[#080f1a] font-bold py-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,229,255,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm uppercase tracking-wider"
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

            {/* Rodapé */}
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
          Txeka Ntiyiso — Infraestrutura Nacional de Validação criptografica de Documentos Digital
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

