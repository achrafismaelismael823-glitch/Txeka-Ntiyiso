import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  FileText, ClipboardList, Loader2, AlertTriangle, Search, X,
  ExternalLink, Calendar, Hash, FileCheck, XCircle, ShieldCheck,
  Download, ChevronLeft, ChevronRight, Filter, Inbox, FileCheck2,
  RefreshCw
} from 'lucide-react';

const PAGE_SIZE = 25;

const SkeletonRow = ({ isAdmin }) => (
  <tr className="animate-pulse">
    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-white/[0.05]" /><div className="space-y-1.5"><div className="w-24 h-3 rounded bg-white/[0.05]" /><div className="w-16 h-2 rounded bg-white/[0.05]" /></div></div></td>
    <td className="px-5 py-3.5"><div className="w-16 h-3 rounded bg-white/[0.05]" /></td>
    <td className="px-5 py-3.5"><div className="w-20 h-3 rounded bg-white/[0.05]" /></td>
    {isAdmin && <td className="px-5 py-3.5"><div className="w-12 h-3 rounded bg-white/[0.05]" /></td>}
    <td className="px-5 py-3.5"><div className="w-16 h-3 rounded bg-white/[0.05]" /></td>
    <td className="px-5 py-3.5 text-right"><div className="w-16 h-3 rounded bg-white/[0.05] ml-auto" /></td>
  </tr>
);

const EmptyState = ({ isAdmin, onEmit }) => (
  <div className="px-5 py-16 text-center space-y-4">
    <div className="w-14 h-14 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mx-auto">
      <Inbox className="w-7 h-7 text-cyan-400/50" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-400">
        {isAdmin ? 'Nenhum documento certificado na plataforma' : 'Ainda não certificou nenhum documento'}
      </p>
      <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
        {isAdmin
          ? 'Os documentos aparecerão aqui assim que as instituições começarem a certificar.'
          : 'Certifique o seu primeiro documento digital.'}
      </p>
    </div>
    <button
      onClick={onEmit}
      className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all flex items-center gap-2 mx-auto"
    >
      <FileCheck2 className="w-3.5 h-3.5" /> Certificar Documento
    </button>
  </div>
);

const RevokeModal = ({ doc, onClose, onConfirm, revoking }) => {
  const [reason, setReason] = useState('');
  const getDocId = (d) => d.doc_id || d.id;
  const getDocHash = (d) => d.hash_sha256 || d.doc_hash || d.hash || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10"><ShieldCheck className="w-5 h-5 text-red-400" /></div>
          <h3 className="text-lg font-bold text-slate-100">Revogar Certificação</h3>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Doc ID: <span className="font-mono text-cyan-400">{getDocId(doc) || '—'}</span></p>
          <p className="text-xs text-slate-500">Hash: <span className="font-mono text-cyan-400">{(getDocHash(doc)).substring(0, 24)}...</span></p>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo da revogação (obrigatório)..."
          className="w-full px-4 py-3 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500/30 text-sm min-h-[6rem] resize-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400 hover:bg-white/[0.06] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || revoking}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" />Confirmar</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentsPage = () => {
  const { user, isAdmin, isInstitution, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const searchTimer = useRef(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        action: 'EMIT',
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      };
      if (isInstitution && institutionId) params.institution_id = institutionId;
      if (statusFilter === 'active') params.revoked = false;
      if (statusFilter === 'revoked') params.revoked = true;

      const { data } = await api.get('/api/v1/audit/logs', { params });
      let items = Array.isArray(data) ? data : (data.items || data.logs || []);
      setDocuments(items);
      setTotalCount(data?.count || items.length);
    } catch (err) {
      setError(err.normalizedMessage || 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  }, [isInstitution, institutionId, page, statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {}, 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const handleRevoke = async (reason) => {
    const docId = selectedDoc?.doc_id || selectedDoc?.id;
    if (!docId || !reason.trim()) return;
    try {
      setRevoking(true);
      await api.post(`/api/v1/emissions/${docId}/revoke`, { reason: reason.trim() });
      notify('Certificação revogada com sucesso', 'success');
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao revogar', 'error');
    } finally {
      setRevoking(false);
    }
  };

  const canRevoke = (doc) => {
    if (doc.revoked) return false;
    if (isAdmin) return true;
    if (isInstitution && doc.institution_id === institutionId) return true;
    return false;
  };

  const getDocHash = (doc) => doc.hash_sha256 || doc.doc_hash || doc.hash || '';
  const getDocId = (doc) => doc.doc_id || doc.id;

  const filtered = documents.filter((doc) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (getDocHash(doc)).toLowerCase().includes(term) ||
      (getDocId(doc)).toLowerCase().includes(term) ||
      (doc.institution_id || '').toLowerCase().includes(term) ||
      (doc.document_type || '').toLowerCase().includes(term);
  });

  const exportCSV = () => {
    const headers = ['Doc ID', 'Hash SHA-256', 'Tipo', 'Instituição', 'Data', 'Estado'];
    const rows = filtered.map((d) => [
      getDocId(d),
      getDocHash(d),
      d.document_type || '',
      d.institution_id || '',
      new Date(d.timestamp || d.created_at || Date.now()).toLocaleString('pt-MZ'),
      d.revoked ? 'Revogado' : 'Activo',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documentos-txeka-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Exportação CSV concluída', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Documentos Certificados</h1>
          <p className="text-xs text-slate-500 mt-1">{isAdmin ? 'Histórico global de certificações' : 'Meus documentos certificados'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.1] transition-all text-xs disabled:opacity-30"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 transition-all text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      <div className="bg-slate-900/40 border border-white/[0.04] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" /> Filtros
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por hash, doc ID, tipo ou instituição..."
              className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500/30"
          >
            <option value="">Todos os estados</option>
            <option value="active">Activos</option>
            <option value="revoked">Revogados</option>
          </select>
        </div>
        {(search || statusFilter) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            <button onClick={() => { setSearch(''); setStatusFilter(''); setPage(0); }} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <X className="w-3 h-3" /> Limpar filtros
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.05] text-[0.65rem] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-semibold">Documento</th>
                <th className="px-5 py-3 font-semibold">Doc ID</th>
                <th className="px-5 py-3 font-semibold">Hash SHA-256</th>
                {isAdmin && <th className="px-5 py-3 font-semibold">Instituição</th>}
                <th className="px-5 py-3 font-semibold">Data</th>
                <th className="px-5 py-3 font-semibold text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} isAdmin={isAdmin} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5}>
                    <EmptyState isAdmin={isAdmin} onEmit={() => navigate('/emit')} />
                  </td>
                </tr>
              ) : (
                filtered.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${doc.revoked ? 'bg-red-500/10' : 'bg-cyan-500/10'}`}>
                          <FileText className={`w-4 h-4 ${doc.revoked ? 'text-red-400' : 'text-cyan-400'}`} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-100 font-medium">{doc.document_type || 'Documento'}</p>
                          <p className="text-[0.65rem] text-slate-500">{doc.description || 'Certificação de integridade'}</p>
                          {doc.revoked && <span className="inline-flex items-center gap-1 text-[0.6rem] text-red-400 mt-0.5"><XCircle className="w-3 h-3" /> Revogado</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs font-mono text-slate-300">{getDocId(doc) || '—'}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{(getDocHash(doc)).substring(0, 14)}...</span>
                      </div>
                    </td>
                    {isAdmin && <td className="px-5 py-3.5"><span className="text-xs font-mono text-slate-400 uppercase">{doc.institution_id || '-'}</span></td>}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.timestamp || doc.created_at || Date.now()).toLocaleDateString('pt-MZ')}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`/verify/${getDocHash(doc)}`, '_blank')}
                          className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 transition-colors text-slate-400"
                          title="Verificar"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {canRevoke(doc) && (
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-colors text-slate-400"
                            title="Revogar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Página {page + 1} • {filtered.length} de {totalCount} documentos
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
              disabled={(page + 1) * PAGE_SIZE >= totalCount}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selectedDoc && (
        <RevokeModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onConfirm={handleRevoke}
          revoking={revoking}
        />
      )}
    </div>
  );
};

export default DocumentsPage;

