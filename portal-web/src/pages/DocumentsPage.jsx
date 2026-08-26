import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { endpoints } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  FileText, Search, ShieldCheck, XCircle, AlertTriangle, RefreshCw, Ban,
  Trash2, Clock, Hash, Building2, ChevronLeft, ChevronRight,
  Lock
} from 'lucide-react';

/** Listagem de emissões via auditoria (exclusivo de admin).
 *  Usa /audit/logs?action=EMIT — endpoint admin-only do backend.
 */

const DocumentsPage = () => {
  const { isAdmin, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Paginação
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Modal de revogação
  const [revokeModal, setRevokeModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const fetchedRef = useRef(false);

  const fetchDocuments = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Admin: listar emissões via /audit/logs (endpoint admin-only do backend)
      const params = { action: 'EMIT', limit, offset };
      if (isAdmin && institutionId) {
        params.institution_id = institutionId;
      }

      const response = await endpoints.audit.logs(params);
      const items = response.data?.logs || [];

      // Normalizar logs de emissão para formato de documento
      const normalizedDocs = items.map((item, idx) => {
        let details = {};
        if (item.details) {
          try {
            details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
          } catch {
            details = {};
          }
        }
        return {
          id: item.id || idx,
          doc_id: details.doc_id || item.resource_id || '—',
          doc_hash: item.resource_id || '—',
          institution_id: item.institution_id || '—',
          document_type: details.document_type || '—',
          file_name: details.file_name || null,
          created_at: item.created_at || item.timestamp || null,
          user_email: item.user_email || '—',
          status: 'emitted',
          revoked: false,
          revoked_at: null,
          revoked_reason: null,
          certificate_url: null,
        };
      });

      setDocuments(normalizedDocs);
      setTotal(response.data.count || response.data.total || 0);
    } catch (err) {
      setError(err.normalizedMessage || 'Erro ao carregar documentos');
      notify(err.normalizedMessage || 'Erro ao carregar documentos', 'error');
    } finally {
      setLoading(false);
      fetchedRef.current = false;
    }
  }, [limit, offset, isAdmin, institutionId, notify]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchDocuments();
  }, [fetchDocuments]);

  const handleRevoke = async () => {
    if (!selectedDoc?.doc_id || !revokeReason.trim()) {
      notify('Doc ID e motivo são obrigatórios', 'error');
      return;
    }
    try {
      setRevoking(true);
      await endpoints.emissions.revoke(selectedDoc.doc_id, revokeReason.trim().substring(0, 255));
      notify('Documento revogado com sucesso', 'success');
      setRevokeModal(false);
      setRevokeReason('');
      setSelectedDoc(null);
      fetchedRef.current = false;
      fetchDocuments();
    } catch (err) {
      notify(err.normalizedMessage || 'Erro ao revogar documento', 'error');
    } finally {
      setRevoking(false);
    }
  };

  const openRevokeModal = (doc) => {
    setSelectedDoc(doc);
    setRevokeReason('');
    setRevokeModal(true);
  };

  const filteredDocs = documents.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (d.doc_id?.toLowerCase().includes(s)) ||
      (d.doc_hash?.toLowerCase().includes(s)) ||
      (d.institution_id?.toLowerCase().includes(s)) ||
      (d.document_type?.toLowerCase().includes(s))
    );
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Documentos</h1>
          <p className="text-xs text-slate-500 mt-1">Documentos emitidos e certificados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchedRef.current = false; fetchDocuments(); }}
            disabled={loading}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-cyan-400 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por Doc ID, hash, instituição ou tipo..."
          className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.02]" />
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-500">Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Doc ID</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Tipo</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Estado</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Hash</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Instituição</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Data</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium">Revogação</th>
                  <th className="px-4 py-3 text-[0.6rem] text-slate-500 uppercase tracking-wider font-medium text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredDocs.map((doc, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-cyan-400">{doc.doc_id}</span>
                    </td>
                    <td className="px-4 py-3">
                    </td>
                    <td className="px-4 py-3">
                      {doc.revoked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[0.65rem] font-medium text-red-400">
                          <Ban className="w-3 h-3" /> Revogado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[0.65rem] font-medium text-emerald-400">
                          <ShieldCheck className="w-3 h-3" /> Válido
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-slate-600" />
                        <span className="text-xs font-mono text-slate-400 truncate max-w-[120px]">
                          {doc.doc_hash ? doc.doc_hash.substring(0, 16) + '...' : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-slate-600" />
                        <span className="text-xs text-slate-300">{doc.institution_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-xs text-slate-400">
                          {doc.created_at ? new Date(doc.created_at).toLocaleString('pt-MZ') : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {doc.revoked ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Ban className="w-3 h-3 text-red-400" />
                            <span className="text-[0.65rem] text-red-400 font-medium">
                              {doc.revoked_at ? new Date(doc.revoked_at).toLocaleString('pt-MZ') : '—'}
                            </span>
                          </div>
                          {doc.revoked_reason && (
                            <p className="text-[0.6rem] text-slate-500 truncate max-w-[140px]" title={doc.revoked_reason}>
                              {doc.revoked_reason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/verify/${doc.doc_hash}`)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-blue-400 transition-all"
                          title="Verificar"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        {!doc.revoked && (
                          <button
                            onClick={() => openRevokeModal(doc)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-red-400 transition-all"
                            title={doc.revoked ? "Documento já revogado" : "Revogar"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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

      {/* Revoke Modal */}
      {revokeModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-400">Revogar Documento</h3>
                <p className="text-xs text-slate-500 break-all">{selectedDoc.doc_id}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
              <p className="text-xs text-red-400/90">
                <strong>Atenção:</strong> A revogação é irreversível. O documento será marcado como inválido em todas as verificações futuras.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Motivo da revogação</label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Ex: Erro de dados, documento falsificado, duplicado..."
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500/30 text-sm resize-none h-24"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setRevokeModal(false); setSelectedDoc(null); }}
                className="flex-1 py-3 bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200 rounded-xl transition-all text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking || !revokeReason.trim()}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 disabled:opacity-30 text-slate-950 font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {revoking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Revogar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
