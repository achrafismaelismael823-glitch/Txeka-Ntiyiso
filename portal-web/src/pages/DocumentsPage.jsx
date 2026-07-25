import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useOutletContext } from 'react-router-dom';
import { Search, FileText, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { endpoints } from '../services/api';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';

const DocumentsPage = () => {
  const { addToast } = useOutletContext();
  const [search, setSearch] = useState('');
  const [revokeDoc, setRevokeDoc] = useState(null);
  const [reason, setReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const { data: auditData, isLoading } = useQuery(
    ['audit-logs', { action: 'EMIT', limit: 100 }],
    () => endpoints.audit.logs({ action: 'EMIT', limit: 100 }),
    { onError: () => addToast('Erro ao carregar documentos', 'error') }
  );

  const documents = auditData?.data?.logs || [];

  const handleRevoke = async () => {
    if (!reason.trim()) {
      addToast('Informe o motivo da revogação', 'warning');
      return;
    }
    setRevoking(true);
    try {
      await endpoints.emissions.revoke(revokeDoc.doc_id, { reason });
      addToast('Documento revogado com sucesso', 'success');
      setRevokeDoc(null);
      setReason('');
    } catch (err) {
      addToast(err.response?.data?.detail?.[0]?.msg || 'Erro ao revogar', 'error');
    } finally {
      setRevoking(false);
    }
  };

  const columns = [
    { key: 'doc_id', title: 'Doc ID', render: (r) => <span className="font-mono text-xs">{r.doc_id || r.resource_id}</span> },
    { key: 'document_type', title: 'Tipo', render: (r) => <span className="badge badge-info">{r.document_type || 'DUAT'}</span> },
    { key: 'institution_id', title: 'Instituição' },
    { key: 'created_at', title: 'Data', render: (r) => new Date(r.created_at || r.timestamp).toLocaleDateString('pt-BR') },
    { key: 'status', title: 'Estado', render: (r) => (
      <span className={`badge ${r.revoked ? 'badge-danger' : 'badge-success'}`}>
        {r.revoked ? 'Revogado' : 'Válido'}
      </span>
    )},
    { key: 'actions', title: 'Ações', render: (r) => (
      <button 
        onClick={() => setRevokeDoc(r)} 
        disabled={r.revoked}
        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Revogar"
      >
        <XCircle className="w-4 h-4" />
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-silver-light">Documentos</h1>
          <p className="text-sm text-silver-dark mt-1">Gerencie e revogue documentos emitidos</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-dark" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar documento..."
            className="input-field pl-9 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="glass-panel">
        <DataTable 
          columns={columns} 
          data={documents} 
          emptyText="Nenhum documento encontrado"
          keyExtractor={(r) => r.id || r.doc_id}
        />
      </div>

      <Modal isOpen={!!revokeDoc} onClose={() => setRevokeDoc(null)} title="Revogar Documento" size="sm">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">Atenção</p>
              <p className="text-xs text-red-300/70">Esta ação é irreversível. O documento será marcado como revogado.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-silver mb-2">Motivo da Revogação</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo..."
              rows={3}
              className="input-field resize-none"
              maxLength={255}
            />
            <p className="text-xs text-silver-dark mt-1 text-right">{reason.length}/255</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRevokeDoc(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleRevoke} disabled={revoking} className="btn-danger flex-1 flex items-center justify-center gap-2">
              {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {revoking ? 'A revogar...' : 'Confirmar Revogação'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsPage;

