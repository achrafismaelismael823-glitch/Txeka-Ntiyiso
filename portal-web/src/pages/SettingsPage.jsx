import React, { useState, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  Settings, ShieldCheck, Key, Mail, Building2, Calendar,
  AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';

const SettingsPage = () => {
  const { user, isAdmin, isInstitution } = useAuth();
  const { notify } = useContext(NotificationContext);
  const [showToken, setShowToken] = useState(false);

  const maskToken = (token) => {
    if (!token) return '—';
    if (showToken) return token;
    return token.substring(0, 8) + '••••••••••••••••' + token.substring(token.length - 8);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Configurações</h1>
        <p className="text-xs text-slate-500 mt-1">Dados da conta e preferências</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Perfil</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Nome</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-sm text-slate-100">
                <Building2 className="w-4 h-4 text-slate-500" />
                {user?.name || user?.id || '—'}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Tipo</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-sm text-slate-100 capitalize">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                {isAdmin ? 'Administrador' : 'Instituição'}
              </div>
            </div>
            {user?.email && (
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-sm text-slate-100">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {user.email}
                </div>
              </div>
            )}
            {user?.expires_in_days && (
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Expira em</label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-sm text-slate-100">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {user.expires_in_days} dias
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isInstitution && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Token de Acesso</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">JWT Token</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-xs font-mono text-slate-300 break-all">
                  {maskToken(user?.token)}
                </div>
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-all"
                >
                  {showToken ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <p className="text-[0.65rem] text-slate-600">
                Este token é usado para autenticação na API. Não o partilhe.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-400">Segurança</h3>
          <p className="text-xs text-slate-500 mt-1">
            Para alterar a senha, contacte o administrador da plataforma ou use a opção de recuperação no login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
