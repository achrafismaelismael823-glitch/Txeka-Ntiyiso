import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const DataTable = ({ columns, data, keyExtractor, emptyText = 'Nenhum registro encontrado' }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-tn-500/30">
      <table className="w-full text-left">
        <thead className="bg-tn-700/50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="table-header">{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-tn-600/30">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-silver-dark text-sm">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={keyExtractor ? keyExtractor(row) : i} className="table-row">
                {columns.map((col) => (
                  <td key={col.key} className="table-cell">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ page, totalPages, onPageChange, totalItems, pageSize }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-tn-500/30">
      <div className="text-sm text-silver-dark">
        Mostrando <span className="font-medium text-silver">{(page - 1) * pageSize + 1}</span> a{' '}
        <span className="font-medium text-silver">{Math.min(page * pageSize, totalItems)}</span> de{' '}
        <span className="font-medium text-silver">{totalItems}</span> resultados
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={page === 1} className="p-2 rounded-lg hover:bg-tn-700/50 disabled:opacity-30">
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="p-2 rounded-lg hover:bg-tn-700/50 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 text-sm font-medium text-cyan bg-cyan/10 rounded-lg">{page}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-tn-700/50 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-tn-700/50 disabled:opacity-30">
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

