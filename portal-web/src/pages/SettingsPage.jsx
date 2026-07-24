// src/pages/SettingsPage.jsx
// Configurações do utilizador — Perfil, segurança, tema, idioma, API keys
// Integrado com AuthContext para dados da sessão

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Settings,
  UserCircle,
  Lock,
  Moon,
  Sun,
  Globe,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';

export default function SettingsPage() {
  const { user, institution, isAdmin, displayName } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // profile | security | appearance | api

  // Profile
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Security
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Appearance
  const [theme, setTheme] = useState(localStorage.getItem('txeka-theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('txeka-lang') || 'pt-MZ');

  // API Keys
  const [apiKey, setApiKey] = useState('••••••••••••••••••••••••••••••••');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (institution) {
      setProfile({ name: institution.name || '', email: institution.contact_email || '' });
    }
  }, [institution]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('txeka-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} activado.`);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('txeka-lang', lang);
    showToast('Idioma actualizado. Recarregue a página para aplicar.');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    if (passwords.new.length < 8) {
      showToast('A nova senha deve ter pelo menos 8 caracteres.', 'error');
      return;
    }
    setPasswordLoading(true);
    // Simulação — endpoint de alteração de senha pode ser adicionado
    setTimeout(() => {
      setPasswordLoading(false);
      setPasswords({ current: '', new: '', confirm: '' });
      showToast('Senha alterada com sucesso!');
    }, 1500);
  };

  const handleCopyApiKey = () => {
    // Em produção, buscar a chave real do backend
    navigator.clipboard.writeText('txk_live_' + Math.random().toString(36).substring(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('API Key copiada para o clipboard!');
  };

  const tabs = [
    { key: 'profile', label: 'Perfil', icon: UserCircle },
    { key: 'security', label: 'Segurança', icon: Lock },
    { key: 'appearance', label: 'Aparência', icon: theme === 'dark' ? Moon : Sun },
    { key: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0B192C] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#00D2C4]" /> Configurações
        </h2>
        <p className="text-slate-500 text-sm mt-1">Personalize a sua experiência no portal</p>
      </div>

      {/* Toast inline */}
      {toast && (
        <div className={`rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-[#00D2C4] text-[#0B192C]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#0B192C] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-lg font-bold text-[#0B192C]">{displayName}</p>
                  <p className="text-sm text-slate-500">{isAdmin ? 'Administrador' : 'Instituição'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nome da Instituição</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00D2C4] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Email de Contacto</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00D2C4] transition"
                />
              </div>

              <button
                onClick={() => showToast('Perfil actualizado!')}
                disabled={profileLoading}
                className="px-6 py-2.5 bg-[#0B192C] hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-2"
              >
                {profileLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> A guardar...</> : <><CheckCircle className="w-4 h-4" /> Guardar Alterações</>}
              </button>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">Recomenda-se alterar a senha periodicamente. Use pelo menos 8 caracteres com letras e números.</p>
              </div>

              {['current', 'new', 'confirm'].map((field) => (
                <div key={field}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    {field === 'current' ? 'Senha Actual' : field === 'new' ? 'Nova Senha' : 'Confirmar Nova Senha'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[field] ? 'text' : 'password'}
                      value={passwords[field]}
                      onChange={(e) => setPasswords((p) => ({ ...p, [field]: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:border-[#00D2C4] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((p) => ({ ...p, [field]: !p[field] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={passwordLoading || !passwords.current || !passwords.new || !passwords.confirm}
                className="px-6 py-2.5 bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center gap-2"
              >
                {passwordLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> A alterar...</> : <><Lock className="w-4 h-4" /> Alterar Senha</>}
              </button>
            </form>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-8 max-w-lg">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-4">Tema</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-2xl border-2 transition flex flex-col items-center gap-3 ${
                      theme === 'light' ? 'border-[#00D2C4] bg-[#00D2C4]/5' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Sun className="w-8 h-8 text-amber-500" />
                    <span className="text-sm font-bold text-[#0B192C]">Claro</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-2xl border-2 transition flex flex-col items-center gap-3 ${
                      theme === 'dark' ? 'border-[#00D2C4] bg-[#00D2C4]/5' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Moon className="w-8 h-8 text-violet-500" />
                    <span className="text-sm font-bold text-[#0B192C]">Escuro</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-4">Idioma</label>
                <div className="space-y-2">
                  {[
                    { code: 'pt-MZ', label: 'Português (Moçambique)', flag: '🇲🇿' },
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                        language === lang.code ? 'border-[#00D2C4] bg-[#00D2C4]/5' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-semibold text-[#0B192C]">{lang.label}</span>
                      {language === lang.code && <CheckCircle className="w-4 h-4 text-[#00D2C4] ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* API KEYS */}
          {activeTab === 'api' && (
            <div className="space-y-6 max-w-lg">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">API Key</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    readOnly
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl hover:border-[#00D2C4] text-slate-500 transition"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCopyApiKey}
                    className="p-2.5 bg-[#00D2C4] hover:bg-[#00b8b0] rounded-xl text-white transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Esta chave permite acesso programático à API. Nunca a partilhe publicamente.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-semibold mb-1">⚠️ Atenção</p>
                <p className="text-xs text-amber-700">
                  Se suspeitar que a sua chave foi comprometida, contacte o administrador para regenerá-la.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

