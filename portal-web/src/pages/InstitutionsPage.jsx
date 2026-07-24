// Gestão de instituições — CRUD completo admin. DataTable, modal de criação/edição, ações rápidas
// Consome todos os endpoints /api/v1/institutions/*

import React, { useState, useEffect } from 'react';
import {
  listInstitutions,
  createInstitution,
  updateInstitution,
  addCredits,
  resetPassword,
  regenerateApiKey,
} from '../services/api';
import DataTable from '../components/ui/DataTable';
import {
  Building2,
  Plus,
  Edit3,
  Coins,
  Key,
  Lock,
  AlertCircle,
  X,
  Loader2,
  CheckCircle,
  Ban,
  Power,
  RotateCcw
} from 'lucide-react';

const statusBadge = (status) => {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    suspended: 'bg-rose-50 text-rose-700 border-rose-200',
    inactive: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.inactive}`}>
      {status?.toUpperCase() || '—'}
    </span>
  );
};

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modais
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'credits' | null
  const [selected, setSelected] = useState(null);

  // Form
  const [form, setForm] = useState({ id: '', name: '', contact_email: '', credits: 0, subscription_plan: 'standard' });
  const [creditAmount, setCreditAmount] = useState(10);
  const [saving, setSaving] = useState(false);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const { data } = await listInstitutions({ limit: 500 });
      setInstitutions(data?.institutions || []);
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar instituições.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const showToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createInstitution(form);
      showToast('Instituição criada com sucesso!');
      setModal(null);
      setForm({ id: '', name: '', contact_email: '', credits: 0, subscription_plan: 'standard' });
      fetchInstitutions();
    } catch (err) {
      setError(err.userMessage || 'Erro ao criar instituição.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateInstitution(selected.id, {
        name: form.name,
        contact_email: form.contact_email,
        status: form.status,
        subscription_plan: form.subscription_plan,
        approved: form.approved,
      });
      showToast('Instituição actualizada!');
      setModal(null);
      fetchInstitutions();
    } catch (err) {
      setError(err.userMessage || 'Erro ao actualizar.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await addCredits(selected.id, { amount: parseInt(creditAmount), type: 'manual_add', description: 'Adição manual via portal' });
      showToast(`${creditAmount} créditos adicionados a ${selected.name}`);
      setModal(null);
      fetchInstitutions();
    } catch (err) {
      setError(err.userMessage || 'Erro ao adicionar créditos.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (inst) => {
    if (!window.confirm(`Resetar senha de ${inst.name}?`)) return;
    try {
      await resetPassword(inst.id);
      showToast(`Senha de ${inst.name} resetada. Nova senha enviada por email.`);
    } catch (err) {
      setError(err.userMessage || 'Erro ao resetar senha.');
    }
  };

  const handleRegenerateKey = async (inst) => {
    if (!window.confirm(`Regenerar API Key de ${inst.name}? A chave antiga deixará de funcionar.`)) return;
    try {
      await regenerateApiKey(inst.id);
      showToast(`API Key de ${inst.name} regenerada.`);
    } catch (err) {
      setError(err.userMessage || 'Erro ao regenerar chave.');
    }
  };

  const openModal = (type, inst = null) => {
    setModal(type);
    setSelected(inst);
    setError(null);
    if (type === 'edit' && inst) {
      setForm({ ...inst });
    } else if (type === 'create') {
      setForm({ id: '', name: '', contact_email: '', credits: 0, subscription_plan: 'standard' });
    } else if (type === 'credits' && inst) {
      setCreditAmount(10);
    }
  };

  const columns = [
    { accessor: 'id', header: 'ID', cell: (row) => <span className="font-mono text-xs font-bold text-[#0B192C]">{row.id}</span> },
    { accessor: 'name', header: 'Nome' },
    {
      accessor: 'subscription_plan',
      header: 'Plano',
      cell: (row) => (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
          row.subscription_plan === 'premium' ? 'bg-amber-100 text-amber-700' :
          row.subscription_plan === 'enterprise' ? 'bg-violet-100 text-violet-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {row.subscription_plan?.toUpperCase()}
        </span>
      ),
    },
    { accessor: 'credits', header: 'Créditos', cell: (row) => <span className="text-sm font-bold text-[#00D2C4]">{row.credits}</span> },
    { accessor: 'docs_emitted_month', header: 'Docs/Mês', cell: (row) => <span className="text-xs text-slate-500">{row.docs_emitted_month}</span> },
    { accessor: 'status', header: 'Estado', cell: (row) => statusBadge(row.status) },
    {
      accessor: 'actions',
      header: '',
      sortable: false,
      className: 'w-48',
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); openModal('edit', row); }} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition" title="Editar">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openModal('credits', row); }} className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition" title="Créditos">
            <Coins className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleResetPassword(row); }} className="p-1.5 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition" title="Reset Senha">
            <Lock className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleRegenerateKey(row); }} className="p-1.5 hover:bg-violet-50 text-slate-400 hover:text-violet-600 rounded-lg transition" title="Nova API Key">
            <Key className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0B192C] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#00D2C4]" /> Instituições
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestão de entidades emitentes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0B192C] hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-lg"
          >
            <Plus className="w-4 h-4" /> Nova Instituição
          </button>
          <button onClick={fetchInstitutions} disabled={loading} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:border-[#00D2C4] text-slate-500 transition">
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={institutions}
        loading={loading}
        pageSize={12}
        onRowClick={(row) => openModal('edit', row)}
        emptyTitle="Nenhuma instituição registada"
        emptySubtitle="Clique em 'Nova Instituição' para começar."
      />

      {/* Modal Create/Edit */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#0B192C]">
                {modal === 'create' ? 'Nova Instituição' : 'Editar Instituição'}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">ID *</label>
                <input
                  value={form.id}
                  onChange={(e) => setForm((p) => ({ ...p, id: e.target.value.toUpperCase() }))}
                  disabled={modal === 'edit'}
                  placeholder="Ex: INAGE"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold uppercase focus:outline-none focus:border-[#00D2C4]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nome completo da instituição"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00D2C4]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Email *</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
                  placeholder="contacto@instituicao.co.mz"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00D2C4]"
                />
              </div>
              {modal === 'edit' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Estado</label>
                    <select
                      value={form.status || 'active'}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00D2C4]"
                    >
                      <option value="active">Activo</option>
                      <option value="pending">Pendente</option>
                      <option value="suspended">Suspenso</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Plano</label>
                    <select
                      value={form.subscription_plan || 'standard'}
                      onChange={(e) => setForm((p) => ({ ...p, subscription_plan: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00D2C4]"
                    >
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </>
              )}
              {modal === 'create' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Créditos Iniciais</label>
                  <input
                    type="number"
                    min={0}
                    value={form.credits}
                    onChange={(e) => setForm((p) => ({ ...p, credits: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00D2C4]"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:border-slate-300 transition">
                Cancelar
              </button>
              <button
                onClick={modal === 'create' ? handleCreate : handleUpdate}
                disabled={saving || !form.id || !form.name || !form.contact_email}
                className="flex-1 py-2.5 bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> A guardar...</> : <><CheckCircle className="w-4 h-4" /> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Créditos */}
      {modal === 'credits' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0B192C] flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#00D2C4]" /> Adicionar Créditos
              </h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold uppercase">Instituição</p>
              <p className="text-sm font-bold text-[#0B192C]">{selected.name}</p>
              <p className="text-xs text-slate-400">Saldo actual: <span className="font-bold text-[#00D2C4]">{selected.credits}</span></p>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Quantidade</label>
              <input
                type="number"
                min={1}
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-center focus:outline-none focus:border-[#00D2C4]"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:border-slate-300 transition">
                Cancelar
              </button>
              <button
                onClick={handleAddCredits}
                disabled={saving || creditAmount < 1}
                className="flex-1 py-2.5 bg-[#00D2C4] hover:bg-[#00b8b0] disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> ...</> : <><Coins className="w-4 h-4" /> Adicionar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

