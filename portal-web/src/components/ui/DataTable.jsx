import React from 'react';
import { Loader2 } from 'lucide-react';

export const DataTable = ({ columns, data, loading, emptyText = 'Nenhum registo encontrado' }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-slate-500">{emptyText}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/[0.05] text-[0.65rem] uppercase tracking-wider text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-3 font-semibold" style={col.style}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-3.5 text-sm text-slate-300" style={col.style}>
                  {col.render ? col.render(row, idx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

