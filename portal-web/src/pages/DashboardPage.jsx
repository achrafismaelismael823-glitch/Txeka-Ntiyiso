import React from 'react';
import { useQuery } from 'react-query';
import { useOutletContext } from 'react-router-dom';
import { 
  FileText, CheckCircle, CreditCard, Activity
} from 'lucide-react';
import { endpoints } from '../services/api';

const StatCard = ({ icon: Icon, title, value, color = 'cyan' }) => {
  const colors = {
    cyan: 'text-cyan bg-cyan/10 border-cyan/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
  };
  return (
    <div className="card-stat">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-silver-light">{value}</p>
        <p className="text-sm text-silver-dark mt-1">{title}</p>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { addToast } = useOutletContext();
  const { data: dashboard, isLoading } = useQuery('dashboard', endpoints.institutions.me.dashboard, {
    onError: () => addToast('Erro ao carregar painel', 'error'),
  });

  const institution = dashboard?.data?.institution;
  const stats = dashboard?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-silver-light">Painel de Controlo</h1>
          <p className="text-sm text-silver-dark mt-1">Visão geral da sua instituição</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tn-800/60 border border-tn-500/20">
          <Shield className="w-4 h-4 text-cyan" />
          <span className="text-sm text-silver">{institution?.name || '...'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card-stat h-32 animate-pulse bg-tn-700/30" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} title="Total Emitidos" value={stats?.total_emitted || 0} color="cyan" />
          <StatCard icon={CheckCircle} title="Verificações" value={stats?.total_verifications || 0} color="emerald" />
          <StatCard icon={CreditCard} title="Créditos Disponíveis" value={institution?.credits || 0} color="amber" />
          <StatCard icon={Activity} title="Docs este Mês" value={institution?.docs_emitted_month || 0} color="red" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-silver-light mb-4">Informações da Instituição</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-tn-800/50">
              <p className="text-xs text-silver-dark mb-1">ID</p>
              <p className="text-sm font-mono text-silver">{institution?.id}</p>
            </div>
            <div className="p-3 rounded-lg bg-tn-800/50">
              <p className="text-xs text-silver-dark mb-1">Nome</p>
              <p className="text-sm text-silver">{institution?.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-tn-800/50">
              <p className="text-xs text-silver-dark mb-1">Email</p>
              <p className="text-sm text-silver">{institution?.contact_email || 'N/A'}</p>
            </div>
            <div className="p-3 rounded-lg bg-tn-800/50">
              <p className="text-xs text-silver-dark mb-1">Plano</p>
              <span className="badge badge-info capitalize">{institution?.subscription_plan}</span>
            </div>
            <div className="p-3 rounded-lg bg-tn-800/50">
              <p className="text-xs text-silver-dark mb-1">Estado</p>
              <span className={`badge capitalize ${institution?.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                {institution?.status}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-tn-800/50">
              <p className="text-xs text-silver-dark mb-1">Aprovado</p>
              <span className={`badge ${institution?.approved ? 'badge-success' : 'badge-danger'}`}>
                {institution?.approved ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-silver-light mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <a href="/emit" className="flex items-center gap-3 p-3 rounded-lg bg-tn-800/50 hover:bg-cyan/10 border border-transparent hover:border-cyan/30 transition-all group">
              <FileText className="w-5 h-5 text-cyan group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-silver-light">Emitir Documento</p>
                <p className="text-xs text-silver-dark">Certificar novo documento PDF</p>
              </div>
            </a>
            <a href="/verify" className="flex items-center gap-3 p-3 rounded-lg bg-tn-800/50 hover:bg-cyan/10 border border-transparent hover:border-cyan/30 transition-all group">
              <CheckCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-silver-light">Verificar Documento</p>
                <p className="text-xs text-silver-dark">Validar autenticidade via hash</p>
              </div>
            </a>
            <a href="/credits" className="flex items-center gap-3 p-3 rounded-lg bg-tn-800/50 hover:bg-cyan/10 border border-transparent hover:border-cyan/30 transition-all group">
              <CreditCard className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-silver-light">Gerir Créditos</p>
                <p className="text-xs text-silver-dark">Consultar saldo e histórico</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

