import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { NotificationContext } from '../contexts/NotificationContext';
import {
  FileText, ClipboardList, Loader2, AlertTriangle, Search, X,
  ExternalLink, Calendar, Hash, FileCheck, XCircle, ShieldCheck
} from 'lucide-react';

const DocumentsPage = () => {
  const { user, isAdmin, isInstitution, institutionId } = useAuth();
  const { notify } = useContext(NotificationContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  useEffect(() => { fetchDocuments(); }, [isAdmin, isInstitution, institutionId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = { action: 'EMIT', limit: 100 };
      if (isInstitution && institutionId) params.institution_id = institutionId;
      const { data } = await api.get('/api/v1/audit/logs', { params });
      let items = Array.isArray(data) ? data : (data.items || data.logs || []);
      setDocuments(items);
    } catch (err) {
      setError('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    // API espera doc_id no path, não doc_hash
    const docId = selectedDoc?.doc_id || selectedDoc?.id;
    if (!docId || !revokeReason.trim()) return;
    try {
      setRevoking(true);
      await api.post(`/api/v1/emissions/${docId}/revoke`, { reason: revokeReason.trim() });
      notify('Documento revogado com sucesso', 'success');
      setSelectedDoc(null);
      setRevokeReason('');
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
    const term = search.toLowerCase();
    return !term ||
      (getDocHash(doc)).toLowerCase().includes(term) ||
      (getDocId(doc)).toLowerCase().includes(term) ||
      (doc.institution_id || '').toLowerCase().includes(term);
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Documentos Emitidos</h1>
          <p className="text-xs text-slate-500 mt-1">{isAdmin ? 'Histórico global' : 'Meus documentos certificados'}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.05]">
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{filtered.length} documento{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/90">{error}</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por hash, doc ID ou instituição..." className="w-full pl-10 pr-10 py-2.5 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 text-sm" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>}
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.05] text-[0.65rem] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">Documento</th>
                  <th className="px-5 py-3 font-semibold">Doc ID</th>
                  <th className="px-5 py-3 font-semibold">Hash</th>
                  {isAdmin && <th className="px-5 py-3 font-semibold">Instituição</th>}
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10"><FileText className="w-4 h-4 text-cyan-400" /></div>
                        <div>
                          <p className="text-sm text-slate-100 font-medium">{doc.document_type || 'Documento'}</p>
                          <p className="text-[0.65rem] text-slate-500">{doc.description || 'Emissão certificada'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs font-mono text-slate-300">{getDocId(doc) || '—'}</span></td>
                    <td className="px-5 py-3.5"><span className="text-xs font-mono text-slate-400">{(getDocHash(doc)).substring(0, 14)}...</span></td>
                    {isAdmin && <td className="px-5 py-3.5"><span className="text-xs font-mono text-slate-400 uppercase">{doc.institution_id || '-'}</span></td>}
                    <td className="px-5 py-3.5"><div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="w-3 h-3" />{new Date(doc.timestamp || doc.created_at || Date.now()).toLocaleDateString('pt-MZ')}</div></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => window.open(`/verify/${getDocHash(doc)}`, '_blank')} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 transition-colors text-slate-400" title="Verificar"><ExternalLink className="w-4 h-4" /></button>
                        {canRevoke(doc) && (
                          <button onClick={() => setSelectedDoc(doc)} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-colors text-slate-400" title="Revogar"><XCircle className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center"><ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3" /><p className="text-sm text-slate-500">Nenhum documento encontrado</p></div>
        )}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10"><ShieldCheck className="w-5 h-5 text-red-400" /></div>
              <h3 className="text-lg font-bold text-slate-100">Revogar Documento</h3>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Doc ID: <span className="font-mono text-cyan-400">{getDocId(selectedDoc)}</span></p>
              <p className="text-xs text-slate-500">Hash: <span className="font-mono text-cyan-400">{(getDocHash(selectedDoc)).substring(0, 20)}...</span></p>
            </div>
            <textarea value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} placeholder="Motivo da revogação (obrigatório)..." className="w-full px-4 py-3 bg-black/15 border border-white/[0.05] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500/30 text-sm min-h-[6rem] resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setSelectedDoc(null); setRevokeReason(''); }} className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-400 hover:bg-white/[0.06] transition-colors">Cancelar</button>
              <button onClick={handleRevoke} disabled={!revokeReason.trim() || revoking} className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 flex items-center justify-center gap-2">
                {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" />Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;

