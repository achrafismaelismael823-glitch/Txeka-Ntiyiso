// Gestão de documentos — DataTable enterprise, filtros, revogação com modal, paginação
// Consome GET /api/v1/audit/logs (filtrado por EMIT) ou endpoint dedicado futuro

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAuditLogs, revokeDocument } from '../services/api';
import DataTable from '../components/ui/DataTable';
import {
  ShieldCheck,
  Search,
  Ban,
  Eye,
  QrCode,
  AlertTriangle,
  X,
  Loader2,
  Filter,
  RotateCcw
} from 'lucide-react';

const statusBadge = (status) => {
  const styles = {
    VALID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REVOKED: 'bg-rose-50 text-rose-700 border-rose-200',
    EXPIRED: 'bg-amber-50 text-amber-700 border-amber-200',
    INVALID: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.INVALID}`}>
      {status || 'DESCONHECIDO'}
    </span>
  );
};

export default function DocumentsPage() {
  const { isAdmin, institutionId } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revokeModal, setRevokeModal] = useState(null); // { docId, docHash }
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [filterAction, setFilterAction] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        action: 'EMIT',
        limit: 1000,
        ...(isAdmin ? {} : { institution_id: institutionId }),
      };
      const { data } = await getAuditLogs(params);
      // Normalizar dados da audit para formato de tabela
      const normalized = (data?.logs || data || []).map((log, idx) => ({
        id: log.id || idx,
        doc_id: log.doc_id || log.resource_id || '—',
        hash: log.doc_hash || log.hash || '—',
        type: log.document_type || 'DUAT',
        institution: log.institution_id || institutionId,
        created_at: log.created_at,
        status: log.revoked ? 'REVOKED' : 'VALID',
        revoked_reason: log.revoked_reason,
      }));
      setDocuments(normalized);
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleRevoke = async () => {
    if (!revokeModal || !revokeReason.trim()) return;
    setRevoking(true);
    try {
      await revokeDocument(revokeModal.docId, { reason: revokeReason.trim() });
      setDocuments((prev) =>
        prev.map((d) =>
          d.doc_id === revokeModal.docId
            ? { ...d, status: 'REVOKED', revoked_reason: revokeReason.trim() }
            : d
        )
      );
      setRevokeModal(null);
      setRevokeReason('');
    } catch (err) {
      setError(err.userMessage || 'Erro ao revogar documento.');
    } finally {
      setRevoking(false);
    }
  };

  const columns = [
    {
      accessor: 'doc_id',
      header: 'ID do Documento',
      cell: (row) => <span className="font-mono text-xs text-[#0B192C] font-semibold">{row.doc_id}</span>,
    },
    {
      accessor: 'hash',
      header: 'Hash SHA-256',
      cell: (row) => <span className="font-mono text-xs text-slate-500">{row.hash.substring(0, 16)}...</span>,
    },
    { accessor: 'type', header: 'Tipo' },
    ...(isAdmin ? [{ accessor: 'institution', header: 'Instituição' }] : []),
    {
      accessor: 'created_at',
      header: 'Data',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {new Date(row.created_at).toLocaleDateString('pt-MZ')}
        </span>
      ),
    },
    {
      accessor: 'status',
      header: 'Estado',
      cell: (row) => statusBadge(row.status),
    },
    {
      accessor: 'actions',
      header: '',
      sortable: false,
      className: 'w-24',
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`/verify?hash=${row.hash}`, '_blank'); }}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#00D2C4] rounded-lg transition"
            title="Verificar"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status !== 'REVOKED' && (
            <button
              onClick={(e) => { e.stopPropagation(); setRevokeModal({ docId: row.doc_id, docHash: row.hash }); }}
              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition"
              title="Revogar"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filteredDocs = filterAction
    ? documents.filter((d) => (filterAction === 'revoked' ? d.status === 'REVOKED' : d.status === 'VALID'))
    : documents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0B192C] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#00D2C4]" /> Documentos
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestão e revogação de registos criptográficos</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-white border border-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-[#00D2C4]"
          >
            <option value="">Todos</option>
            <option value="valid">Válidos</option>
            <option value="revoked">Revogados</option>
          </select>
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:border-[#00D2C4] text-slate-500 hover:text-[#0B192C] transition"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredDocs}
        loading={loading}
        pageSize={12}
        onRowClick={(row) => window.open(`/verify?hash=${row.hash}`, '_blank')}
        emptyTitle="Nenhum documento emitido"
        emptySubtitle="Os documentos aparecerão aqui após a primeira emissão."
      />

      {/* Modal de Revogação */}
      {revokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0B192C] flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-500" /> Revogar Documento
              </h3>
              <button onClick={() => setRevokeModal(null)} className="p-1 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">ID</p>
              <p className="text-sm font-mono font-bold text-[#0B192C]">{revokeModal.docId}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase mt-2 mb-1">Hash</p>
              <p className="text-xs font-mono text-slate-600">{revokeModal.docHash}</p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Motivo da Revogação *
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Ex: Documento emitido por engano, dados incorrectos..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D2C4] focus:ring-2 focus:ring-[#00D2C4]/20 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRevokeModal(null)}
                className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:border-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRevoke}
                disabled={!revokeReason.trim() || revoking}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {revoking ? <><Loader2 className="w-4 h-4 animate-spin" /> A revogar...</> : <><Ban className="w-4 h-4" /> Confirmar Revogação</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

