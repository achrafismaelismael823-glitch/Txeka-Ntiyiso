import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  Building2, Plus, Search, RefreshCw, Eye, Pencil, Trash2,
  Key, CreditCard, Mail, Phone, MapPin, Calendar, CheckCircle2,
  XCircle, AlertTriangle, Loader2, ChevronLeft, ChevronRight,
  Save, X, Lock
} from 'lucide-react';

const InstitutionsPage = () => {
  const { isAdmin } = useAuth();
  const { notify } = useContext(NotificationContext);

  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // ── CORREÇÃO: Paginação com offset (api.js converte para skip) ──
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view' | 'credits'
  const [selected, setSelected] = useState(null);

  const [formData, setFormData] = useState({
    id: '', name: '', email: '', phone: '', address: '', contact_person: ''
  });
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');

  const fetchedRef = useRef(false);

  const fetchInstitutions = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      // ── CORREÇÃO: usar offset que api.js converte para skip ──
      const { data } = await endpoints.institutions.list({
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
      });
      setInstitutions(data.items || data.institutions || data || []);
      setTotal(data.total || data.count || 0);
    } catch (err) {
      setError(err.normalizedMessage || 'Erro ao carregar instituições');
      notify(err.normalizedMessage || 'Erro ao carregar instituições', 'error');
    } finally {
      setLoading(false);
      fetchedRef.current = false;
    }
  }, [page, search, notify]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchedRef.current = false;
    fetchInstitutions();
  }, [fetchInstitutions, isAdmin]);

  const handleCreate = () => {
    setFormData({ id: '', name: '', email: '', phone: '', address: '', contact_person: '' });
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (inst) => {
    setFormData({ ...inst });
    setModalMode('edit');
    setSelected(inst);
    setModalOpen(true);
  };

  const handleView = (inst) => {
    setSelected(inst);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleCredits = (inst) => {
    setSelected(inst);
    setCreditAmount('');
    setCreditDescription('');
    setModalMode('credits');
    setModalOpen(true);
  };

  const handleRegenerateKey = async (inst) => {
    if (!window.confirm(`Regenerar API key para ${inst.name}? A anterior deixará de funcionar.`)) return;
    try {
      const { data } = await endpoints.institutions.regenerateApiKey(inst.id);
      notify(`API key regenerada para ${inst.name}`, 'success');
      // Atualizar na lista
      setInstitutions(prev => prev.map(i => i.id === inst.id ? { ...i, api_key: data.api_key } : i));
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao regenerar API key', 'error');
    }
  };

  const handleResetPassword = async (inst) => {
    if (!window.confirm(`Resetar password para ${inst.name}? Será gerada uma nova password temporária.`)) return;
    try {
      const { data } = await endpoints.institutions.resetPassword(inst.id);
      notify(`Password resetada para ${inst.name}. Nova password: ${data.temp_password}`, 'success');
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao resetar password', 'error');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await endpoints.institutions.create(formData);
        notify('Instituição criada com sucesso', 'success');
      } else if (modalMode === 'edit') {
        await endpoints.institutions.update(selected.id, formData);
        notify('Instituição actualizada com sucesso', 'success');
      }
      setModalOpen(false);
      fetchedRef.current = false;
      fetchInstitutions();
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao guardar instituição', 'error');
    }
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();
    if (!creditAmount || isNaN(creditAmount) || creditAmount <= 0) {
      notify('Quantidade inválida', 'error');
      return;
    }
    try {
      await endpoints.institutions.addCredits(selected.id, {
        amount: parseInt(creditAmount),
        description: creditDescription || 'Créditos adicionados pelo administrador',
      });
      notify(`${creditAmount} créditos adicionados a ${selected.name}`, 'success');
      setModalOpen(false);
      fetchedRef.current = false;
      fetchInstitutions();
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao adicionar créditos', 'error');
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Lock className="w-12 h-12 text-slate-600" />
        <h2 className="text-lg font-bold text-slate-400">Acesso Restrito</h2>
        <p className="text-sm text-slate-500">Apenas administradores podem aceder a esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Instituições</h1>
          <p className="text-xs text-slate-500 mt-1">Gestão de instituições credenciadas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchedRef.current = false; fetchInstitutions(); }}
            disabled={loading}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-cyan-400 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nova Instituição
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Pesquisar por nome, ID ou email..."
          className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.02]" />
            ))}
          </div>
        ) : institutions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-500">Nenhuma instituição encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-[0.65rem] text-slate-500 uppercase tracking-wider font-medium">ID</th>
                  <th className="px-4 py-3 text-[0.65rem] text-slate-500 uppercase tracking-wider font-medium">Nome</th>
                  <th className="px-4 py-3 text-[0.65rem] text-slate-500 uppercase tracking-wider font-medium">Email</th>
                  <th className="px-4 py-3 text-[0.65rem] text-slate-500 uppercase tracking-wider font-medium">Créditos</th>
                  <th className="px-4 py-3 text-[0.65rem] text-slate-500 uppercase tracking-wider font-medium text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-cyan-400">{inst.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-200">{inst.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{inst.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        <CreditCard className="w-3 h-3" /> {inst.credits ?? inst.balance ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleView(inst)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-cyan-400 transition-all" title="Ver">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleEdit(inst)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-amber-400 transition-all" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleCredits(inst)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-emerald-400 transition-all" title="Créditos">
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleRegenerateKey(inst)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-blue-400 transition-all" title="Regenerar API Key">
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleResetPassword(inst)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-red-400 transition-all" title="Reset Password">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-slate-500">
              Página {page} de {totalPages} ({total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/[0.08] rounded-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">
                {modalMode === 'create' && 'Nova Instituição'}
                {modalMode === 'edit' && 'Editar Instituição'}
                {modalMode === 'view' && selected?.name}
                {modalMode === 'credits' && `Créditos — ${selected?.name}`}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-white/[0.05] text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMode === 'view' && selected && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                    <span className="text-[0.6rem] text-slate-500 uppercase">ID</span>
                    <p className="text-sm font-mono text-cyan-400">{selected.id}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                    <span className="text-[0.6rem] text-slate-500 uppercase">Créditos</span>
                    <p className="text-sm text-emerald-400">{selected.credits ?? selected.balance ?? 0}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[0.6rem] text-slate-500 uppercase">Email</span>
                  <p className="text-sm text-slate-200">{selected.email}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[0.6rem] text-slate-500 uppercase">Telefone</span>
                  <p className="text-sm text-slate-200">{selected.phone || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[0.6rem] text-slate-500 uppercase">Endereço</span>
                  <p className="text-sm text-slate-200">{selected.address || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[0.6rem] text-slate-500 uppercase">Pessoa de Contacto</span>
                  <p className="text-sm text-slate-200">{selected.contact_person || '—'}</p>
                </div>
                {selected.api_key && (
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1">
                    <span className="text-[0.6rem] text-amber-500 uppercase">API Key</span>
                    <p className="text-xs font-mono text-amber-400 break-all">{selected.api_key}</p>
                  </div>
                )}
              </div>
            )}

            {(modalMode === 'create' || modalMode === 'edit') && (
              <form onSubmit={handleSubmitForm} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">ID (código único)</label>
                  <input
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm font-mono uppercase"
                    required
                    disabled={modalMode === 'edit'}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Nome</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">Telefone</label>
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">Pessoa de Contacto</label>
                    <input
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Endereço</label>
                  <input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </form>
            )}

            {modalMode === 'credits' && (
              <form onSubmit={handleAddCredits} className="space-y-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-xs text-slate-500">Saldo actual</p>
                  <p className="text-2xl font-bold text-emerald-400">{selected?.credits ?? selected?.balance ?? 0}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Quantidade a adicionar</label>
                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Descrição</label>
                  <input
                    value={creditDescription}
                    onChange={(e) => setCreditDescription(e.target.value)}
                    placeholder="Ex: Créditos para emissão de certificados Q3 2026"
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Adicionar Créditos
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionsPage;
