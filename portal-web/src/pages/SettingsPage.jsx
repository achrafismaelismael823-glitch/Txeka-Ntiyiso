import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Settings, User, Bell, Shield, Save } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-silver-light">Configurações</h1>
        <p className="text-sm text-silver-dark mt-1">Gerencie preferências da sua conta</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-tn-500/20">
          <div className="w-14 h-14 rounded-full bg-cyan/10 flex items-center justify-center border border-cyan/30">
            <User className="w-7 h-7 text-cyan" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-silver-light">{user?.name || user?.id}</h3>
            <p className="text-sm text-silver-dark">{user?.contact_email || 'Sem email'}</p>
            <span className="badge badge-info mt-1 capitalize">{user?.role || 'Instituição'}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-silver flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan" /> Segurança
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-silver-dark mb-1">ID da Instituição</label>
              <input disabled value={user?.id || ''} className="input-field opacity-60" />
            </div>
            <div>
              <label className="block text-xs text-silver-dark mb-1">Plano</label>
              <input disabled value={user?.subscription_plan || 'standard'} className="input-field opacity-60" />
            </div>
          </div>
        </div>

        <div className="h-px bg-tn-500/30" />

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-silver flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan" /> Notificações
          </h4>
          <div className="flex items-center justify-between p-3 rounded-lg bg-tn-800/50">
            <div>
              <p className="text-sm text-silver-light">Alertas de créditos baixos</p>
              <p className="text-xs text-silver-dark">Receba avisos quando o saldo estiver baixo</p>
            </div>
            <div className="w-11 h-6 bg-cyan rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-tn-900 rounded-full" />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button disabled className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed">
            <Save className="w-4 h-4" /> Guardar Alterações
          </button>
          <p className="text-xs text-silver-dark mt-2">* Edição de perfil disponível via API administrativa</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

