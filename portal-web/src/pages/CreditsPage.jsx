import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  CreditCard, Loader2, TrendingUp, TrendingDown, Clock,
  ArrowDownLeft, ArrowUpRight, Package, AlertTriangle
} from 'lucide-react';

const CreditsPage = () => {
  const { user } = useAuth();
  const { notify } = useContext(NotificationContext);
  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const [creditsRes, historyRes] = await Promise.allSettled([
        endpoints.institutions.credits(),
        endpoints.institutions.creditHistory({ limit: 50 }),
      ]);

      if (creditsRes.status === 'fulfilled') {
        setCredits(creditsRes.value.data);
      }
      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.data || []);
      }
    } catch {
      notify('Erro ao carregar créditos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    const num = Number(amount);
    const prefix = num >= 0 ? '+' : '';
    return `${prefix}${num}`;
  };

  const typeConfig = {
    bonus: { icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Bónus' },
    consumption: { icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Consumo' },
    refund: { icon: ArrowDownLeft, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Reembolso' },
    purchase: { icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Compra' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Créditos</h1>
        <p className="text-xs text-slate-500 mt-1">Saldo e movimentos da instituição</p>
      </div>

      {/* Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Saldo Disponível</span>
            <CreditCard className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-4xl font-bold text-slate-100">{credits?.credits ?? user?.credits ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">créditos</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Plano</span>
            <Package className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-slate-100 capitalize">{credits?.subscription_plan || user?.subscription_plan || 'Standard'}</p>
          <p className="text-xs text-slate-500 mt-1">{credits?.docs_emitted_month || user?.docs_emitted_month || 0} docs este mês</p>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Histórico de Movimentos
          </h2>
        </div>

        {history.length > 0 ? (
          <div className="divide-y divide-white/[0.03] max-h-[32rem] overflow-y-auto">
            {history.map((item, idx) => {
              const cfg = typeConfig[item.type?.toLowerCase()] || typeConfig.purchase;
              const Icon = cfg.icon;
              return (
                <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-100 truncate">{item.description || cfg.label}</p>
                    <p className="text-[0.65rem] text-slate-500">
                      {item.payment_method && item.payment_method !== 'none' && (
                        <span className="mr-2 capitalize">{item.payment_method}</span>
                      )}
                      <span className="font-mono text-slate-600">{item.created_by}</span>
                      {' • '}
                      {new Date(item.created_at).toLocaleString('pt-MZ')}
                    </p>
                  </div>
                  <span className={`text-sm font-bold font-mono ${Number(item.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatAmount(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-slate-600">
            Nenhuma movimentação registada
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsPage;

