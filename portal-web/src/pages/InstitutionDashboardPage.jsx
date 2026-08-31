import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import { useAuth } from '../hooks/useAuth';
import {
  Activity, FileText, ShieldCheck, AlertTriangle,
  CheckCircle2, BarChart3, ArrowRight,
  FileCheck, Search, RefreshCw, Inbox, Clock,
  CreditCard, Building2, Wallet, Receipt, Minus, Plus
} from 'lucide-react';

const SkeletonCard = () => (
  <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-xl bg-white/[0.05]" />
      <div className="w-16 h-3 rounded bg-white/[0.05]" />
    </div>
    <div className="space-y-2">
      <div className="w-16 h-8 rounded bg-white/[0.05]" />
      <div className="w-24 h-3 rounded bg-white/[0.05]" />
    </div>
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] animate-pulse">
    <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
    <div className="flex-1 space-y-2">
      <div className="w-24 h-3 rounded bg-white/[0.05]" />
      <div className="w-32 h-2 rounded bg-white/[0.05]" />
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, subtext, color, onClick }) => (
  <div
    onClick={onClick}
    className={`p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3 hover:border-white/[0.12] transition-all ${onClick ? 'cursor-pointer hover:bg-slate-900/80' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      {subtext && <span className="text-[0.65rem] text-slate-500">{subtext}</span>}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, description, to, color }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all text-left group"
    >
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">{label}</p>
          <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
        </div>
        <p className="text-[0.65rem] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </button>
  );
};

const MiniBarChart = ({ data, label }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center space-y-2">
        <BarChart3 className="w-8 h-8 text-slate-700" />
        <p className="text-xs text-slate-600">Sem dados de verificação</p>
        <p className="text-[0.6rem] text-slate-700">Os dados aparecerão após a primeira verificação pública</p>
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.count || 0), 1);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
        <BarChart3 className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/50 rounded-t transition-all relative min-h-[4px]"
              style={{ height: `${(d.count / max) * 100}%` }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[0.55rem] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 px-1.5 py-0.5 rounded">
                {d.count}
              </div>
            </div>
            <span className="text-[0.5rem] text-slate-600">{d.date?.slice(5) || i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityRow = ({ description, type, date, amount }) => {
  const isConsumption = type === 'consumption';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isConsumption ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
        {isConsumption ? <Minus className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-200 truncate">{description}</span>
          <span className={`text-[0.55rem] px-1.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] ${isConsumption ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isConsumption ? 'Consumo' : type === 'bonus' ? 'Bónus' : type || 'Movimento'}
          </span>
        </div>
        <p className="text-[0.6rem] text-slate-500">
          {date ? new Date(date).toLocaleString('pt-MZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
        </p>
      </div>
      <div className={`text-sm font-bold ${isConsumption ? 'text-amber-400' : 'text-emerald-400'}`}>
        {isConsumption ? '-' : '+'}{Math.abs(amount)}
      </div>
    </div>
  );
};

const EmptyState = ({ onAction }) => (
  <div className="col-span-full p-8 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center space-y-4">
    <div className="w-14 h-14 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mx-auto">
      <Inbox className="w-7 h-7 text-cyan-400/50" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-400">Ainda sem actividade registada</p>
      <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
        A sua dashboard será preenchida automaticamente à medida que emitir documentos.
      </p>
    </div>
    <div className="flex flex-wrap justify-center gap-2">
      <button onClick={() => onAction('/emit')} className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all flex items-center gap-2">
        <FileCheck className="w-3.5 h-3.5" /> Emitir Documento
      </button>
      <button onClick={() => onAction('/verify')} className="px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 text-xs font-medium hover:bg-white/[0.05] transition-all flex items-center gap-2">
        <Search className="w-3.5 h-3.5" /> Verificar Documento
      </button>
    </div>
  </div>
);

const InstitutionDashboardPage = () => {
  const { notify } = useContext(NotificationContext);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const fetchDashboardData = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      setLoading(true);
      setError(null);
      const response = await endpoints.me.dashboard();
      setStats(response.data);
    } catch (err) {
      console.error('[InstitutionDashboard] Erro:', err);
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar dados');
      notify(err.response?.data?.detail || 'Erro ao carregar estatísticas', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchDashboardData();
    return () => { fetchedRef.current = false; };
  }, [fetchDashboardData]);

  const institution = stats?.institution || {};
  const totalEmitted = stats?.total_emitted ?? institution?.docs_emitted_month ?? 0;
  const totalVerifications = stats?.total_verifications ?? 0;
  const creditsAvailable = stats?.credits ?? institution?.credits ?? 0;
  const docsEmittedMonth = institution?.docs_emitted_month ?? stats?.docs_emitted_month ?? 0;
  const creditHistory = stats?.credits_history ?? [];
  const accountStatus = institution?.status ?? stats?.status ?? 'active';
  const subscriptionPlan = institution?.subscription_plan ?? 'standard';

  const creditsConsumed = docsEmittedMonth;
  const creditsTotal = creditsAvailable + creditsConsumed;

  const recentEmissions = creditHistory
    .filter(h => h.type === 'consumption')
    .slice(0, 5);

  const hasAnyData = totalEmitted > 0 || creditHistory.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Instituição: <span className="text-cyan-400 font-mono">{institution?.name || user?.name || user?.id || '—'}</span>
          </p>
        </div>
        <button
          onClick={() => { fetchedRef.current = false; fetchDashboardData(); }}
          disabled={loading}
          className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.1] transition-all disabled:opacity-30"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction icon={FileCheck} label="Emitir Documento" description="Certifique um novo documento" to="/emit" color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
        <QuickAction icon={Search} label="Verificar Documento" description="Valide autenticidade por hash" to="/verify" color="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" />
        <QuickAction icon={FileText} label="Documentos" description="Consulte o histórico de emissões" to="/documents" color="bg-blue-500/10 text-blue-400 border border-blue-500/20" />
        <QuickAction icon={CreditCard} label="Créditos" description="Consulte saldo e histórico" to="/credits" color="bg-amber-500/10 text-amber-400 border border-amber-500/20" />
      </div>

      {error && !loading && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/15 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => { fetchedRef.current = false; fetchDashboardData(); }}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Documentos Emitidos"
            value={totalEmitted.toLocaleString('pt-MZ')}
            subtext={`${docsEmittedMonth} este mês`}
            color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            onClick={() => navigate('/credits')}
          />
          <StatCard
            icon={ShieldCheck}
            label="Verificações"
            value={totalVerifications > 0 ? totalVerifications.toLocaleString('pt-MZ') : '—'}
            subtext={totalVerifications > 0 ? 'Verificações registadas' : 'Sem verificações'}
            color="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            onClick={() => navigate('/verify')}
          />
          <StatCard
            icon={CheckCircle2}
            label="Documentos Activos"
            value={totalEmitted.toLocaleString('pt-MZ')}
            subtext="Estimado (sem revogações registadas)"
            color="bg-blue-500/10 text-blue-400 border border-blue-500/20"
            onClick={() => navigate('/credits')}
          />
          <StatCard
            icon={AlertTriangle}
            label="Documentos Revogados"
            value="0"
            subtext="Nenhuma revogação registada"
            color="bg-red-500/10 text-red-400 border border-red-500/20"
            onClick={() => navigate('/revoke')}
          />
        </div>
      )}

      <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
            <Wallet className="w-3.5 h-3.5" /> Créditos da Instituição
          </div>
          <button
            onClick={() => navigate('/credits')}
            className="text-[0.65rem] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            Ver detalhes <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="w-full h-2 rounded-full bg-white/[0.05]" />
            <div className="flex justify-between">
              <div className="w-20 h-3 rounded bg-white/[0.05]" />
              <div className="w-20 h-3 rounded bg-white/[0.05]" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-100">{creditsAvailable.toLocaleString('pt-MZ')}</p>
                  <p className="text-xs text-slate-500">Créditos disponíveis</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-slate-400">{creditsConsumed.toLocaleString('pt-MZ')} consumidos</p>
                <p className="text-[0.65rem] text-slate-600">{creditsTotal.toLocaleString('pt-MZ')} total atribuído</p>
              </div>
            </div>
            <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500/40 rounded-full transition-all"
                style={{ width: `${creditsTotal > 0 ? (creditsAvailable / creditsTotal) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[0.65rem] text-slate-500">
              <span className="flex items-center gap-1">
                <Wallet className="w-3 h-3 text-amber-400" /> {creditsAvailable} disponíveis
              </span>
              <span className="flex items-center gap-1">
                <Receipt className="w-3 h-3 text-slate-400" /> {creditsConsumed} consumidos
              </span>
            </div>
          </div>
        )}
      </div>

      {!loading && !error && !hasAnyData && <EmptyState onAction={(to) => navigate(to)} />}

      {(hasAnyData || loading) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06]">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="w-32 h-3 rounded bg-white/[0.05]" />
                <div className="flex items-end gap-1 h-28">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex-1 bg-white/[0.03] rounded-t" style={{ height: `${20 + Math.random() * 60}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              <MiniBarChart
                data={stats?.verifications_by_day ?? []}
                label="Verificações por dia (Sua Instituição)"
              />
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" /> Resumo da Instituição
            </div>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="w-16 h-3 rounded bg-white/[0.05]" />
                    <div className="w-20 h-2 rounded bg-white/[0.05]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Documentos Emitidos</span>
                  <span className="text-xs font-mono text-slate-300">{totalEmitted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Documentos Activos</span>
                  <span className="text-xs font-mono text-emerald-400">{totalEmitted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Documentos Revogados</span>
                  <span className="text-xs font-mono text-red-400">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Créditos Disponíveis</span>
                  <span className="text-xs font-mono text-amber-400">{creditsAvailable}</span>
                </div>
                <div className="pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Plano</span>
                    <span className="text-xs font-mono text-cyan-400 capitalize">{subscriptionPlan}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Estado</span>
                  <span className={`text-xs font-mono capitalize ${accountStatus === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>{accountStatus}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(recentEmissions.length > 0 || loading) && (
        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" /> Últimas Emissões
            </div>
            <button
              onClick={() => navigate('/credits')}
              className="text-[0.65rem] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              Ver histórico completo <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : recentEmissions.length === 0 ? (
            <div className="text-center py-4">
              <Activity className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">Sem emissões recentes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEmissions.map((item, i) => (
                <ActivityRow
                  key={i}
                  description={item.description || 'Emissão de documento'}
                  type={item.type}
                  date={item.created_at}
                  amount={item.amount || -1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstitutionDashboardPage;
