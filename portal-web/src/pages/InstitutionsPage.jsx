import React, { useState, useEffect, useContext } from 'react';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import {
  Building2, Plus, Loader2, Search, X, CheckCircle2, XCircle,
  RefreshCw, CreditCard, Key, Edit3, AlertTriangle
} from 'lucide-react';

const InstitutionsPage = () => {
  const { notify } = useContext(NotificationContext);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPlan, setFormPlan] = useState('standard');
  const [formStatus, setFormStatus] = useState('active');
  const [formCredits, setFormCredits] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const { data } = await endpoints.institutions.list({ limit: 200 });
      setInstitutions(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao carregar instituições', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormId('');
    setFormName('');
    setFormEmail('');
    setFormPlan('standard');
    setFormStatus('active');
    setFormCredits('');
    setModalOpen(true);
  };

  const openEdit = (inst) => {
    setEditing(inst);
    setFormId(inst.id);
    setFormName(inst.name || '');
    setFormEmail(inst.contact_email || '');
    setFormPlan(inst.subscription_plan || 'standard');
    setFormStatus(inst.status || 'active');
    setFormCredits('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formId.trim() || !formName.trim()) {
      notify('ID e Nome são obrigatórios', 'error');
      return;
    }

    const payload = {
      name: formName.trim(),
      contact_email: formEmail.trim() || undefined,
      subscription_plan: formPlan,
      status: formStatus,
    };

    try {
      setSaving(true);
      if (editing) {
        await endpoints.institutions.update(formId.trim(), payload);
        notify('Instituição actualizada', 'success');
      } else {
        await endpoints.institutions.create({
          id: formId.trim(),
          ...payload,
        });
        notify('Instituição criada', 'success');
      }

      // Adicionar créditos se preenchido
      if (formCredits && Number(formCredits) > 0) {
        await endpoints.institutions.addCredits(formId.trim(), {
          amount: Number(formCredits),
          description: 'Créditos iniciais atribuídos pelo administrador',
        });
      }

      setModalOpen(false);
      fetchInstitutions();
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao gravar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm(`Resetar password de ${id}?`)) return;
    try {
      const { data } = await endpoints.institutions.resetPassword(id);
      notify(`Password resetada: ${data.temp_password || data.message || 'OK'}`, 'success');
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao resetar password', 'error');
    }
  };

  const handleRegenerateKey = async (id) => {
    if (!window.confirm(`Regenerar API Key de ${id}?`)) return;
    try {
      const { data } = await endpoints.institutions.regenerateApiKey(id);
      notify(`Nova API Key: ${data.api_key || data.new_api_key || 'regenerada'}`, 'success');
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao regenerar chave', 'error');
    }
  };

  const filtered = institutions.filter((i) => {
    const term = search.toLowerCase();
    return (
      !term ||
      (i.id || '').toLowerCase().includes(term) ||
      (i.name || '').toLowerCase().includes(term) ||
      (i.contact_email || '').toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => <span className="font-mono text-xs text-cyan-400 uppercase">{row.id}</span>,
    },
    { key: 'name', label: 'Nome' },
    {
      key: 'contact_email',
      label: 'Email',
      render: (row) => <span className="text-xs text-slate-400">{row.contact_email || '—'}</span>,
    },
    {
      key: 'subscription_plan',
      label: 'Plano',
      render: (row) => (
        <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-white/[0.03] text-slate-300 uppercase border border-white/[0.06]">
          {row.subscription_plan}
        </span>
      ),
    },
    {
      key: 'credits',
      label: 'Créditos',
      render: (row) => <span className="font-mono text-sm text-slate-200">{row.credits ?? 0}</span>,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-xs text-slate-300 capitalize">{row.status}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Acções',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(row)}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-cyan-400 transition-colors"
            title="Editar"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleResetPassword(row.id)}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-amber-400 transition-colors"
            title="Reset Password"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleRegenerateKey(row.id)}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-purple-400 transition-colors"
            title="Regenerar API Key"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Instituições</h1>
          <p className="text-xs text-slate-500 mt-1">Gestão de entidades certificadoras</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Nova Instituição
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por ID, nome ou email..."
          className="w-full pl-10 pr-10 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={loading} emptyText="Nenhuma instituição encontrada" />
      </div>

      {/* Modal Criar/Editar */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Instituição' : 'Nova Instituição'} maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">ID da Instituição</label>
            <input
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              disabled={!!editing}
              placeholder="Ex: CFN"
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm font-mono uppercase disabled:opacity-50"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Nome</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Nome da instituição"
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Email de Contacto</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="email@instituicao.co.mz"
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Plano</label>
              <select
                value={formPlan}
                onChange={(e) => setFormPlan(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm appearance-none"
              >
                <option value="standard" className="bg-slate-900">Standard</option>
                <option value="premium" className="bg-slate-900">Premium</option>
                <option value="enterprise" className="bg-slate-900">Enterprise</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Estado</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm appearance-none"
              >
                <option value="active" className="bg-slate-900">Activo</option>
                <option value="pending" className="bg-slate-900">Pendente</option>
                <option value="suspended" className="bg-slate-900">Suspenso</option>
              </select>
            </div>
          </div>
          {!editing && (
            <div className="space-y-1">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Créditos Iniciais (opcional)</label>
              <input
                type="number"
                min="0"
                value={formCredits}
                onChange={(e) => setFormCredits(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400 hover:bg-white/[0.06] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {editing ? 'Actualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InstitutionsPage;

