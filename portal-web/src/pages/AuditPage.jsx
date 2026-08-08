import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  Shield, Search, Filter, RefreshCw, AlertTriangle, Lock,
  Calendar, Clock, User, Building2, FileText, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Eye, BarChart3, Activity, Download
} from 'lucide-react';

const ACTION_COLORS = {
  EMIT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  VERIFY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  REVOKE: 'bg-red-500/10 text-red-400 border-red-500/20',
  LOGIN: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  LOGOUT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  EXPORT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  SYSTEM: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const RESOURCE_COLORS = {
  DOCUMENT: 'bg-cyan-500/10 text-cyan-400',
  CERTIFICATE: 'bg-emerald-500/10 text-emerald-400',
  INSTITUTION: 'bg-amber-500/10 text-amber-400',
};

const AuditPage = () => {
  const { isAdmin } = useAuth();
  const { notify } = useContext(NotificationContext);

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    user_email: '',
    institution_id: '',
    start_date: '',
    end_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Paginação
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchedRef = useRef(false);

  const fetchAudit = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = { limit, offset };
      if (filters.action) params.action = filters.action;
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.user_email) params.user_email = filters.user_email;
      if (filters.institution_id) params.institution_id = filters.institution_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const [logsRes, statsRes] = await Promise.allSettled([
        endpoints.audit.logs(params),
        endpoints.audit.stats({
          institution_id: filters.institution_id || undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        }),
      ]);

      if (logsRes.status === 'fulfilled') {
        const data = logsRes.value.data;
        setLogs(data.items || data.logs || []);
        setTotal(data.total || data.count || 0);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
    } catch (err) {
      setError(err.normalizedMessage || 'Erro ao carregar auditoria');
      notify(err.normalizedMessage || 'Erro ao carregar auditoria', 'error');
    } finally {
      setLoading(false);
      fetchedRef.current = false;
    }
  }, [limit, offset, filters, notify]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchedRef.current = false;
    fetchAudit();
  }, [fetchAudit, isAdmin]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setOffset(0);
  };

  const applyFilters = () => {
    fetchedRef.current = false;
    fetchAudit();
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      resource_type: '',
      user_email: '',
      institution_id: '',
      start_date: '',
      end_date: '',
    });
    setOffset(0);
    fetchedRef.current = false;
    fetchAudit();
  };

  const handleDocumentHistory = async (docHash) => {
    try {
      const { data } = await endpoints.audit.documentHistory(docHash);
      notify(`Histórico do documento carregado`, 'success');
      console.log('Document history:', data);
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao carregar histórico', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Lock className="w-12 h-12 text-slate-600" />
        <h2 className="text-lg font-bold text-slate-400">Acesso Restrito</h2>
        <p className="text-sm text-slate-500">Apenas administradores podem aceder aos logs de auditoria.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Auditoria</h1>
          <p className="text-xs text-slate-500 mt-1">Logs de todas as operações da plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-all ${showFilters ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => { fetchedRef.current = false; fetchAudit(); }}
            disabled={loading}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-cyan-400 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" /> Total
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats.total_operations || total}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> Emissões
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.total_emitted || '—'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> Verificações
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.total_verified || '—'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-[0.65rem] text-slate-500 uppercase tracking-wider">
              <XCircle className="w-3.5 h-3.5" /> Revogações
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.total_revoked || '—'}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[0.65rem] text-slate-500 uppercase">Acção</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
              >
                <option value="">Todas</option>
                <option value="EMIT">EMIT</option>
                <option value="VERIFY">VERIFY</option>
                <option value="REVOKE">REVOKE</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="EXPORT">EXPORT</option>
                <option value="SYSTEM">SYSTEM</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[0.65rem] text-slate-500 uppercase">Tipo de Recurso</label>
              <select
                value={filters.resource_type}
                onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
              >
                <option value="">Todos</option>
                <option value="DOCUMENT">DOCUMENT</option>
                <option value="CERTIFICATE">CERTIFICATE</option>
                <option value="INSTITUTION">INSTITUTION</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[0.65rem] text-slate-500 uppercase">Instituição</label>
              <input
                type="text"
                value={filters.institution_id}
                onChange={(e) => handleFilterChange('institution_id', e.target.value.toUpperCase())}
                placeholder="Ex: CFN"
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30 font-mono uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[0.65rem] text-slate-500 uppercase">Email</label>
              <input
                type="text"
                value={filters.user_email}
                onChange={(e) => handleFilterChange('user_email', e.target.value)}
                placeholder="filtrar por email"
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[0.65rem] text-slate-500 uppercase">Data Início</label>
              <input
                type="datetime-local"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[0.65rem] text-slate-500 uppercase">Data Fim</label>
              <input
                type="datetime-local"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/30"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 rounded-xl text-xs"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.02]" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Shield className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-500">Nenhum log encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Acção</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Recurso</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Utilizador</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Instituição</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Data</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[0.65rem] font-medium border ${ACTION_COLORS[log.action] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[0.65rem] font-medium ${RESOURCE_COLORS[log.resource_type] || 'bg-slate-500/10 text-slate-400'}`}>
                        {log.resource_type || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-600" />
                        <span className="text-xs text-slate-300">{log.user_email || log.user_id || 'anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-slate-600" />
                        <span className="text-xs font-mono text-cyan-400">{log.institution_id || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-xs text-slate-400">
                          {log.created_at ? new Date(log.created_at).toLocaleString('pt-MZ') : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.doc_hash && (
                        <button
                          onClick={() => handleDocumentHistory(log.doc_hash)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-cyan-400 transition-all"
                          title="Ver histórico do documento"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-slate-500">
              {offset + 1}-{Math.min(offset + limit, total)} de {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset(o => Math.max(0, o - limit))}
                disabled={offset === 0}
                className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOffset(o => o + limit)}
                disabled={offset + limit >= total}
                className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditPage;
