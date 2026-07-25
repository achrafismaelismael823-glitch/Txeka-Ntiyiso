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

  // Detecção dinâmica de perfil institucional baseada no ID
  const institutionProfile = useMemo(() => {
    const id = institutionId.toLowerCase();
    if (id.includes('gov') || id.includes('min') || id.includes('dnt')) {
      return { type: 'B2G', label: 'Nó Governamental', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: Server };
    }
    if (id.includes('banc') || id.includes('bank') || id.includes('std') || id.includes('bim')) {
      return { type: 'B2B', label: 'Nó Bancário', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: Globe };
    }
    return { type: 'B2B', label: 'Nó Corporativo', color: 'text-cyan', bg: 'bg-cyan/10', border: 'border-cyan/30', icon: Fingerprint };
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-tn-900">
      {/* === CAMADA 1: Imagem de fundo corporativa (recepção/escritório) === */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80')` 
        }}
      />
      
      {/* === CAMADA 2: Overlay escuro profundo === */}
      <div className="absolute inset-0 bg-tn-900/80 backdrop-blur-[2px]" />

      {/* === CAMADA 3: Malha cibernética sutil === */}
      <div 
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '5rem 5rem'
        }}
      />

      {/* === CAMADA 4: Auréola de luz difusa (cor dinâmica conforme perfil) === */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full blur-[100px] opacity-20 transition-colors duration-700 ${institutionProfile.bg.replace('/15', '/30')}`} />

      {/* === CONTEÚDO CENTRAL === */}
      <div className="relative z-10 w-full max-w-[28rem] mx-4">
        
        {/* Cartão Glassmorphism Principal */}
        <div className="relative bg-tn-800/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Faixa superior ciano */}
          <div className="h-1 w-full bg-cyan-gradient" />
          
          <div className="p-8 space-y-6">
            
            {/* Cabeçalho com Logo e Identidade */}
            <div className="text-center space-y-4">
              {/* Logo 3D metálico */}
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-2xl bg-cyan/20 blur-xl" />
                <div className="relative w-full h-full rounded-2xl bg-tn-700/80 border border-cyan/30 flex items-center justify-center shadow-neon">
                  <Shield className="w-10 h-10 text-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
                </div>
                {/* Badge de status do sistema */}
                <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-tn-800 shadow-lg animate-pulse" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-silver-light tracking-tight">
                  Txeka Ntiyiso
                </h1>
                <p className="text-xs text-silver-dark mt-1 uppercase tracking-[0.2em]">
                  Plataforma de Validação Digital
                </p>
              </div>

              {/* Badge dinâmico B2G/B2B */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${institutionProfile.bg} ${institutionProfile.border} transition-all duration-500`}>
                <ProfileIcon className={`w-3.5 h-3.5 ${institutionProfile.color}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${institutionProfile.color}`}>
                  {institutionProfile.label}
                </span>
              </div>
            </div>

            {/* Separador */}
            <div className="h-px bg-white/10" />

            {/* Formulário de Autenticação */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Input: ID da Instituição */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-silver-dark uppercase tracking-wider ml-1">
                  ID da Instituição
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 className="w-5 h-5 text-silver-dark group-focus-within:text-cyan transition-colors" />
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value.toUpperCase())}
                    placeholder="Ex: INAGE"
                    className="w-full pl-11 pr-4 py-3 bg-tn-900/60 border border-white/10 rounded-xl text-silver-light placeholder-silver-dark/50 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 transition-all font-medium tracking-wide"
                  />
                  {institutionId.length >= 2 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${institutionProfile.bg} ${institutionProfile.color} border ${institutionProfile.border}`}>
                        {institutionProfile.type}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Input: Senha */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-silver-dark uppercase tracking-wider ml-1">
                  Senha de Acesso
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-silver-dark group-focus-within:text-cyan transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-tn-900/60 border border-white/10 rounded-xl text-silver-light placeholder-silver-dark/50 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 transition-all font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-silver-dark hover:text-silver transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Erros */}
              {errors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 space-y-1.5 animate-fade-in">
                  {errors.map((err, i) => (
                    <p key={i} className="text-sm text-red-400 flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Botão Entrar */}
              <button 
                type="submit" 
                disabled={loading || !institutionId.trim() || !password.trim()} 
                className="w-full relative overflow-hidden group bg-cyan hover:bg-cyan-light text-tn-900 font-bold py-3.5 rounded-xl transition-all duration-300 hover:shadow-neon-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      A autenticar...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-5 h-5" />
                      Entrar no Portal
                    </>
                  )}
                </span>
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-white/20 skew-x-12" />
              </button>
            </form>

            {/* Rodapé institucional */}
            <div className="pt-2 text-center space-y-2">
              <p className="text-[10px] text-silver-dark/60 leading-relaxed">
                Acesso restrito a instituições certificadas. 
                <br />
                Todas as tentativas são registadas nos logs de auditoria.
              </p>
              <div className="flex items-center justify-center gap-3 text-[10px] text-silver-dark/40 uppercase tracking-wider">
                <span>SSL 256-bit</span>
                <span className="w-1 h-1 rounded-full bg-silver-dark/30" />
                <span>Lei n.º 3/2017</span>
                <span className="w-1 h-1 rounded-full bg-silver-dark/30" />
                <span>ISO 27001</span>
              </div>
            </div>

          </div>
        </div>

        {/* Versão flutuante */}
        <p className="text-center text-[10px] text-silver-dark/30 mt-4 tracking-widest uppercase">
          Txeka Ntiyiso v2.0.0 — Infraestrutura Nacional de Validação Digital
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

