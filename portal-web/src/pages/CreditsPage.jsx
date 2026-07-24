// Dashboard financeiro — Saldo, histórico de transacções, consumo, gráficos
// Consome /api/v1/institutions/me/credits, /me/credit-history (instituição) ou endpoints admin

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMyCredits, getMyCreditHistory, getCreditHistory } from '../services/api';
import DataTable from '../components/ui/DataTable';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Gift,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const typeIcons = {
  manual_add: ArrowDownCircle,
  bonus: Gift,
  refund: ArrowUpCircle,
  consumption: TrendingDown,
};

const typeColors = {
  manual_add: '#00D2C4',
  bonus: '#8b5cf6',
  refund: '#f59e0b',
  consumption: '#ef4444',
};

const typeLabels = {
  manual_add: 'Adição Manual',
  bonus: 'Bónus',
  refund: 'Reembolso',
  consumption: 'Consumo',
};

export default function CreditsPage() {
  const { isAdmin, institutionId, credits: userCredits } = useAuth();
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let balanceRes, historyRes;
      if (isAdmin && institutionId) {
        // Admin a ver créditos de uma instituição específica (poderia vir de query param)
        balanceRes = await getMyCredits();
        historyRes = await getMyCreditHistory({ limit: 100 });
      } else {
        balanceRes = await getMyCredits();
        historyRes = await getMyCreditHistory({ limit: 100 });
      }
      setBalance(balanceRes.data);
      setHistory(historyRes.data || []);
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dados para gráfico de consumo
  const chartData = React.useMemo(() => {
    const grouped = {};
    history.forEach((tx) => {
      const date = new Date(tx.created_at).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });
      grouped[date] = (grouped[date] || 0) + Math.abs(tx.amount);
    });
    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total }))
      .slice(-14);
  }, [history]);

  const totalAdded = history.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalConsumed = history.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const columns = [
    {
      accessor: 'created_at',
      header: 'Data',
      cell: (row) => <span className="text-xs text-slate-600">{new Date(row.created_at).toLocaleString('pt-MZ')}</span>,
    },
    {
      accessor: 'type',
      header: 'Tipo',
      cell: (row) => {
        const Icon = typeIcons[row.type] || Coins;
        const color = typeColors[row.type] || '#64748b';
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color }} />
            <span className="text-xs font-semibold" style={{ color }}>{typeLabels[row.type] || row.type}</span>
          </div>
        );
      },
    },
    { accessor: 'description', header: 'Descrição', cell: (row) => <span className="text-xs text-slate-600 truncate max-w-[200px]">{row.description || '—'}</span> },
    {
      accessor: 'amount',
      header: 'Montante',
      cell: (row) => (
        <span className={`text-sm font-bold ${row.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.amount > 0 ? '+' : ''}{row.amount}
        </span>
      ),
    },
    { accessor: 'payment_method', header: 'Método', cell: (row) => <span className="text-xs text-slate-400 uppercase">{row.payment_method || '—'}</span> },
    { accessor: 'created_by', header: 'Por', cell: (row) => <span className="text-xs text-slate-500">{row.created_by || 'Sistema'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0B192C] flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#00D2C4]" /> Créditos
          </h2>
          <p className="text-slate-500 text-sm mt-1">Saldo, histórico e consumo de créditos</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:border-[#00D2C4] text-slate-500 transition">
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#00D2C4]/10 rounded-xl">
              <Wallet className="w-6 h-6 text-[#00D2C4]" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Saldo Actual</span>
          </div>
          <p className="text-4xl font-bold text-[#0B192C]">{balance?.credits ?? userCredits ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">créditos disponíveis</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total Adicionado</span>
          </div>
          <p className="text-4xl font-bold text-emerald-600">{totalAdded}</p>
          <p className="text-xs text-slate-400 mt-1">créditos creditados</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total Consumido</span>
          </div>
          <p className="text-4xl font-bold text-rose-600">{totalConsumed}</p>
          <p className="text-xs text-slate-400 mt-1">créditos gastos</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-[#0B192C] mb-4">Movimentação dos Últimos 14 Dias</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === chartData.length - 1 ? '#00D2C4' : '#cbd5e1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Histórico */}
      <div>
        <h3 className="text-lg font-bold text-[#0B192C] mb-4">Histórico de Transacções</h3>
        <DataTable
          columns={columns}
          data={history}
          loading={loading}
          pageSize={10}
          emptyTitle="Nenhuma transacção registada"
          emptySubtitle="O histórico aparecerá após a primeira movimentação."
        />
      </div>
    </div>
  );
}

