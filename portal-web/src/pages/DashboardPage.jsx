import { useState, useEffect, useContext } from 'react';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import { useAuth } from '../hooks/useAuth';
import {
  Activity, FileText, ShieldCheck, AlertTriangle, TrendingUp,
  Users, CheckCircle2, XCircle, BarChart3, Lock
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
  <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3 hover:border-white/[0.1] transition-all">
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

const MiniBarChart = ({ data, label }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
        <BarChart3 className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="flex items-end gap-1 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/40 rounded-t transition-all relative"
              style={{ height: `${max > 0 ? (d.count / max) * 100 : 0}%` }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[0.55rem] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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

const DashboardPage = () => {
  const { notify } = useContext(NotificationContext);
  const { user, isAdmin } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const params = {};
        if (!isAdmin && user?.id) {
          params.institution_id = user.id;
        }
        const { data } = await endpoints.audit.stats(params);
        setStats(data);
      } catch (err) {
        notify(err.normalizedMessage || 'Erro ao carregar estatísticas', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAdmin, user, notify]);

  const s = stats?.summary || {};
  const v = stats?.verifications || {};
  const actions = stats?.actions_by_type || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin ? 'Visão geral da plataforma Txeka Ntiyiso (Super Admin)' : `Instituição: ${user?.name || user?.id}`}
          </p>
        </div>
        {isAdmin && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <Lock className="w-3 h-3" /> Super Admin
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/40 border border-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              label={isAdmin ? "Documentos Emitidos (Global)" : "Documentos Emitidos"}
              value={s.total_emitted_documents?.toLocaleString('pt-MZ') || 0}
              subtext={`${s.active_documents?.toLocaleString('pt-MZ') || 0} activos`}
              color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            />
            <StatCard
              icon={ShieldCheck}
              label={isAdmin ? "Verificações (Global)" : "Verificações"}
              value={s.total_verifications?.toLocaleString('pt-MZ') || 0}
              subtext={`${v.success_rate_percent || 0}% sucesso`}
              color="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            />
            <StatCard
              icon={AlertTriangle}
              label={isAdmin ? "Documentos Revogados (Global)" : "Documentos Revogados"}
              value={s.total_revoked_documents?.toLocaleString('pt-MZ') || 0}
              color="bg-red-500/10 text-red-400 border border-red-500/20"
            />
            <StatCard
              icon={Activity}
              label={isAdmin ? "Logs Totais (Global)" : "Logs da Instituição"}
              value={s.total_logs?.toLocaleString('pt-MZ') || 0}
              subtext={`${s.recent_logs_7d?.toLocaleString('pt-MZ') || 0} últimos 7 dias`}
              color="bg-amber-500/10 text-amber-400 border border-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06]">
              <MiniBarChart
                data={stats?.verifications_by_day || []}
                label={isAdmin ? "Verificações por dia (Global)" : "Verificações por dia (Sua Instituição)"}
              />
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" /> Acções por tipo
              </div>
              <div className="space-y-2.5">
                {Object.entries(actions).length === 0 ? (
                  <p className="text-xs text-slate-600">Sem dados</p>
                ) : (
                  Object.entries(actions).map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 uppercase">{action}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500/40 rounded-full"
                            style={{ width: `${Math.max(5, (count / Math.max(...Object.values(actions))) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-300 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {isAdmin && stats?.top_institutions && stats.top_institutions.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Top Instituições (Global)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.top_institutions.map((inst, i) => (
                  <div key={inst.institution_id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
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
            </div>
          )}

          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isAdmin ? "Taxa de sucesso global" : "Taxa de sucesso da sua instituição"}
              </div>
              <span className="text-lg font-bold text-emerald-400">{v.success_rate_percent || 0}%</span>
            </div>
            <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500/40 rounded-full transition-all" style={{ width: `${v.success_rate_percent || 0}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[0.65rem] text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {v.success || 0} sucessos</span>
              <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> {v.failed || 0} falhas</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;

