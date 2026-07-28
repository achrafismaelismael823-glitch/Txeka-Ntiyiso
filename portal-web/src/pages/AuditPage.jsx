import { useState, useEffect, useContext, useCallback } from 'react';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import {
  Search, Filter, Calendar, RefreshCw, Eye, X, FileText,
  ShieldCheck, AlertTriangle, LogIn, LogOut, Download, Trash2, Settings,
  ChevronLeft, ChevronRight, Activity, CheckCircle2, XCircle, Building2
} from 'lucide-react';

const ACTION_ICONS = {
  EMIT: FileText, VERIFY: ShieldCheck, REVOKE: AlertTriangle,
  LOGIN: LogIn, LOGOUT: LogOut, EXPORT: Download,
  DELETE: Trash2, SYSTEM: Settings,
};

const ACTION_COLORS = {
  EMIT: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  VERIFY: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  REVOKE: 'text-red-400 bg-red-500/10 border-red-500/20',
  LOGIN: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  LOGOUT: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  EXPORT: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  DELETE: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  SYSTEM: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const AuditPage = () => {
  const { notify } = useContext(NotificationContext);
  const { user, isAdmin } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');

  // Paginação
  const [page, setPage] = useState(0);
  const [limit] = useState(25);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit, offset: page * limit };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource_type = resourceFilter;
      if (dateFrom) params.start_date = dateFrom + 'T00:00:00';
      if (dateTo) params.end_date = dateTo + 'T23:59:59';
      if (successFilter) params.success = successFilter === 'true';

      if (isAdmin) {
        // Super Admin: vê tudo, mas pode filtrar por instituição
        if (institutionFilter.trim()) params.institution_id = institutionFilter.trim();
      } else {
        // Instituição: isolada - só vê os seus próprios logs
        params.institution_id = user?.id;
      }

      const { data } = await endpoints.audit.logs(params);
      const items = Array.isArray(data) ? data : data.items || [];
      setLogs(items);
      setHasMore(items.length === limit);
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao carregar logs de auditoria', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, resourceFilter, dateFrom, dateTo, successFilter, institutionFilter, isAdmin, user, notify]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleReset = () => {
    setSearch('');
    setActionFilter('');
    setResourceFilter('');
    setDateFrom('');
    setDateTo('');
    setSuccessFilter('');
    setInstitutionFilter('');
    setPage(0);
  };

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (log.user_email || '').toLowerCase().includes(term) ||
      (log.resource_id || '').toLowerCase().includes(term) ||
      (isAdmin && (log.institution_id || '').toLowerCase().includes(term))
    );
  });

  const baseColumns = [
    {
      key: 'action',
      label: 'Acção',
      render: (row) => {
        const Icon = ACTION_ICONS[row.action] || Activity;
        const colorClass = ACTION_COLORS[row.action] || ACTION_COLORS.SYSTEM;
        return (
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${colorClass}`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{row.action}</span>
          </div>
        );
      },
    },
    {
      key: 'resource_type',
      label: 'Recurso',
      render: (row) => (
        <span className="text-xs text-slate-400 uppercase">{row.resource_type}</span>
      ),
    },
    {
      key: 'resource_id',
      label: 'ID',
      render: (row) => (
        <span className="text-xs font-mono text-slate-300 truncate max-w-[120px] block">
          {row.resource_id}
        </span>
      ),
    },
    {
      key: 'user_email',
      label: 'Utilizador',
      render: (row) => (
        <span className="text-xs text-slate-300">{row.user_email}</span>
      ),
    },
    {
      key: 'success',
      label: 'Estado',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.success ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className={`text-xs ${row.success ? 'text-emerald-400' : 'text-red-400'}`}>
            {row.success ? 'Sucesso' : 'Falha'}
          </span>
        </div>
      ),
    },
    {
      key: 'timestamp',
      label: 'Data/Hora',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.timestamp ? new Date(row.timestamp).toLocaleString('pt-MZ') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-colors"
          title="Ver detalhes"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  // Admin vê coluna extra: Instituição
  const columns = isAdmin
    ? [
        ...baseColumns.slice(0, 4),
        {
          key: 'institution_id',
          label: 'Instituição',
          render: (row) => (
            <span className="text-xs font-mono text-slate-400">{row.institution_id || '—'}</span>
          ),
        },
        ...baseColumns.slice(4),
      ]
    : baseColumns;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Auditoria</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Registo de todas as acções no sistema (Super Admin)'
              : `Registo de acções da instituição ${user?.id || ''}`}
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/20 text-slate-300 hover:text-cyan-400 rounded-xl transition-all text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900/40 border border-white/[0.04] rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500/30"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
          >
            <option value="">Todas as acções</option>
            <option value="EMIT">Emissão</option>
            <option value="VERIFY">Verificação</option>
            <option value="REVOKE">Revogação</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="EXPORT">Exportação</option>
            <option value="DELETE">Eliminação</option>
            <option value="SYSTEM">Sistema</option>
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
          >
            <option value="">Todos os recursos</option>
            <option value="DOCUMENT">Documento</option>
            <option value="INSTITUTION">Instituição</option>
            <option value="USER">Utilizador</option>
            <option value="SYSTEM">Sistema</option>
          </select>
          <select
            value={successFilter}
            onChange={(e) => setSuccessFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
          >
            <option value="">Todos os estados</option>
            <option value="true">Sucesso</option>
            <option value="false">Falha</option>
          </select>

          {/* Filtro de instituição SÓ para Admin */}
          {isAdmin && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                type="text"
                value={institutionFilter}
                onChange={(e) => { setInstitutionFilter(e.target.value); setPage(0); }}
                placeholder="Filtrar por instituição..."
                className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500/30"
              />
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="w-full pl-7 pr-2 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
              />
            </div>
            <div className="relative flex-1">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="w-full pl-7 pr-2 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
              />
            </div>
          </div>
        </div>
        {(actionFilter || resourceFilter || dateFrom || dateTo || successFilter || institutionFilter || search) && (
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyText={isAdmin
            ? "Nenhum registo de auditoria encontrado"
            : "Nenhuma acção registada para a sua instituição"}
        />
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Página {page + 1} • {filtered.length} registos
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de detalhes */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detalhes do Registo"
        maxWidth="max-w-lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Acção</p>
                <p className="font-bold text-slate-100">{selectedLog.action}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Estado</p>
                <div className="flex items-center gap-1.5">
                  {selectedLog.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className={selectedLog.success ? 'text-emerald-400' : 'text-red-400'}>
                    {selectedLog.success ? 'Sucesso' : 'Falha'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Informações</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <p><span className="text-slate-500">Utilizador:</span> <span className="text-slate-200">{selectedLog.user_email}</span></p>
                <p><span className="text-slate-500">Recurso:</span> <span className="text-slate-200">{selectedLog.resource_type}</span></p>
                <p><span className="text-slate-500">ID do Recurso:</span> <span className="font-mono text-cyan-400">{selectedLog.resource_id}</span></p>
                {isAdmin && (
                  <p><span className="text-slate-500">Instituição:</span> <span className="font-mono text-slate-200">{selectedLog.institution_id || '—'}</span></p>
                )}
                <p><span className="text-slate-500">Data:</span> <span className="text-slate-200">{new Date(selectedLog.timestamp).toLocaleString('pt-MZ')}</span></p>
                <p><span className="text-slate-500">IP:</span> <span className="font-mono text-slate-400">{selectedLog.ip_address || '—'}</span></p>
                <p><span className="text-slate-500">Método:</span> <span className="text-slate-200">{selectedLog.request_method || '—'}</span></p>
                <p><span className="text-slate-500">Path:</span> <span className="font-mono text-slate-400 text-[0.65rem]">{selectedLog.request_path || '—'}</span></p>
                <p><span className="text-slate-500">Status HTTP:</span> <span className="text-slate-200">{selectedLog.status_code || '—'}</span></p>
              </div>
            </div>
            {selectedLog.details && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider mb-2">Detalhes</p>
                <pre className="text-[0.65rem] font-mono text-amber-400 overflow-x-auto bg-black/20 rounded-lg p-2">
                  {typeof selectedLog.details === 'string'
                    ? selectedLog.details
                    : JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditPage;
