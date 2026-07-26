import React, { useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  Users, Loader2, AlertTriangle, Plus, Search, X, CheckCircle2,
  XCircle, Key, RotateCcw, CreditCard, ChevronDown, ChevronUp
} from 'lucide-react';

const InstitutionsPage = () => {
  const { notify } = useContext(NotificationContext);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    contact_email: '',
    credits: 0,
    subscription_plan: 'standard',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/v1/institutions?limit=500');
      setInstitutions(data.institutions || []);
    } catch {
      setError('Erro ao carregar instituições');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/v1/institutions', {
        ...formData,
        id: formData.id.toUpperCase(),
      });
      notify('Instituição criada com sucesso', 'success');
      setShowCreate(false);
      setFormData({
        id: '',
        name: '',
        contact_email: '',
        credits: 0,
        subscription_plan: 'standard',
      });
      fetchInstitutions();
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao criar', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id, current) => {
    const next = current === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/api/v1/institutions/${id}`, { status: next });
      fetchInstitutions();
      notify(`Status alterado para ${next}`, 'success');
    } catch {
      notify('Erro ao actualizar status', 'error');
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm('Resetar senha desta instituição?')) return;
    try {
      await api.post(`/api/v1/institutions/${id}/reset-password`);
      notify('Senha resetada com sucesso', 'success');
    } catch {
      notify('Erro ao resetar senha', 'error');
    }
  };

  const handleRegenerateApiKey = async (id) => {
    if (!window.confirm('Regenerar API Key? A anterior deixará de funcionar.')) return;
    try {
      await api.post(`/api/v1/institutions/${id}/regenerate-api-key`);
      notify('API Key regenerada', 'success');
    } catch {
      notify('Erro ao regenerar API Key', 'error');
    }
  };

  const filtered = institutions.filter((i) =>
    (i.id + i.name + (i.contact_email || '')).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Instituições</h1>
          <p className="text-xs text-slate-500 mt-1">Gestão de nós certificados</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Instituição
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="w-full pl-10 pr-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((inst) => (
          <div
            key={inst.id}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden"
          >
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => setExpanded(expanded === inst.id ? null : inst.id)}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  inst.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100 truncate">{inst.name}</h3>
                  <span className="text-[0.6rem] font-mono text-slate-500 uppercase bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.05]">
                    {inst.id}
                  </span>
                </div>
                <p className="text-[0.65rem] text-slate-500 truncate">{inst.contact_email}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  {inst.credits || 0}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {inst.docs_emitted_month || 0}
                </span>
                {expanded === inst.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {expanded === inst.id && (
              <div className="px-5 pb-4 border-t border-white/[0.03] pt-3 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5">
                    <p className="text-[0.6rem] text-slate-500 uppercase">Plano</p>
                    <p className="font-medium text-slate-100 capitalize">{inst.subscription_plan}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5">
                    <p className="text-[0.6rem] text-slate-500 uppercase">Status</p>
                    <p
                      className={`font-medium capitalize ${
                        inst.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {inst.status}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5">
                    <p className="text-[0.6rem] text-slate-500 uppercase">Aprovado</p>
                    <p className="font-medium text-slate-100">{inst.approved ? 'Sim' : 'Não'}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5">
                    <p className="text-[0.6rem] text-slate-500 uppercase">API Key</p>
                    <p className="font-mono text-[0.6rem] text-slate-400 truncate">
                      {inst.api_key?.substring(0, 12)}...
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleToggleStatus(inst.id, inst.status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      inst.status === 'active'
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {inst.status === 'active' ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {inst.status === 'active' ? 'Suspender' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleResetPassword(inst.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resetar Senha
                  </button>
                  <button
                    onClick={() => handleRegenerateApiKey(inst.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Regenerar API Key
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Nenhuma instituição encontrada</p>
          </div>
        )}
      </div>

      {/* Modal Criar */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Nova Instituição</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
                  ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                  placeholder="Ex: CFN"
                  className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da instituição"
                  className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contacto@instituicao.co.mz"
                  className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
                    Créditos Iniciais
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
                    Plano
                  </label>
                  <select
                    value={formData.subscription_plan}
                    onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all disabled:opacity-30 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Criar Instituição</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionsPage;

