import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  FileText, TrendingUp, CreditCard, Activity, ArrowRight,
  FileCheck, XCircle, Loader2, Clock
} from 'lucide-react';

const DashboardPage = () => {
  const { user, isAdmin, isInstitution, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.allSettled([
        api.get('/api/v1/audit/stats'),
        api.get('/api/v1/audit/logs', { params: { limit: 5 } }),
      ]);
      setStats(statsRes.status === 'fulfilled' ? statsRes.data : {});
      const logs = logsRes.status === 'fulfilled' ? logsRes.data : [];
      let items = Array.isArray(logs) ? logs : (logs.items || logs.logs || []);
      
      // Instituição só vê os seus logs
      if (isInstitution && institutionId) {
        items = items.filter((log) => log.institution_id === institutionId);
      }
      setRecent(items);
    } catch {
      notify('Erro ao carregar dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: 'Emissões Totais', value: stats?.total_emissions || 0, icon: FileCheck, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { label: 'Verificações', value: stats?.total_verifications || 0, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Revogações', value: stats?.total_revocations || 0, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'Créditos', value: user?.credits ?? '—', icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hide: isAdmin },
  ].filter((c) => !c.hide);

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
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Visão geral da plataforma Txeka Ntiyiso</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className={`bg-slate-900/60 backdrop-blur-xl border ${card.border} rounded-2xl p-5 relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-full h-[2px] ${card.bg.replace('/10', '')}`} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-3xl font-bold text-slate-100">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Actividade Recente
            </h2>
            <button onClick={() => navigate('/audit')} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              Ver tudo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recent.length > 0 ? (
            <div className="divide-y divide-white/[0.03]">
              {recent.map((log, idx) => (
                <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    log.action === 'EMIT' ? 'bg-cyan-500/10 text-cyan-400' :
                    log.action === 'VERIFY' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.action === 'REVOKE' ? 'bg-red-500/10 text-red-400' :
                    'bg-white/[0.03] text-slate-500'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-100">{log.description || log.message || log.action}</p>
                    <p className="text-[0.65rem] text-slate-500">
                      {log.institution_id && <span className="font-mono uppercase mr-2">{log.institution_id}</span>}
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(log.timestamp || log.created_at).toLocaleString('pt-MZ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-slate-600">Nenhuma actividade recente</div>
          )}
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Acesso Rápido</h2>
          <div className="space-y-2">
            <button onClick={() => navigate('/documents')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-all text-left">
              <FileText className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm font-medium text-slate-100">Documentos</p>
                <p className="text-[0.65rem] text-slate-500">Gerir emissões</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 ml-auto" />
            </button>
            {!isAdmin && (
              <button onClick={() => navigate('/credits')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-all text-left">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-slate-100">Créditos</p>
                  <p className="text-[0.65rem] text-slate-500">Saldo e histórico</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 ml-auto" />
              </button>
            )}
            <button onClick={() => navigate('/emit')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-all text-left">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-100">Emitir Documento</p>
                <p className="text-[0.65rem] text-slate-500">Certificar novo documento</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

