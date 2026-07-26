import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  CreditCard, TrendingUp, TrendingDown, Loader2, AlertTriangle,
  Plus, Clock, X
} from 'lucide-react';

const CreditsPage = () => {
  const { user, isAdmin, isInstitution } = useAuth();
  const { notify } = useContext(NotificationContext);
  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetInstitution, setTargetInstitution] = useState('');
  const [amount, setAmount] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => { fetchCredits(); }, [isAdmin, isInstitution]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        setCredits({ credits: 0, status: 'admin', docs_emitted_month: 0 });
        setHistory([]);
      } else {
        const [creditsRes, historyRes] = await Promise.allSettled([
          api.get('/api/v1/institutions/me/credits'),
          api.get('/api/v1/institutions/me/credit-history?limit=50'),
        ]);
        setCredits(creditsRes.status === 'fulfilled' ? creditsRes.data : {});
        const hist = historyRes.status === 'fulfilled' ? historyRes.data : [];
        setHistory(Array.isArray(hist) ? hist : []);
      }
    } catch {
      setError('Erro ao carregar dados de créditos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();
    if (!targetInstitution || !amount || parseInt(amount) <= 0) return;
    setAddLoading(true);
    try {
      await api.post(`/api/v1/institutions/${targetInstitution.toUpperCase()}/credits`, {
        amount: parseInt(amount),
        type: 'manual_add',
        description: 'Adicionado via portal administrativo',
      });
      notify('Créditos adicionados com sucesso', 'success');
      setShowAddModal(false);
      setTargetInstitution('');
      setAmount('');
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao adicionar créditos', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{isAdmin ? 'Gestão de Créditos' : 'Meus Créditos'}</h1>
          <p className="text-xs text-slate-500 mt-1">{isAdmin ? 'Administrar saldo das instituições' : 'Saldo disponível para emissão'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all">
            <Plus className="w-4 h-4" />Adicionar Créditos
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      {!isAdmin && credits && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-400 to-amber-600" />
            <p className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Saldo Actual</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">{credits.credits || 0}</p>
            <p className="text-[0.65rem] text-slate-500 mt-1">créditos disponíveis</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Este Mês</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">{credits.docs_emitted_month || 0}</p>
            <p className="text-[0.65rem] text-slate-500 mt-1">documentos emitidos</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Status</p>
            <p className={`text-3xl font-bold mt-2 ${credits.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>{credits.status || 'active'}</p>
            <p className="text-[0.65rem] text-slate-500 mt-1">da conta</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />Histórico de Transacções
          </h2>
          <span className="text-[0.65rem] text-slate-500">{history.length} registo(s)</span>
        </div>
        {history.length > 0 ? (
          <div className="divide-y divide-white/[0.03]">
            {history.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {item.amount > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-100">{item.description || `Transação ${item.type}`}</p>
                  <p className="text-[0.65rem] text-slate-500">
                    {new Date(item.created_at).toLocaleString('pt-MZ')}
                    {item.created_by ? ` • por ${item.created_by}` : ''}
                  </p>
                </div>
                <span className={`text-sm font-bold ${item.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.amount > 0 ? '+' : ''}{item.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <CreditCard className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhuma transacção encontrada</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Adicionar Créditos</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-white/5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCredits} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Instituição (ID)</label>
                <input type="text" value={targetInstitution} onChange={(e) => setTargetInstitution(e.target.value.toUpperCase())} placeholder="Ex: CFN" required className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm font-mono uppercase" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">Quantidade</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" required className="w-full px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
              </div>
              <button type="submit" disabled={addLoading} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all disabled:opacity-30 text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Confirmar</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsPage;

