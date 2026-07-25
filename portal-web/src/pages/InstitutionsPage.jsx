import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useOutletContext } from 'react-router-dom';
import { Users, Plus, Loader2, Lock, KeyRound } from 'lucide-react';
import { endpoints } from '../services/api';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';

const InstitutionsPage = () => {
  const { addToast } = useOutletContext();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInst, setNewInst] = useState({ id: '', name: '', contact_email: '', credits: 0, subscription_plan: 'standard' });
  const [creating, setCreating] = useState(false);

  const { data, isLoading, refetch } = useQuery(
    'institutions',
    () => endpoints.institutions.list({ limit: 100 }),
    { onError: () => addToast('Erro ao carregar instituições', 'error') }
  );

  const institutions = data?.data?.institutions || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await endpoints.institutions.create(newInst);
      addToast('Instituição criada com sucesso', 'success');
      setIsCreateOpen(false);
      setNewInst({ id: '', name: '', contact_email: '', credits: 0, subscription_plan: 'standard' });
      refetch();
    } catch (err) {
      addToast(err.response?.data?.detail?.[0]?.msg || 'Erro ao criar', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm(`Resetar senha da instituição ${id}?`)) return;
    try {
      await endpoints.institutions.resetPassword(id);
      addToast('Senha resetada. Nova senha enviada.', 'success');
    } catch (err) {
      addToast('Erro ao resetar senha', 'error');
    }
  };

  const handleRegenerateApiKey = async (id) => {
    if (!window.confirm(`Regenerar API Key da instituição ${id}?`)) return;
    try {
      await endpoints.institutions.regenerateApiKey(id);
      addToast('API Key regenerada com sucesso', 'success');
    } catch (err) {
      addToast('Erro ao regenerar API Key', 'error');
    }
  };

  const columns = [
    { key: 'id', title: 'ID', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: 'name', title: 'Nome' },
    { key: 'contact_email', title: 'Email' },
    { key: 'credits', title: 'Créditos', render: (r) => <span className="font-mono">{r.credits}</span> },
    { key: 'status', title: 'Estado', render: (r) => (
      <span className={`badge capitalize ${r.status === 'active' ? 'badge-success' : r.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
        {r.status}
      </span>
    )},
    { key: 'approved', title: 'Aprovado', render: (r) => (
      <span className={`badge ${r.approved ? 'badge-success' : 'badge-danger'}`}>{r.approved ? 'Sim' : 'Não'}</span>
    )},
    { key: 'actions', title: 'Ações', render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={() => handleResetPassword(r.id)} className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400" title="Resetar Senha">
          <Lock className="w-4 h-4" />
        </button>
        <button onClick={() => handleRegenerateApiKey(r.id)} className="p-2 rounded-lg hover:bg-cyan/20 text-cyan" title="Regenerar API Key">
          <KeyRound className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-silver-light">Instituições</h1>
          <p className="text-sm text-silver-dark mt-1">Gerencie instituições parceiras</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Instituição
        </button>
      </div>

      <div className="glass-panel">
        <DataTable columns={columns} data={institutions} emptyText="Nenhuma instituição encontrada" keyExtractor={(r) => r.id} />
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Instituição" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-silver mb-2">ID (código)</label>
              <input required value={newInst.id} onChange={(e) => setNewInst(f => ({ ...f, id: e.target.value.toUpperCase() }))} className="input-field" placeholder="Ex: INAGE" />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-2">Nome</label>
              <input required value={newInst.name} onChange={(e) => setNewInst(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Nome da instituição" />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-2">Email</label>
              <input required type="email" value={newInst.contact_email} onChange={(e) => setNewInst(f => ({ ...f, contact_email: e.target.value }))} className="input-field" placeholder="email@instituicao.co.mz" />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-2">Créditos Iniciais</label>
              <input type="number" min="0" value={newInst.credits} onChange={(e) => setNewInst(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))} className="input-field" />
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? 'A criar...' : 'Criar Instituição'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default InstitutionsPage;

