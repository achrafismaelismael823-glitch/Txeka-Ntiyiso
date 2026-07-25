import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus, FileCheck, ClipboardList, CreditCard,
  Activity, Users, ShieldCheck, TrendingUp,
  AlertCircle, CheckCircle2, Clock, ArrowRight,
  Zap, Globe, Server, Fingerprint, Lock, Hash
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

// ============================================
// CARD DE ESTATÍSTICA
// ============================================

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      relative glass-panel p-5 cursor-pointer group
      hover:bg-[#112240]/60 transition-all duration-300
      ${onClick ? 'hover:-translate-y-0.5 hover:shadow-lg' : ''}
    `}
  >
    <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${color}`} />
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-[0.7rem] font-semibold text-silver-dark/70 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-[#f8fafc] tracking-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-[0.65rem] text-silver-dark/50">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 text-[0.65rem] text-emerald-400/80">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className={`
        p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]
        group-hover:bg-white/[0.06] transition-colors
      `}>
        <Icon className="w-5 h-5 text-[#22d3ee]" />
      </div>
    </div>
  </div>
);

// ============================================
// AÇÃO RÁPIDA
// ============================================

const QuickAction = ({ icon: Icon, label, description, to, color }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-4 w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-[#06b6d4]/5 hover:border-[#06b6d4]/20 transition-all duration-300 group text-left"
    >
      <div className={`p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] group-hover:scale-105 transition-transform`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#f8fafc] group-hover:text-[#22d3ee] transition-colors">
          {label}
        </p>
        <p className="text-[0.65rem] text-silver-dark/50 truncate">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-silver-dark/30 group-hover:text-[#22d3ee] group-hover:translate-x-0.5 transition-all" />
    </button>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (isAdmin) {
          const [auditStatsRes, institutionsRes, auditLogsRes] = await Promise.allSettled([
            api.get('/api/v1/audit/stats'),
            api.get('/api/v1/institutions'),
            api.get('/api/v1/audit/logs?limit=5'),
          ]);

          const auditStats = auditStatsRes.status === 'fulfilled' ? auditStatsRes.data : {};
          const institutions = institutionsRes.status === 'fulfilled' ? institutionsRes.data : [];
          const logs = auditLogsRes.status === 'fulfilled' ? auditLogsRes.data : [];

          setStats({
            totalInstitutions: Array.isArray(institutions) ? institutions.length : (institutions.total || 0),
            totalDocuments: auditStats.total_documents || auditStats.total_emissions || 0,
            totalVerifications: auditStats.total_verifications || 0,
            activeToday: auditStats.active_today || 0,
            pendingApprovals: auditStats.pending_approvals || 0,
            systemHealth: 99.9,
          });

          setRecentLogs(Array.isArray(logs) ? logs.slice(0, 5) : (logs.items || logs.logs || []).slice(0, 5));
          
        } else {
          const [dashboardRes, creditsRes] = await Promise.allSettled([
            api.get('/api/v1/institutions/me/dashboard'),
            api.get('/api/v1/institutions/me/credits'),
          ]);

          const dashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.data : {};
          const credits = creditsRes.status === 'fulfilled' ? creditsRes.data : {};

          setStats({
            documentsEmitted: dashboard.documents_emitted || dashboard.total_emissions || 0,
            documentsVerified: dashboard.documents_verified || dashboard.total_verifications || 0,
            creditsBalance: credits.balance || credits.credits || credits.amount || 0,
            pendingDocuments: dashboard.pending_documents || 0,
            lastEmit: dashboard.last_emit || dashboard.last_emission || null,
            monthlyTrend: dashboard.monthly_trend || '+0%',
          });

          setRecentLogs(dashboard.recent_activity || dashboard.last_emissions || []);
        }
        
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setError('Não foi possível carregar os dados. Tente recarregar.');
        
        setStats(isAdmin ? {
          totalInstitutions: 0, totalDocuments: 0, totalVerifications: 0,
          activeToday: 0, pendingApprovals: 0, systemHealth: 100,
        } : {
          documentsEmitted: 0, documentsVerified: 0, creditsBalance: 0,
          pendingDocuments: 0, lastEmit: null, monthlyTrend: '0%',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/[0.03] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f8fafc] tracking-tight">
            {isAdmin ? 'Painel Administrativo' : 'Painel da Instituição'}
          </h1>
          <p className="text-[0.75rem] text-silver-dark/60 mt-1">
            {isAdmin 
              ? 'Visão global da Infraestrutura Txeka Ntiyiso' 
              : `Bem-vindo, ${user?.name || user?.institution_name || user?.id || 'Instituição'}.`
            }
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/8 border border-purple-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[0.7rem] font-semibold text-purple-400 uppercase tracking-wider">
              Modo Administrador
            </span>
          </div>
        )}
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Instituições Ativas" value={stats?.totalInstitutions || 0} subtitle="Cadastradas" icon={Users} color="from-[#06b6d4] to-[#2dd4bf]" onClick={() => navigate('/institutions')} />
          <StatCard title="Documentos Emitidos" value={stats?.totalDocuments || 0} subtitle="Total histórico" icon={ClipboardList} color="from-emerald-400 to-emerald-600" />
          <StatCard title="Verificações" value={stats?.totalVerifications || 0} subtitle="Validações" icon={FileCheck} color="from-amber-400 to-amber-600" />
          <StatCard title="Ativas Hoje" value={stats?.activeToday || 0} subtitle="Com atividade" icon={Activity} color="from-[#22d3ee] to-[#06b6d4]" />
          <StatCard title="Pendentes" value={stats?.pendingApprovals || 0} subtitle="Aprovações" icon={AlertCircle} color="from-orange-400 to-red-500" onClick={() => navigate('/institutions')} />
          <StatCard title="Saúde do Sistema" value={`${stats?.systemHealth || 100}%`} subtitle="Uptime" icon={Server} color="from-emerald-400 to-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Documentos Emitidos" value={stats?.documentsEmitted || 0} subtitle="Pela instituição" icon={FilePlus} color="from-[#06b6d4] to-[#2dd4bf]" trend={stats?.monthlyTrend} />
          <StatCard title="Verificações" value={stats?.documentsVerified || 0} subtitle="Ao seu hash" icon={FileCheck} color="from-emerald-400 to-emerald-600" />
          <StatCard title="Créditos" value={stats?.creditsBalance || 0} subtitle="Saldo atual" icon={CreditCard} color="from-amber-400 to-amber-600" onClick={() => navigate('/credits')} />
          <StatCard title="Pendentes" value={stats?.pendingDocuments || 0} subtitle="Em processamento" icon={Clock} color="from-orange-400 to-red-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#06b6d4]" />
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction icon={FilePlus} label="Emitir Documento" description="Criar documento autenticado" to="/emit" color="text-[#22d3ee]" />
            <QuickAction icon={FileCheck} label="Verificar Documento" description="Validar por hash" to="/verify" color="text-emerald-400" />
            <QuickAction icon={ClipboardList} label="Meus Documentos" description="Consultar emitidos" to="/documents" color="text-amber-400" />
            <QuickAction icon={CreditCard} label="Gerir Créditos" description="Saldo e histórico" to="/credits" color="text-purple-400" />
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wider flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#06b6d4]" />
              {isAdmin ? 'Logs de Auditoria' : 'Atividade Recente'}
            </h2>
            <div className="glass-panel overflow-hidden">
              {recentLogs.length > 0 ? (
                <div className="divide-y divide-white/[0.03]">
                  {recentLogs.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.action?.includes('EMIT') || item.type === 'emit' ? 'bg-[#06b6d4]/10 text-[#22d3ee]' : item.action?.includes('VERIFY') || item.type === 'verify' ? 'bg-emerald-500/10 text-emerald-400' : item.action?.includes('CREDIT') || item.type === 'credit' ? 'bg-amber-500/10 text-amber-400' : item.action?.includes('LOGIN') || item.type === 'login' ? 'bg-purple-500/10 text-purple-400' : item.action?.includes('REVOKE') ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.03] text-silver-dark/40'}`}>
                        {item.action?.includes('EMIT') || item.type === 'emit' ? <FilePlus className="w-4 h-4" /> : item.action?.includes('VERIFY') || item.type === 'verify' ? <FileCheck className="w-4 h-4" /> : item.action?.includes('CREDIT') || item.type === 'credit' ? <CreditCard className="w-4 h-4" /> : item.action?.includes('LOGIN') || item.type === 'login' ? <Lock className="w-4 h-4" /> : item.action?.includes('REVOKE') ? <AlertCircle className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#f8fafc] truncate">{item.description || item.message || item.action || 'Registo'}</p>
                        <p className="text-[0.65rem] text-silver-dark/50">{item.timestamp || item.created_at || item.date || ''}{item.institution_id ? ` • ${item.institution_id}` : ''}{item.doc_hash ? ` • ${item.doc_hash.substring(0, 16)}...` : ''}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400/50 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <Clock className="w-8 h-8 text-silver-dark/20 mx-auto mb-2" />
                  <p className="text-sm text-silver-dark/40">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#06b6d4]" />
              {isAdmin ? 'Status da Rede' : 'Status da Conta'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm"><span className="text-silver-dark/60">Estado</span><span className="flex items-center gap-1.5 text-emerald-400 text-[0.75rem] font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Ativo</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-silver-dark/60">SSL</span><span className="text-[0.75rem] text-[#22d3ee] font-mono">TLS 1.3</span></div>
              {isAdmin && <div className="flex items-center justify-between text-sm"><span className="text-silver-dark/60">Nós ativos</span><span className="text-[0.75rem] text-[#22d3ee] font-semibold">{stats?.activeToday || 0}</span></div>}
              {!isAdmin && <div className="flex items-center justify-between text-sm"><span className="text-silver-dark/60">Créditos</span><span className="text-[0.75rem] text-amber-400 font-semibold">{stats?.creditsBalance || 0}</span></div>}
            </div>
            <div className="h-px bg-white/[0.05]" />
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[0.65rem] text-silver-dark/40 leading-relaxed text-center">{isAdmin ? 'Modo administrativo ativo. Todas as alterações são registadas em auditoria.' : 'Acesso restrito aos recursos da sua instituição.'}</p>
            </div>
          </div>
          <div className="glass-panel p-4 overflow-hidden">
            <img src="/images/txeka-mockup.png" alt="Txeka Ntiyiso" className="w-full h-auto rounded-lg opacity-80 hover:opacity-100 transition-opacity" draggable={false} />
            <p className="text-[0.6rem] text-silver-dark/30 text-center mt-2 uppercase tracking-wider">Infraestrutura Nacional</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

