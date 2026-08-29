import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { useApi } from '../hooks/useApi';
import {
  Shield, FileText, Coins, Activity, TrendingUp,
  AlertCircle, Loader2, ChevronRight, Award, Zap,
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const dashboardApi = useApi({ showErrorToast: true });
  const creditsApi = useApi({ showErrorToast: true });

  useEffect(() => {
    if (!isAuthenticated) return;
    dashboardApi.execute(() => endpoints.me.dashboard());
    creditsApi.execute(() => endpoints.me.credits());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const dashboard = dashboardApi.data;
  const credits = creditsApi.data;

  const stats = [
    {
      label: 'Créditos Disponíveis',
      value: credits?.credits ?? user?.institution?.credits ?? 0,
      icon: Coins,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      action: () => navigate('/credits'),
    },
    {
      label: 'Documentos Emitidos (Mês)',
      value: credits?.docs_emitted_month ?? user?.institution?.docs_emitted_month ?? 0,
      icon: FileText,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      action: () => navigate('/documents'),
    },
    {
      label: 'Total de Emissões',
      value: dashboard?.total_emissions ?? 0,
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      action: () => navigate('/documents'),
    },
    {
      label: 'Verificações Realizadas',
      value: dashboard?.total_verifications ?? 0,
      icon: Activity,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      action: () => navigate('/audit'),
    },
  ];

  const quickActions = [
    { label: 'Emitir Documento', icon: Shield, path: '/emit', color: 'from-cyan-500 to-cyan-600' },
    { label: 'Verificar Documento', icon: Zap, path: '/verify', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Emitir em Lote', icon: FileText, path: '/bulk-emit', color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">
            Bem-vindo, {user?.name || user?.institution?.name || 'Instituição'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {user?.institution?.id && `ID: ${user.institution.id}`}
            {user?.institution?.subscription_plan && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/20">
                {user.institution.subscription_plan}
              </span>
            )}
          </p>
        </div>
        {user?.institution?.status === 'active' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Activo</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.action}
            className={`p-5 rounded-2xl ${stat.bg} border ${stat.border} text-left hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {(dashboardApi.loading || creditsApi.loading) && (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          A carregar dados...
        </div>
      )}
      {(dashboardApi.error || creditsApi.error) && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{dashboardApi.error || creditsApi.error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          Acções Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`p-4 rounded-xl bg-gradient-to-r ${action.color} text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-3`}
            >
              <action.icon className="w-5 h-5" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      {dashboard?.recent_emissions && dashboard.recent_emissions.length > 0 && (
        <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] p-6">
          <h2 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-500" />
            Emissões Recentes
          </h2>
          <div className="space-y-3">
            {dashboard.recent_emissions.map((doc) => (
              <div
                key={doc.doc_id}
                onClick={() => navigate(`/documents/${doc.doc_id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-sm text-slate-200">{doc.doc_id}</p>
                    <p className="text-xs text-slate-500">{doc.document_type} • {new Date(doc.timestamp).toLocaleDateString('pt-MZ')}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
