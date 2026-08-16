import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { endpoints } from '../services/api';
import { Settings, User, Lock, Bell, Shield, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { validatePassword } from '../utils/helpers';

const SettingsPage = () => {
  const { user, isAdmin } = useAuth();
  const { notify, success, error } = useNotification();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    documentUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  useEffect(() => {
    if (passwordData.new) {
      setPasswordStrength(validatePassword(passwordData.new));
    } else {
      setPasswordStrength(null);
    }
  }, [passwordData.new]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Implementar endpoint de atualização de perfil
      await new Promise((r) => setTimeout(r, 1000));
      success('Perfil atualizado com sucesso');
    } catch (err) {
      error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      error('As palavras-passe não coincidem');
      return;
    }
    if (passwordStrength && !passwordStrength.valid) {
      error('A palavra-passe não cumpre os requisitos mínimos');
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      success('Palavra-passe alterada com sucesso');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      error('Erro ao alterar palavra-passe');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Lock },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  if (isAdmin) {
    tabs.push({ id: 'system', label: 'Sistema', icon: Shield });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Configurações</h1>
          <p className="text-sm text-slate-500">Gerencie as preferências da sua conta</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-2xl">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm p-6 space-y-5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                Informações do Perfil
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Nome</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Alterações
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm p-6 space-y-5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Alterar Palavra-passe
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Palavra-passe atual</label>
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Nova palavra-passe</label>
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
                  />
                  {passwordStrength && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all ${level <= passwordStrength.score ? 'bg-cyan-400' : 'bg-white/[0.05]'}`}
                          />
                        ))}
                      </div>
                      <p className="text-[0.65rem] text-slate-500">
                        {passwordStrength.passed} de {passwordStrength.total} requisitos
                      </p>
                      <ul className="space-y-0.5">
                        {passwordStrength.requirements.map((req, idx) => (
                          <li key={idx} className={`text-[0.65rem] flex items-center gap-1 ${req.test ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {req.test ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-slate-600" />}
                            {req.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirmar nova palavra-passe</label>
                  <input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Alterar Palavra-passe
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'notifications' && (
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              Preferências de Notificação
            </h3>
            <div className="space-y-4">
              {[
                { key: 'emailAlerts', label: 'Alertas por email', desc: 'Receba notificações importantes sobre a sua conta' },
                { key: 'documentUpdates', label: 'Atualizações de documentos', desc: 'Notificações quando documentos são emitidos ou revogados' },
                { key: 'securityAlerts', label: 'Alertas de segurança', desc: 'Notificações sobre tentativas de login e alterações de segurança' },
                { key: 'marketingEmails', label: 'Emails de marketing', desc: 'Receba novidades e atualizações sobre o Txeka Ntiyiso' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`relative w-11 h-6 rounded-full transition-all ${notifications[item.key] ? 'bg-cyan-500' : 'bg-white/[0.08]'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifications[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'system' && isAdmin && (
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Configurações do Sistema
            </h3>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Área restrita ao administrador. Alterações afetam todo o sistema.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-slate-200">Modo de Manutenção</p>
                  <p className="text-xs text-slate-500">Ativar modo de manutenção para todos os utilizadores</p>
                </div>
                <button className="relative w-11 h-6 rounded-full bg-white/[0.08]">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white" />
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-slate-200">Registo de Auditoria</p>
                  <p className="text-xs text-slate-500">Gravar todas as ações no sistema</p>
                </div>
                <button className="relative w-11 h-6 rounded-full bg-cyan-500">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white translate-x-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;

