import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  LayoutDashboard, FileCheck, ShieldCheck, CreditCard, TrendingUp,
  AlertTriangle, RefreshCw, ArrowRight, Activity, BarChart3,
  Clock, Building2, Hash, FileText, ChevronRight, ChevronLeft, CalendarDays, UserCircle
} from 'lucide-react';

const DashboardPage = () => {
  const { user, isAdmin, isInstitution, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchedRef = useRef(false);

  const fetchDashboard = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data } = await endpoints.institutions.dashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.normalizedMessage || 'Erro ao carregar dashboard');
      notify(err.normalizedMessage || 'Erro ao carregar dashboard', 'error');
    } finally {
      setLoading(false);
      fetchedRef.current = false;
    }
  }, [notify]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchDashboard();
  }, [fetchDashboard]);

  // ── CORREÇÃO: Normalizar dados do dashboard ──
  const inst = dashboard?.institution || user;
  const totalEmitted = dashboard?.total_emitted || 0;
  const docsEmittedMonth = inst?.docs_emitted_month || 0;
  const totalVerifications = dashboard?.total_verifications || 0;
  const credits = inst?.credits || 0;
  const creditHistory = dashboard?.credits_history || [];

  const SkeletonCard = () => (
    <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3 animate-pulse">
      <div className="w-24 h-3 rounded bg-white/[0.05]" />
      <div className="w-16 h-8 rounded bg-white/[0.05]" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin ? 'Visão geral da plataforma' : `Visão geral — ${inst?.name || institutionId}`}
          </p>
        </div>
        <button
          onClick={() => { fetchedRef.current = false; fetchDashboard(); }}
          disabled={loading}
          className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-cyan-400 transition-all"
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

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3 group hover:border-cyan-500/20 transition-all cursor-pointer"
            onClick={() => navigate('/emit')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                <FileCheck className="w-3.5 h-3.5" /> Emitidos
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-emerald-400">{totalEmitted}</p>
            <p className="text-xs text-slate-500">
              Total certificados • <span className="text-emerald-400/70">{docsEmittedMonth} este mês</span>
            </p>
          </div>

          <div 
            className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3 group hover:border-blue-500/20 transition-all cursor-pointer"
            onClick={() => navigate('/credits')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5" /> Créditos
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-cyan-400">{credits}</p>
            <p className="text-xs text-slate-500">Disponíveis para emissão</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Verificações
            </div>
            <p className="text-3xl font-bold text-blue-400">{totalVerifications}</p>
            <p className="text-xs text-slate-500">Validações realizadas</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" /> Estado
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${inst?.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <p className="text-2xl font-bold text-emerald-400">{inst?.status === 'active' ? 'Activa' : inst?.status || '—'}</p>
            </div>
            <p className="text-xs text-slate-500">
              {inst?.approved ? (
                <span className="text-emerald-400/70">Conta aprovada</span>
              ) : (
                <span className="text-amber-400/70">Aprovação pendente</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/emit')}
          className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
            <FileCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Certificar Documento</h3>
            <p className="text-xs text-slate-500 mt-1">Emita um novo documento com hash SHA-256</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/verify')}
          className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] hover:border-blue-500/20 hover:bg-blue-500/[0.02] transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Verificar Documento</h3>
            <p className="text-xs text-slate-500 mt-1">Valide a autenticidade via hash público</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {creditHistory.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" /> Movimentos Recentes
            </div>
            <button
              onClick={() => navigate('/credits')}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {creditHistory.slice(0, 5).map((item, i) => {
              const isAdd = (item.amount || 0) > 0;
              const typeLabel = item.type === 'consumption' ? 'Consumo' : item.type === 'purchase' ? 'Compra' : item.type === 'refund' ? 'Reembolso' : item.type === 'manual_add' ? 'Manual' : item.type || 'Movimento';
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAdd ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                    {isAdd ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-200">{item.description || typeLabel}</p>
                      <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-500">{typeLabel}</span>
                    </div>
                    <p className="text-[0.6rem] text-slate-500">
                      {item.created_at ? new Date(item.created_at).toLocaleString('pt-MZ') : '—'}
                      {item.created_by && <> • Por: <span className="text-cyan-400/70">{item.created_by}</span></>}
                      {item.payment_method && <> • <span className="text-slate-600">{item.payment_method}</span></>}
                    </p>
                  </div>
                  <div className={`text-sm font-bold ${isAdd ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isAdd ? '+' : '-'}{Math.abs(item.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Institution Info */}
      {isInstitution && inst && (
        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" /> Dados da Instituição
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase">ID</span>
              <p className="text-sm font-mono text-cyan-400">{inst.id}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase">Nome</span>
              <p className="text-sm text-slate-100">{inst.name}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase">Email</span>
              <p className="text-sm text-slate-100">{inst.contact_email || inst.email || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase">Plano</span>
              <p className="text-sm text-slate-100 capitalize">{inst.subscription_plan || 'standard'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase">Role</span>
              <p className="text-sm text-slate-100 capitalize">{inst.role || 'institution'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[0.6rem] text-slate-500 uppercase">Criada em</span>
              <p className="text-sm text-slate-100">{inst.created_at ? new Date(inst.created_at).toLocaleDateString('pt-MZ') : '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
