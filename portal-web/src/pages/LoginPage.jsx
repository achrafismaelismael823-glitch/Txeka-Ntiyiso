import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Lock, Building2, Mail, Loader2, 
  Globe, Server, Fingerprint, ShieldCheck, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();

  // Detecta se é admin (email) ou instituição (ID)
  const isAdmin = useMemo(() => identifier.includes('@'), [identifier]);

  const institutionProfile = useMemo(() => {
    if (isAdmin) {
      return { 
        type: 'ADMIN', 
        label: 'Administrador do Sistema', 
        color: 'text-purple-400', 
        bg: 'bg-purple-500/15', 
        border: 'border-purple-500/30', 
        icon: ShieldCheck,
        glow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
        placeholder: 'admin@txeka.co.mz'
      };
    }
    const id = identifier.toLowerCase();
    if (id.includes('gov') || id.includes('min') || id.includes('dnt') || id.includes('inage')) {
      return { 
        type: 'B2G', label: 'Nó Governamental', color: 'text-emerald-400', 
        bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', 
        icon: Server, glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
        placeholder: 'Ex: INAGE'
      };
    }
    if (id.includes('banc') || id.includes('bank') || id.includes('std') || id.includes('bim')) {
      return { 
        type: 'B2B', label: 'Nó Bancário', color: 'text-amber-400', 
        bg: 'bg-amber-500/15', border: 'border-amber-500/30', 
        icon: Globe, glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
        placeholder: 'Ex: STANDARD'
      };
    }
    return { 
      type: 'B2B', label: 'Nó Corporativo', color: 'text-[#2dd4bf]', 
      bg: 'bg-[#2dd4bf]/10', border: 'border-[#2dd4bf]/30', 
      icon: Fingerprint, glow: 'shadow-[0_0_30px_rgba(45,212,191,0.15)]',
      placeholder: 'Ex: EMPRESA123'
    };
  }, [identifier, isAdmin]);

  const ProfileIcon = institutionProfile.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    // Validação CLIENT-SIDE antes de bater na API
    const validationErrors = [];
    if (!identifier.trim()) {
      validationErrors.push(isAdmin ? 'Email é obrigatório' : 'ID da Instituição é obrigatório');
    }
    if (!password.trim()) {
      validationErrors.push('Senha é obrigatória');
    }
    if (password.trim().length < 4) {
      validationErrors.push('Senha deve ter pelo menos 4 caracteres');
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      let result;

      if (isAdmin) {
        result = await adminLogin(identifier.trim(), password);
        // Só redireciona se NÃO houve erro (chegou aqui = sucesso)
        navigate('/audit');
      } else {
        result = await login(identifier.trim().toUpperCase(), password);
        // Só redireciona se NÃO houve erro
        navigate('/');
      }

    } catch (err) {
      // AQUI é onde apanhamos erros reais da API
      console.error('Erro de login:', err);
      
      let msg = 'Credenciais inválidas ou conta inativa';
      
      if (err.response) {
        // Erro HTTP da API (4xx, 5xx)
        if (err.response.status === 401) {
          msg = 'Credenciais inválidas — verifique email/ID e senha';
        } else if (err.response.status === 403) {
          msg = 'Conta suspensa ou sem permissão — contacte o administrador';
        } else if (err.response.status === 422) {
          const detail = err.response.data?.detail?.[0]?.msg;
          msg = detail || 'Dados inválidos enviados';
        } else if (err.response.status >= 500) {
          msg = 'Erro no servidor — tente novamente mais tarde';
        }
      } else if (err.request) {
        // Sem resposta do servidor (offline, CORS, etc.)
        msg = 'Servidor indisponível — verifique a conexão';
      } else if (err.message) {
        msg = err.message;
      }

      setErrors([msg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-brand-fundo">
      
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
        backgroundSize: '4rem 4rem'
      }} />

      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] rounded-full blur-[140px] opacity-20 transition-all duration-1000 ${institutionProfile.bg.replace('/15', '/20')}`} />

      <div className="relative z-10 w-full max-w-[26rem] mx-4">
        
        <div className={`relative bg-[#0d2137]/45 backdrop-blur-2xl border border-white/[0.05] rounded-2xl overflow-hidden transition-shadow duration-700 ${institutionProfile.glow}`}>
          
          <div className="h-[2px] w-full bg-gradient-to-r from-[#06b6d4] via-[#2dd4bf] to-[#22d3ee]" />
          
          <div className="p-8 space-y-6">
            
            {/* Logo */}
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-[14rem]">
                <div className="absolute inset-0 bg-[#06b6d4]/10 blur-2xl rounded-full" />
                <img src="/images/txeka-logo-dark.png" alt="Txeka Ntiyiso" className="relative w-full h-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]" draggable={false} />
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

            {/* ERROS — agora aparecem mesmo! */}
            {errors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 space-y-2 animate-fade-in">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-400/90 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-silver-dark/80 uppercase tracking-[0.15em] ml-1">
                  {isAdmin ? 'Email Administrativo' : 'ID da Instituição'}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    {isAdmin ? (
                      <Mail className="w-[1.1rem] h-[1.1rem] text-silver-dark/50 group-focus-within:text-purple-400 transition-colors duration-300" />
                    ) : (
                      <Building2 className="w-[1.1rem] h-[1.1rem] text-silver-dark/50 group-focus-within:text-[#2dd4bf] transition-colors duration-300" />
                    )}
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={institutionProfile.placeholder}
                    className="w-full pl-10 pr-4 py-3 bg-black/15 border border-white/[0.05] rounded-xl text-[#f8fafc] placeholder-silver-dark/30 focus:outline-none focus:border-[#06b6d4]/30 focus:ring-1 focus:ring-[#06b6d4]/8 transition-all duration-300 font-medium tracking-wider text-sm"
                  />
                  {identifier.length >= 2 && (
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-silver-dark/40 hover:text-silver transition-colors">
                    {showPassword ? <EyeOff className="w-[1.1rem] h-[1.1rem]" /> : <Eye className="w-[1.1rem] h-[1.1rem]" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !identifier.trim() || !password.trim()} 
                className="w-full relative overflow-hidden group bg-[#06b6d4] hover:bg-[#22d3ee] text-[#080f1a] font-bold py-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm uppercase tracking-wider"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />A autenticar...</>
                  ) : (
                    <><Fingerprint className="w-4 h-4" />{isAdmin ? 'Entrar como Admin' : 'Entrar no Portal'}</>
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-white/30 skew-x-12" />
              </button>
            </form>

            <div className="pt-2 text-center space-y-3">
              <p className="text-[0.6rem] text-silver-dark/40 leading-relaxed">
                Acesso restrito a instituições certificadas e administradores.<br />
                Todas as tentativas são registadas em auditoria.
              </p>
              <div className="flex items-center justify-center gap-2.5 text-[0.55rem] text-silver-dark/25 uppercase tracking-[0.15em]">
                <span>SSL 256-bit</span><span className="w-1 h-1 rounded-full bg-silver-dark/15" />
                <span>Lei n.º 3/2017</span><span className="w-1 h-1 rounded-full bg-silver-dark/15" />
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

