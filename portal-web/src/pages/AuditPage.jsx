// Dashboard de auditoria — Filtros avançados, timeline, estatísticas, exportação
// Admin only. Consome GET /api/v1/audit/logs e GET /api/v1/audit/stats

import React, { useState, useEffect } from 'react';
import { getAuditLogs, getAuditStats } from '../services/api';
import DataTable from '../components/ui/DataTable';
import {
  Clock,
  Filter,
  Download,
  AlertCircle,
  Activity,
  FileCheck,
  Search,
  Ban,
  LogIn,
  FileOutput,
  RotateCcw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const actionIcons = {
  EMIT: FileCheck,
  VERIFY: Search,
  REVOKE: Ban,
  LOGIN: LogIn,
  EXPORT: FileOutput,
};

const actionColors = {
  EMIT: '#00D2C4',
  VERIFY: '#3b82f6',
  REVOKE: '#ef4444',
  LOGIN: '#8b5cf6',
  EXPORT: '#f59e0b',
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    institution_id: '',
    user_email: '',
    start_date: '',
    end_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
      params.limit = 500;

      const [logsRes, statsRes] = await Promise.all([
        getAuditLogs(params),
        getAuditStats({
          start_date: filters.start_date,
          end_date: filters.end_date,
          institution_id: filters.institution_id || undefined,
        }),
      ]);

      setLogs(logsRes.data?.logs || logsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar auditoria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    const csv = [
      ['Data', 'Acção', 'Recurso', 'Utilizador', 'Instituição', 'IP', 'Detalhes'].join(','),
      ...logs.map((log) => [
        new Date(log.created_at).toISOString(),
        log.action,
        log.resource_type,
        log.user_email || '—',
        log.institution_id || '—',
        log.ip_address || '—',
        `"${(log.details || '').replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-txeka-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const statCards = stats
    ? [
        { label: 'Total de Eventos', value: stats.total_events || logs.length, color: 'text-[#0B192C]' },
        { label: 'Emissões', value: stats.emissions || 0, color: 'text-[#00D2C4]' },
        { label: 'Verificações', value: stats.verifications || 0, color: 'text-blue-600' },
        { label: 'Revogações', value: stats.revocations || 0, color: 'text-rose-600' },
      ]
    : [];

  const pieData = stats?.by_action
    ? Object.entries(stats.by_action).map(([name, value]) => ({ name, value }))
    : [
        { name: 'EMIT', value: logs.filter((l) => l.action === 'EMIT').length },
        { name: 'VERIFY', value: logs.filter((l) => l.action === 'VERIFY').length },
        { name: 'REVOKE', value: logs.filter((l) => l.action === 'REVOKE').length },
        { name: 'LOGIN', value: logs.filter((l) => l.action === 'LOGIN').length },
      ].filter((d) => d.value > 0);

  const timelineData = React.useMemo(() => {
    const grouped = {};
    logs.forEach((log) => {
      const date = new Date(log.created_at).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, eventos]) => ({ name, eventos }))
      .slice(-14);
  }, [logs]);

  const columns = [
    {
      accessor: 'created_at',
      header: 'Data/Hora',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-600">
            {new Date(row.created_at).toLocaleString('pt-MZ')}
          </span>
        </div>
      ),
    },
    {
      accessor: 'action',
      header: 'Acção',
      cell: (row) => {
        const Icon = actionIcons[row.action] || Activity;
        const color = actionColors[row.action] || '#64748b';
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <span className="text-xs font-bold uppercase" style={{ color }}>{row.action}</span>
          </div>
        );
      },
    },
    { accessor: 'resource_type', header: 'Recurso', cell: (row) => <span className="text-xs text-slate-600">{row.resource_type || '—'}</span> },
    { accessor: 'user_email', header: 'Utilizador', cell: (row) => <span className="text-xs text-slate-600">{row.user_email || '—'}</span> },
    { accessor: 'institution_id', header: 'Instituição', cell: (row) => <span className="text-xs font-mono text-slate-600">{row.institution_id || '—'}</span> },
    { accessor: 'ip_address', header: 'IP', cell: (row) => <span className="text-xs font-mono text-slate-400">{row.ip_address || '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0B192C] flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#00D2C4]" /> Auditoria
          </h2>
          <p className="text-slate-500 text-sm mt-1">Rasto completo de eventos do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
              showFilters ? 'border-[#00D2C4] bg-[#00D2C4]/10 text-[#0B192C]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-[#00D2C4] transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:border-[#00D2C4] text-slate-500 transition"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-[#0B192C] mb-4">Timeline de Eventos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="auditGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D2C4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00D2C4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="eventos" stroke="#00D2C4" strokeWidth={2} fill="url(#auditGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-[#0B192C] mb-4">Distribuição</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={actionColors[entry.name] || '#cbd5e1'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: actionColors[d.name] }} />
                <span className="text-[10px] font-semibold text-slate-600">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
          {[
            { key: 'action', label: 'Acção', options: ['EMIT', 'VERIFY', 'REVOKE', 'LOGIN', 'EXPORT'] },
            { key: 'resource_type', label: 'Recurso', options: ['DOCUMENT', 'CERTIFICATE', 'INSTITUTION'] },
            { key: 'institution_id', label: 'Instituição', type: 'text', placeholder: 'Ex: INAGE' },
            { key: 'user_email', label: 'Email', type: 'text', placeholder: 'utilizador@email.com' },
            { key: 'start_date', label: 'Data Início', type: 'datetime-local' },
            { key: 'end_date', label: 'Data Fim', type: 'datetime-local' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
              {f.options ? (
                <select
                  value={filters[f.key]}
                  onChange={(e) => setFilters((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00D2C4]"
                >
                  <option value="">Todos</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  value={filters[f.key]}
                  onChange={(e) => setFilters((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00D2C4]"
                />
              )}
            </div>
          ))}
          <div className="sm:col-span-3 flex gap-2">
            <button
              onClick={fetchData}
              className="flex-1 bg-[#0B192C] hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={() => {
                setFilters({ action: '', resource_type: '', institution_id: '', user_email: '', start_date: '', end_date: '' });
                fetchData();
              }}
              className="px-6 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:border-slate-300 transition"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pageSize={15}
        emptyTitle="Nenhum evento de auditoria"
        emptySubtitle="Ajuste os filtros ou aguarde novos eventos."
      />
    </div>
  );
}

