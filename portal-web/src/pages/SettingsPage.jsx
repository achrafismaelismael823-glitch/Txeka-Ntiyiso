import React, { useState, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  Settings, Key, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  Copy, Check, Eye, EyeOff, ShieldCheck
} from 'lucide-react';

const SettingsPage = () => {
  const { user, isAdmin } = useAuth();
  const { notify } = useContext(NotificationContext);
  const [loadingKey, setLoadingKey] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRegenerateKey = async () => {
    if (!window.confirm('Tem a certeza? A chave anterior deixará de funcionar imediatamente.')) return;
    try {
      setLoadingKey(true);
      const { data } = await endpoints.institutions.regenerateApiKey(user?.id);
      setApiKey(data.api_key || data.new_api_key);
      notify('API Key regenerada com sucesso', 'success');
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao regenerar chave', 'error');
    } finally {
      setLoadingKey(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Configurações</h1>
        <p className="text-xs text-slate-500 mt-1">Gestão de credenciais e segurança</p>
      </div>

      {/* Dados da conta */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.05]">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Dados da Conta</h3>
            <p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : 'Instituição'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[0.6rem] text-slate-500 uppercase tracking-wider">ID / Email</label>
            <p className="text-sm text-slate-200 font-mono">{user?.id || user?.email || '—'}</p>
          </div>
          <div className="space-y-1">
            <label className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Nome</label>
            <p className="text-sm text-slate-200">{user?.name || '—'}</p>
          </div>
          <div className="space-y-1">
            <label className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Plano</label>
            <p className="text-sm text-slate-200 capitalize">{user?.subscription_plan || 'Standard'}</p>
          </div>
          <div className="space-y-1">
            <label className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Estado</label>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user?.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <p className="text-sm text-slate-200 capitalize">{user?.status || 'active'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Key */}
      {!isAdmin && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.05]">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">API Key</h3>
              <p className="text-xs text-slate-500">Chave de acesso B2B à API</p>
            </div>
          </div>

          {apiKey ? (
            <div className="p-4 rounded-xl bg-black/20 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Guarde esta chave — só é mostrada uma vez</span>
              </div>
              <div className="flex items-center gap-2">
                <code className={`flex-1 text-xs font-mono text-slate-300 break-all ${!showKey ? 'blur-sm select-none' : ''}`}>
                  {apiKey}
                </code>
                <button onClick={() => setShowKey(!showKey)} className="p-2 text-slate-500 hover:text-slate-300">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => handleCopy(apiKey)} className="p-2 text-slate-500 hover:text-slate-300">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
              <p className="text-sm text-slate-500 mb-3">A chave só é revelada após regeneração por segurança.</p>
              <button
                onClick={handleRegenerateKey}
                disabled={loadingKey}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-xl transition-all text-sm font-medium"
              >
                {loadingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Regenerar API Key
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

