import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import { useAuth } from '../hooks/useAuth';
import {
  Activity, FileText, ShieldCheck, AlertTriangle, TrendingUp,
  Users, CheckCircle2, XCircle, BarChart3, Lock, ArrowRight,
  FileCheck, Search, Zap, RefreshCw, Inbox, Clock, Eye,
  Building2, Globe, Server
} from 'lucide-react';

/* ── SKELETONS ── */
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

/* ── STAT CARD ── */
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

/* ── QUICK ACTION ── */
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

/* ── MINI BAR CHART ── */
const MiniBarChart = ({ data, label }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center space-y-2">
        <BarChart3 className="w-8 h-8 text-slate-700" />
        <p className="text-xs text-slate-600">Sem dados de verificação</p>
        <p className="text-[0.6rem] text-slate-700">Os dados aparecerão após a primeira verificação</p>
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

/* ── ACTIVITY ROW ── */
const ActivityRow = ({ action, resource, status, user, institution, date, onClick }) => {
  const statusConfig = {
    success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  };
  const cfg = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all cursor-pointer"
    >
      <div className={`w-8 h-8 rounded-lg ${cfg.bg} ${cfg.border} border flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-200 uppercase">{action}</span>
          <span className="text-[0.6rem] text-slate-600">{resource}</span>
        </div>
        <p className="text-[0.6rem] text-slate-500 truncate">
          {user} {institution && <>• <span className="text-cyan-400/70">{institution}</span></>}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[0.6rem] text-slate-600">{date}</p>
      </div>
    </div>
  );
};

/* ── EMPTY STATE ── */
const EmptyState = ({ onAction }) => (
  <div className="col-span-full p-8 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center space-y-4">
    <div className="w-14 h-14 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mx-auto">
      <Inbox className="w-7 h-7 text-cyan-400/50" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-400">Ainda sem actividade registada na plataforma</p>
      <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
        Como administrador, os dados globais aparecerão assim que as instituições começarem a emitir e verificar documentos.
      </p>
    </div>
    <div className="flex flex-wrap justify-center gap-2">
      <button onClick={() => onAction('/institutions')} className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all flex items-center gap-2">
        <Building2 className="w-3.5 h-3.5" /> Gerir Instituições
      </button>
      <button onClick={() => onAction('/audit')} className="px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 text-xs font-medium hover:bg-white/[0.05] transition-all flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" /> Ver Auditoria
      </button>
    </div>
  </div>
);

/* ── MAIN ── */
const AdminDashboardPage = () => {
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const fetchDashboardData = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const [statsRes, logsRes] = await Promise.all([
        endpoints.audit.stats({}),
        endpoints.audit.logs({ limit: 5 }),
      ]);

      setStats(statsRes.data);
      const logs = logsRes.data?.items || logsRes.data?.logs || logsRes.data || [];
      setRecentActivity(Array.isArray(logs) ? logs.slice(0, 5) : []);
    } catch (err) {
      console.error('[AdminDashboard] Erro:', err);
      setError(err.normalizedMessage || 'Erro ao carregar dados do dashboard');
      notify(err.normalizedMessage || 'Erro ao carregar estatísticas', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchDashboardData();
    return () => { fetchedRef.current = false; };
  }, [fetchDashboardData]);

  const s = stats?.summary || stats || {};
  const v = stats?.verifications || {};
  const actions = stats?.actions_by_type || {};

  const hasAnyData =
    (s.total_emitted_documents || s.emitted_documents || s.documents_count || 0) > 0 ||
    (s.total_verifications || s.verifications_count || 0) > 0 ||
    (s.total_logs || s.logs_count || 0) > 0 ||
    recentActivity.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Visão global da plataforma Txeka Ntiyiso</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <Lock className="w-3 h-3" /> Super Admin
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
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <QuickAction icon={FileCheck} label="Emitir Documento" description="Certifique um novo documento" to="/emit" color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" />
        <QuickAction icon={Search} label="Verificar Documento" description="Valide autenticidade por hash" to="/verify" color="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" />
        <QuickAction icon={FileText} label="Documentos" description="Consulte o histórico global" to="/documents" color="bg-blue-500/10 text-blue-400 border border-blue-500/20" />
        <QuickAction icon={Activity} label="Auditoria" description="Registo completo de acções" to="/audit" color="bg-amber-500/10 text-amber-400 border border-amber-500/20" />
        <QuickAction icon={Building2} label="Instituições" description="Gerir instituições e créditos" to="/institutions" color="bg-violet-500/10 text-violet-400 border border-violet-500/20" />
      </div>

      {/* Error */}
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

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Documentos Emitidos"
            value={((s.total_emitted_documents || s.emitted_documents || s.documents_count || 0)).toLocaleString('pt-MZ')}
            subtext={`${(s.active_documents || s.active_count || 0).toLocaleString('pt-MZ')} activos`}
            color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            onClick={() => navigate('/documents')}
          />
          <StatCard
            icon={ShieldCheck}
            label="Verificações"
            value={((s.total_verifications || s.verifications_count || 0)).toLocaleString('pt-MZ')}
            subtext={`${v.success_rate_percent || s.success_rate || 0}% sucesso`}
            color="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            onClick={() => navigate('/verify')}
          />
          <StatCard
            icon={Building2}
            label="Instituições Activas"
            value={((s.active_institutions || s.institutions_count || 0)).toLocaleString('pt-MZ')}
            subtext={`${(s.total_institutions || s.institutions_count || 0).toLocaleString('pt-MZ')} total`}
            color="bg-violet-500/10 text-violet-400 border border-violet-500/20"
            onClick={() => navigate('/institutions')}
          />
          <StatCard
            icon={Activity}
            label="Logs Totais"
            value={((s.total_logs || s.logs_count || 0)).toLocaleString('pt-MZ')}
            subtext={`${(s.recent_logs_7d || s.recent_logs || 0).toLocaleString('pt-MZ')} últimos 7 dias`}
            color="bg-amber-500/10 text-amber-400 border border-amber-500/20"
            onClick={() => navigate('/audit')}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !hasAnyData && <EmptyState onAction={(to) => navigate(to)} />}

      {/* Charts + Activity */}
      {(hasAnyData || loading) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Verifications Chart */}
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
                data={stats?.verifications_by_day || s.verifications_by_day || []}
                label="Verificações por dia (Global)"
              />
            )}
          </div>

          {/* Actions by Type */}
          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> Acções por tipo
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
            ) : Object.entries(actions).length === 0 ? (
              <div className="text-center py-4">
                <Zap className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Sem dados de acções</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(actions).map(([action, count]) => {
                  const maxCount = Math.max(...Object.values(actions), 1);
                  return (
                    <div key={action} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 uppercase">{action}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500/40 rounded-full transition-all"
                            style={{ width: `${Math.max(5, (count / maxCount) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-300 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {(recentActivity.length > 0 || loading) && (
        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" /> Actividade Recente
            </div>
            <button
              onClick={() => navigate('/audit')}
              className="text-[0.65rem] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              Ver tudo <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-4">
              <Activity className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">Sem actividade recente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((log, i) => (
                <ActivityRow
                  key={i}
                  action={log.action || log.acao || '—'}
                  resource={log.resource || log.recurso || '—'}
                  status={log.status || log.estado || 'success'}
                  user={log.user_email || log.utilizador || log.user || '—'}
                  institution={log.institution_id || log.instituicao}
                  date={log.created_at
                    ? new Date(log.created_at).toLocaleString('pt-MZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                  onClick={() => navigate('/audit')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Success Rate */}
      {(hasAnyData || loading) && (
        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" /> Taxa de sucesso global
            </div>
            <span className="text-lg font-bold text-emerald-400">{v.success_rate_percent || s.success_rate || 0}%</span>
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
            <>
              <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500/40 rounded-full transition-all"
                  style={{ width: `${v.success_rate_percent || s.success_rate || 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[0.65rem] text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {v.success || s.success_count || 0} sucessos
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-400" /> {v.failed || s.failed_count || 0} falhas
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Top Institutions */}
      {(stats?.top_institutions?.length > 0 || loading) && (
        <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Top Instituições
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                  <div className="w-6 h-6 rounded-full bg-white/[0.05]" />
                  <div className="flex-1 space-y-2">
                    <div className="w-20 h-3 rounded bg-white/[0.05]" />
                    <div className="w-12 h-2 rounded bg-white/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.top_institutions.map((inst, i) => (
                <div
                  key={inst.institution_id}
                  onClick={() => navigate('/institutions')}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-[0.6rem] font-bold flex items-center justify-center border border-cyan-500/20">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-300 truncate">{inst.institution_id}</p>
                    <p className="text-[0.6rem] text-slate-500">{inst.count} acções</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
