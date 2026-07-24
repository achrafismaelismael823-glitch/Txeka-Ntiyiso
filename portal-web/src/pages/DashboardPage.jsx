// Dashboard Enterprise — Cards KPI, graficos Recharts, atividade recente
// Consome /api/v1/institutions/me/dashboard (instituição) ou /api/v1/audit/stats (admin)
// v3.0 — Build-safe. Sem optional chaining, sem codigo duplicado.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMyDashboard, getAuditStats } from '../services/api';
import {
  FileCheck,
  Search,
  Ban,
  Coins,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// ─── Skeleton Loader ─────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
    <div className="h-8 bg-slate-200 rounded w-16" />
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-80">
    <div className="h-4 bg-slate-200 rounded w-32 mb-4" />
    <div className="h-56 bg-slate-100 rounded-xl" />
  </div>
);

// ─── KPI Card Component ──────────────────────────────────────────────
function KpiCard({ title, value, icon: Icon, trend, trendUp, color, subtitle }) {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    violet: 'bg-violet-50 text-violet-600 border-violet-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-[#0B192C] mb-1">{value}</p>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────
export default function DashboardPage() {
  const { isAdmin, institution, displayName, plan } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(function() {
    const fetchData = async function() {
      try {
        var response;
        if (isAdmin) {
          response = await getAuditStats();
        } else {
          response = await getMyDashboard();
        }
        setData(response.data);
      } catch (err) {
        setError(err.userMessage || 'Erro ao carregar dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  // Dados mock para demonstracao quando a API ainda nao tem stats completos
  var totalEmitted = data && data.total_emitted ? data.total_emitted : 28;
  var totalVerifications = data && data.total_verifications ? data.total_verifications : 85;

  const mockChartData = [
    { name: 'Jan', emissoes: 45, verificacoes: 120 },
    { name: 'Fev', emissoes: 52, verificacoes: 145 },
    { name: 'Mar', emissoes: 38, verificacoes: 98 },
    { name: 'Abr', emissoes: 65, verificacoes: 180 },
    { name: 'Mai', emissoes: 48, verificacoes: 132 },
    { name: 'Jun', emissoes: 72, verificacoes: 210 },
    { name: 'Jul', emissoes: totalEmitted, verificacoes: totalVerifications },
  ];

  const planColors = {
    standard: '#64748b',
    premium: '#f59e0b',
    enterprise: '#8b5cf6',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(function(i) { return <CardSkeleton key={i} />; })}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
        <Activity className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-rose-800 mb-2">Erro ao carregar dashboard</h3>
        <p className="text-rose-600 text-sm">{error}</p>
      </div>
    );
  }

  var stats;
  if (isAdmin) {
    stats = {
      emitidos: data && data.total_emissions ? data.total_emissions : 0,
      verificacoes: data && data.total_verifications ? data.total_verifications : 0,
      revogados: data && data.total_revoked ? data.total_revoked : 0,
      instituicoes: data && data.total_institutions ? data.total_institutions : 0,
    };
  } else {
    var docsEmittedMonth = data && data.institution && data.institution.docs_emitted_month ? data.institution.docs_emitted_month : 0;
    var credits = data && data.institution && data.institution.credits ? data.institution.credits : 0;
    stats = {
      emitidos: data && data.total_emitted ? data.total_emitted : 0,
      verificacoes: data && data.total_verifications ? data.total_verifications : 0,
      revogados: Math.floor(docsEmittedMonth * 0.05),
      creditos: credits,
    };
  }

  var planColor = planColors[plan] || planColors.standard;
  var creditsHistory = data && data.credits_history ? data.credits_history : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0B192C]">Ola, {displayName}</h2>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('pt-MZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Coins className="w-5 h-5 text-[#00D2C4]" />
            <span className="text-sm font-semibold text-[#0B192C]">{stats.creditos} creditos</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: planColor + '20', color: planColor }}>
              {plan}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Documentos Emitidos"
          value={stats.emitidos}
          icon={FileCheck}
          trend={12}
          trendUp={true}
          color="emerald"
          subtitle="Total acumulado"
        />
        <KpiCard
          title="Verificacoes"
          value={stats.verificacoes}
          icon={Search}
          trend={8}
          trendUp={true}
          color="blue"
          subtitle="Escaneamentos QR"
        />
        <KpiCard
          title="Revogados"
          value={stats.revogados}
          icon={Ban}
          trend={2}
          trendUp={false}
          color="rose"
          subtitle="Documentos invalidados"
        />
        <KpiCard
          title={isAdmin ? 'Instituicoes' : 'Creditos Restantes'}
          value={isAdmin ? stats.instituicoes : stats.creditos}
          icon={isAdmin ? Activity : Coins}
          color="violet"
          subtitle={isAdmin ? 'Registadas no sistema' : 'Disponiveis para emissao'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Emissoes vs Verificacoes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-[#0B192C] mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00D2C4]" /> Emissoes vs Verificacoes
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="colorEmis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D2C4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D2C4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B192C" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0B192C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="emissoes" stroke="#00D2C4" strokeWidth={2} fillOpacity={1} fill="url(#colorEmis)" name="Emissoes" />
              <Area type="monotone" dataKey="verificacoes" stroke="#0B192C" strokeWidth={2} fillOpacity={1} fill="url(#colorVerif)" name="Verificacoes" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Consumo de Creditos / Distribuicao */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-[#0B192C] mb-6 flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#00D2C4]" /> {isAdmin ? 'Actividade por Instituicao' : 'Consumo Mensal'}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="emissoes" radius={[6, 6, 0, 0]} name="Emissoes">
                {mockChartData.map(function(entry, index) {
                  return <Cell key={`cell-${index}`} fill={index === mockChartData.length - 1 ? '#00D2C4' : '#cbd5e1'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actividade Recente */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-[#0B192C] mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#00D2C4]" /> Actividade Recente
        </h3>
        {creditsHistory.length > 0 ? (
          <div className="space-y-3">
            {creditsHistory.slice(0, 5).map(function(tx, idx) {
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${tx.amount > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-[#0B192C]">{tx.description || 'Transaccao'}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleString('pt-MZ')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} creditos
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sem actividade recente para exibir.</p>
          </div>
        )}
      </div>
    </div>
  );
}

