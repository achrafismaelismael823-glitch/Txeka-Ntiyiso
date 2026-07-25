import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useOutletContext } from 'react-router-dom';
import { CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { endpoints } from '../services/api';
import { DataTable } from '../components/ui/DataTable';

const CreditsPage = () => {
  const { addToast } = useOutletContext();
  const [page, setPage] = useState(1);

  const { data: creditsData, isLoading: loadingCredits } = useQuery(
    'my-credits',
    endpoints.institutions.me.credits,
    { onError: () => addToast('Erro ao carregar créditos', 'error') }
  );

  const { data: historyData, isLoading: loadingHistory } = useQuery(
    ['credit-history', page],
    () => endpoints.institutions.me.creditHistory({ skip: (page - 1) * 50, limit: 50 }),
    { onError: () => addToast('Erro ao carregar histórico', 'error') }
  );

  const credits = creditsData?.data;
  const history = historyData?.data || [];

  const columns = [
    { key: 'id', title: 'ID', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
    { key: 'type', title: 'Tipo', render: (r) => (
      <span className={`badge ${r.amount > 0 ? 'badge-success' : 'badge-danger'}`}>
        {r.type}
      </span>
    )},
    { key: 'amount', title: 'Quantidade', render: (r) => (
      <span className={`font-mono font-medium ${r.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {r.amount > 0 ? '+' : ''}{r.amount}
      </span>
    )},
    { key: 'description', title: 'Descrição', render: (r) => r.description || '-' },
    { key: 'payment_method', title: 'Pagamento', render: (r) => r.payment_method || '-' },
    { key: 'created_at', title: 'Data', render: (r) => new Date(r.created_at).toLocaleDateString('pt-BR') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-silver-light">Créditos</h1>
        <p className="text-sm text-silver-dark mt-1">Saldo e histórico de transações</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-stat">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center border border-cyan/30">
              <CreditCard className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <p className="text-xs text-silver-dark">Saldo Atual</p>
              <p className="text-2xl font-bold text-silver-light">{loadingCredits ? '...' : credits?.credits || 0}</p>
            </div>
          </div>
        </div>
        <div className="card-stat">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-silver-dark">Estado</p>
              <p className="text-lg font-bold text-silver-light capitalize">{credits?.status || '...'}</p>
            </div>
          </div>
        </div>
        <div className="card-stat">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
              <TrendingDown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-silver-dark">Docs este Mês</p>
              <p className="text-2xl font-bold text-silver-light">{credits?.docs_emitted_month || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="px-6 py-4 border-b border-tn-500/20">
          <h3 className="text-lg font-semibold text-silver-light">Histórico de Transações</h3>
        </div>
        <DataTable 
          columns={columns} 
          data={history} 
          emptyText="Nenhuma transação encontrada"
          keyExtractor={(r) => r.id}
        />
      </div>
    </div>
  );
};

export default CreditsPage;

