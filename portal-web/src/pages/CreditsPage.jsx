import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  CreditCard, Wallet, Receipt, TrendingUp, AlertTriangle,
  RefreshCw, Inbox, Plus, Minus, History, BarChart3,
  CheckCircle2, ChevronLeft, ChevronRight, FunnelX, Funnel
} from 'lucide-react';

const CreditsPage = () => {
  const { user, isAdmin, isInstitution } = useAuth();
  const { notify } = useContext(NotificationContext);

  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── CORREÇÃO: paginação com skip/limit (conforme Swagger) ──
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('all');

  const fetchedRef = useRef(false);

  const fetchCredits = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const [credRes, histRes] = await Promise.allSettled([
        endpoints.me.credits(),
        endpoints.me.creditHistory({ limit, skip }),
      ]);
      if (credRes.status === 'fulfilled') setCredits(credRes.value.data);
      if (histRes.status === 'fulfilled') {
        const items = histRes.value.data || [];
        setHistory(Array.isArray(items) ? items : []);
        // Se a API retornar total, usar; senão usar length
        setTotal(histRes.value.data?.total || items.length);
      }
    } catch (err) {
      setError(err.normalizedMessage || 'Erro ao carregar créditos');
      notify(err.normalizedMessage || 'Erro ao carregar créditos', 'error');
    } finally {
      setLoading(false);
      fetchedRef.current = false;
    }
  }, [limit, skip, notify]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchCredits();
  }, [fetchCredits]);

  const balance = credits?.credits ?? credits?.balance ?? credits?.available ?? 0;
  const used = credits?.docs_emitted_month ?? credits?.used ?? credits?.consumed ?? 0;
  const totalCredits = balance + used;
  const percentage = totalCredits > 0 ? Math.round((balance / totalCredits) * 100) : 0;

  const SkeletonCard = () => (
    <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3 animate-pulse">
      <div className="w-24 h-3 rounded bg-white/[0.05]" />
      <div className="w-16 h-8 rounded bg-white/[0.05]" />
      <div className="w-full h-2 rounded-full bg-white/[0.03]" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Créditos</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin ? 'Gestão global de créditos das instituições' : 'Saldo e histórico de consumo'}
          </p>
        </div>
        <button
          onClick={() => { fetchedRef.current = false; fetchCredits(); }}
          disabled={loading}
          className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-cyan-400 hover:border-cyan-500/20 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <Wallet className="w-3.5 h-3.5" /> Disponíveis
            </div>
            <p className="text-3xl font-bold text-emerald-400">{balance.toLocaleString('pt-MZ')}</p>
            <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500/40 rounded-full transition-all" style={{ width: `${percentage}%` }} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <Receipt className="w-3.5 h-3.5" /> Emitidos este mês
            </div>
            <p className="text-3xl font-bold text-amber-400">{used.toLocaleString('pt-MZ')}</p>
            <p className="text-xs text-slate-500">Documentos certificados</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" /> Estado da Conta
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${(credits?.status || user?.status) === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <p className="text-lg font-bold text-cyan-400 capitalize">{credits?.status || user?.status || 'active'}</p>
            </div>
            <p className="text-xs text-slate-500">
              Plano: <span className="text-slate-300">{credits?.subscription_plan || user?.subscription_plan || 'Standard'}</span>
              {credits?.approved !== undefined && (
                <> • Aprovado: <span className={credits.approved ? 'text-emerald-400' : 'text-amber-400'}>{credits.approved ? 'Sim' : 'Pendente'}</span></>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Usage Bar */}
      {!loading && totalCredits > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" /> Utilização
            </div>
            <span className="text-xs text-slate-500">{percentage}% disponível</span>
          </div>
          <div className="w-full h-3 bg-white/[0.03] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500/40 rounded-full transition-all" style={{ width: `${percentage}%` }} />
          </div>
          <div className="flex justify-between text-[0.65rem] text-slate-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {balance} disponíveis</span>
            <span className="flex items-center gap-1"><Receipt className="w-3 h-3 text-amber-400" /> {used} emitidos</span>
          </div>
        </div>
      )}

      {/* History */}
      <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
            <History className="w-3.5 h-3.5" /> Histórico de Movimentos
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 focus:outline-none focus:border-cyan-500/30"
            >
              <option value="all">Todos</option>
              <option value="consumption">Consumo</option>
              <option value="purchase">Compra</option>
              <option value="refund">Reembolso</option>
            </select>
            <span className="text-xs text-slate-500">{history.length} registos</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-3 rounded bg-white/[0.05]" />
                  <div className="w-32 h-2 rounded bg-white/[0.05]" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-12 text-center space-y-3">
            <Inbox className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-500">Sem movimentos registados</p>
            <p className="text-xs text-slate-600">O histórico aparecerá após a primeira transacção</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {history.map((item, i) => {
                const isAdd = (item.amount || item.credits || 0) > 0;
                const amount = Math.abs(item.amount || item.credits || 0);
                const typeColor = item.type === 'consumption' ? 'text-amber-400' : item.type === 'purchase' ? 'text-emerald-400' : 'text-cyan-400';
                const typeLabel = item.type === 'consumption' ? 'Consumo' : item.type === 'purchase' ? 'Compra' : item.type === 'refund' ? 'Reembolso' : item.type || 'Movimento';
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAdd ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                      {isAdd ? <Plus className="w-4 h-4 text-emerald-400" /> : <Minus className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-200 font-medium">{item.description || typeLabel}</p>
                        <span className={`text-[0.55rem] px-1.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] ${typeColor}`}>{typeLabel}</span>
                      </div>
                      <p className="text-[0.6rem] text-slate-500">
                        {item.created_at ? new Date(item.created_at).toLocaleString('pt-MZ') : '—'}
                        {item.created_by && <> • Por: <span className="text-cyan-400/70">{item.created_by}</span></>}
                      </p>
                      {(item.payment_method || item.payment_reference) && (
                        <p className="text-[0.6rem] text-slate-600">
                          {item.payment_method && <>Método: <span className="text-slate-500">{item.payment_method}</span></>}
                          {item.payment_reference && <> • Ref: <span className="text-slate-500">{item.payment_reference}</span></>}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[0.6rem] text-slate-600 italic">Nota: {item.notes}</p>
                      )}
                    </div>
                    <div className={`text-sm font-bold ${isAdd ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isAdd ? '+' : '-'}{amount}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── CORREÇÃO: Paginação ── */}
            {total > limit && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  {skip + 1}-{Math.min(skip + limit, total)} de {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSkip(s => Math.max(0, s - limit))}
                    disabled={skip === 0}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSkip(s => s + limit)}
                    disabled={skip + limit >= total}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CreditsPage;
