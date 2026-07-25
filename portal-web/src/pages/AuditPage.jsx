import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useOutletContext } from 'react-router-dom';
import { Activity, Filter } from 'lucide-react';
import { endpoints } from '../services/api';
import { DataTable } from '../components/ui/DataTable';

const AuditPage = () => {
  const { addToast } = useOutletContext();
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    institution_id: '',
    start_date: '',
    end_date: '',
    limit: 100,
  });

  const { data, isLoading, refetch } = useQuery(
    ['audit-logs', filters],
    () => endpoints.audit.logs(filters),
    { 
      enabled: false,
      onError: () => addToast('Erro ao carregar logs', 'error'),
    }
  );

  const logs = data?.data?.logs || [];

  const actionColors = {
    EMIT: 'badge-success',
    VERIFY: 'badge-info',
    REVOKE: 'badge-danger',
    LOGIN: 'badge-warning',
    EXPORT: 'badge-info',
  };

  const columns = [
    { key: 'timestamp', title: 'Data/Hora', render: (r) => new Date(r.timestamp).toLocaleString('pt-BR') },
    { key: 'action', title: 'Ação', render: (r) => (
      <span className={`badge ${actionColors[r.action] || 'badge-info'}`}>{r.action}</span>
    )},
    { key: 'resource_type', title: 'Recurso', render: (r) => <span className="text-xs uppercase">{r.resource_type}</span> },
    { key: 'user_email', title: 'Utilizador', render: (r) => r.user_email || 'Sistema' },
    { key: 'institution_id', title: 'Instituição', render: (r) => r.institution_id || '-' },
    { key: 'details', title: 'Detalhes', render: (r) => (
      <span className="text-xs text-silver-dark truncate max-w-xs block">{JSON.stringify(r.details || {})}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-silver-light">Auditoria</h1>
          <p className="text-sm text-silver-dark mt-1">Logs de auditoria do sistema</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filtrar
        </button>
      </div>

      <div className="glass-panel p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select 
            value={filters.action} 
            onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
            className="input-field text-sm"
          >
            <option value="">Todas as Ações</option>
            <option value="EMIT">EMIT</option>
            <option value="VERIFY">VERIFY</option>
            <option value="REVOKE">REVOKE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="EXPORT">EXPORT</option>
          </select>
          <select 
            value={filters.resource_type} 
            onChange={(e) => setFilters(f => ({ ...f, resource_type: e.target.value }))}
            className="input-field text-sm"
          >
            <option value="">Todos os Recursos</option>
            <option value="DOCUMENT">DOCUMENT</option>
            <option value="CERTIFICATE">CERTIFICATE</option>
            <option value="INSTITUTION">INSTITUTION</option>
          </select>
          <input
            type="text"
            value={filters.institution_id}
            onChange={(e) => setFilters(f => ({ ...f, institution_id: e.target.value }))}
            placeholder="Instituição"
            className="input-field text-sm"
          />
          <input
            type="datetime-local"
            value={filters.start_date}
            onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value }))}
            className="input-field text-sm"
          />
          <input
            type="datetime-local"
            value={filters.end_date}
            onChange={(e) => setFilters(f => ({ ...f, end_date: e.target.value }))}
            className="input-field text-sm"
          />
        </div>
      </div>

      <div className="glass-panel">
        <DataTable 
          columns={columns} 
          data={logs} 
          emptyText={isLoading ? 'A carregar...' : 'Nenhum log encontrado'}
          keyExtractor={(r, i) => i}
        />
      </div>
    </div>
  );
};

export default AuditPage;

