import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Loader2, Building2, Mail, Lock, AlertTriangle } from 'lucide-react';

const LoginPage = () => {
  const [mode, setMode] = useState('institution');
  const [form, setForm] = useState({ id: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expired = searchParams.get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'institution') {
        await login(form.id, form.password);
      } else {
        await adminLogin(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.normalizedMessage || 'Erro de autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mx-auto">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Txeka Ntiyiso</h1>
          <p className="text-sm text-slate-500">Portal de Certificação Digital</p>
        </div>

        {expired && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            Sessão expirada. Por favor, autentique-se novamente.
          </div>
        )}

        <div className="flex p-1 rounded-xl bg-black/20 border border-white/[0.05]">
          <button
            onClick={() => { setMode('institution'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'institution' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Instituição
          </button>
          <button
            onClick={() => { setMode('admin'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Administrador
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'institution' ? (
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
                ID da Instituição
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value.toUpperCase() })}
                  placeholder="Ex: CFN"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/[0.06] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm font-mono uppercase"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@txeka.co.mz"
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/[0.06] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/[0.06] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

