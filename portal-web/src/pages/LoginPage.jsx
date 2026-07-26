import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { ShieldCheck, Building2, User, Eye, EyeOff, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const { login, adminLogin } = useContext(AuthContext);
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [mode, setMode] = useState('institution'); // 'institution' | 'admin'
  const [institutionId, setInstitutionId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'institution') {
        await login(institutionId.trim(), password);
        notify('Sessão iniciada com sucesso', 'success');
      } else {
        await adminLogin(email.trim(), password);
        notify('Sessão de administrador iniciada', 'success');
      }
      navigate(from, { replace: true });
    } catch (err) {
      notify(err.normalizedMessage || 'Credenciais inválidas', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Txeka Ntiyiso</h1>
            <p className="text-sm text-slate-500">Plataforma de Certificação Blockchain</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          <button
            type="button"
            onClick={() => setMode('institution')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'institution'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Instituição
          </button>
          <button
            type="button"
            onClick={() => setMode('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'admin'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            Administrador
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {mode === 'institution' ? 'ID da Instituição' : 'Email'}
            </label>
            <div className="relative">
              {mode === 'institution' ? (
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              ) : (
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              )}
              <input
                type={mode === 'institution' ? 'text' : 'email'}
                value={mode === 'institution' ? institutionId : email}
                onChange={(e) => mode === 'institution' ? setInstitutionId(e.target.value) : setEmail(e.target.value)}
                placeholder={mode === 'institution' ? 'Ex: CFN, ISTN' : 'admin@txeka.co.mz'}
                className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Palavra-passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          {mode === 'institution'
            ? 'Utilize as credenciais fornecidas pelo administrador'
            : 'Acesso restrito à equipa de gestão'}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

