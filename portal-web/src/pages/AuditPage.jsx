import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  Activity, Loader2, AlertTriangle, Search, X, FileText,
  Calendar, Hash, Building2, Clock, Filter
} from 'lucide-react';

const AuditPage = () => {
  const { isAdmin, isInstitution, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, EMIT, VERIFY, REVOKE, LOGIN

  useEffect(() => {
    fetchLogs();
  }, [isAdmin, isInstitution, institutionId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { limit: 200 };
      if (filter !== 'ALL') params.action = filter;
      // Instituição só vê os seus logs
      if (isInstitution && institutionId) {
        params.institution_id = institutionId;
      }
      const { data } = await api.get('/api/v1/audit/logs', { params });
      let items = Array.isArray(data) ? data : (data.items || data.logs || []);
      setLogs(items);
    } catch (err) {
      setError('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const filtered = logs.filter((log) => {
    const term = search.toLowerCase();
    return !term ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.institution_id || '').toLowerCase().includes(term) ||
      (log.doc_hash || '').toLowerCase().includes(term) ||
      (log.description || '').toLowerCase().includes(term);
  });

  const actionColors = {
    EMIT: 'bg-cyan-500/10 text-cyan-400',
    VERIFY: 'bg-emerald-500/10 text-emerald-400',
    REVOKE: 'bg-red-500/10 text-red-400',
    LOGIN: 'bg-purple-500/10 text-purple-400',
    BULK_EMIT: 'bg-amber-500/10 text-amber-400',
  };

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
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Auditoria</h1>
        <p className="text-xs text-slate-500 mt-1">Registo completo de actividades da plataforma</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar logs..."
            className="w-full pl-10 pr-10 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/30 text-sm"
          >
            <option value="ALL">Todas</option>
            <option value="EMIT">Emissão</option>
            <option value="VERIFY">Verificação</option>
            <option value="REVOKE">Revogação</option>
            <option value="LOGIN">Login</option>
            <option value="BULK_EMIT">Emissão Massiva</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.05] text-[0.65rem] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">Acção</th>
                  {isAdmin && <th className="px-5 py-3 font-semibold">Instituição</th>}
                  <th className="px-5 py-3 font-semibold">Descrição</th>
                  <th className="px-5 py-3 font-semibold">Hash</th>
                  <th className="px-5 py-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((log, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[0.65rem] font-bold uppercase ${actionColors[log.action] || 'bg-white/[0.03] text-slate-400'}`}>
                        <Activity className="w-3 h-3" />
                        {log.action}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span className="text-xs font-mono text-slate-400 uppercase">{log.institution_id || '-'}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-100">{log.description || '-'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {log.doc_hash ? (
                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-slate-500" />
                          <span className="text-xs font-mono text-cyan-400">{(log.doc_hash).substring(0, 12)}...</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp || log.created_at).toLocaleString('pt-MZ')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Nenhum registo encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditPage;

