import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X, Download, ChevronDown } from 'lucide-react';
import { EmptyState } from './EmptyState';

export const DataTable = ({
  columns, data, loading = false, emptyText = 'Nenhum registo encontrado', emptyDescription = 'Não existem dados para exibir neste momento.', emptyAction = null,
  pagination = 'client', pageSize = 10, pageSizeOptions = [5, 10, 25, 50, 100], currentPage: controlledPage, totalItems: controlledTotal, onPageChange, onPageSizeChange,
  sortable = true, defaultSortKey = null, defaultSortDirection = 'asc', selectable = false, selectedIds = [], onSelectionChange, rowKey = 'id',
  filterable = false, globalFilter = false, onRowClick, rowClassName, className = '', title, subtitle, actions,
}) => {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);
  const [sortConfig, setSortConfig] = useState({ key: defaultSortKey, direction: defaultSortDirection });
  const [filters, setFilters] = useState({});
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const page = controlledPage ?? internalPage;
  const pageSizeVal = onPageSizeChange ? pageSize : internalPageSize;

  const filteredData = useMemo(() => {
    if (!data) return [];
    let result = [...data];
    if (globalFilter && globalFilterValue) {
      const search = globalFilterValue.toLowerCase();
      result = result.filter((row) => columns.some((col) => {
        const value = col.filterAccessor ? col.filterAccessor(row) : row[col.key];
        return String(value ?? '').toLowerCase().includes(search);
      }));
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      const col = columns.find((c) => c.key === key);
      result = result.filter((row) => {
        const cellValue = col?.filterAccessor ? col.filterAccessor(row) : row[key];
        return String(cellValue ?? '').toLowerCase().includes(value.toLowerCase());
      });
    });
    return result;
  }, [data, filters, globalFilterValue, globalFilter, columns]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortable) return filteredData;
    const col = columns.find((c) => c.key === sortConfig.key);
    return [...filteredData].sort((a, b) => {
      let aVal = col?.sortAccessor ? col.sortAccessor(a) : a[sortConfig.key];
      let bVal = col?.sortAccessor ? col.sortAccessor(b) : b[sortConfig.key];
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aDate = Date.parse(aVal);
      const bDate = Date.parse(bVal);
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, sortable, columns]);

  const totalItems = controlledTotal ?? sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSizeVal));
  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    if (pagination === 'none') return sortedData;
    if (pagination === 'server') return sortedData;
    const start = (safePage - 1) * pageSizeVal;
    return sortedData.slice(start, start + pageSizeVal);
  }, [sortedData, safePage, pageSizeVal, pagination]);

  const handleSort = useCallback((key) => {
    if (!sortable) return;
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    setInternalPage(1);
  }, [sortable]);

  const handlePageChange = useCallback((newPage) => {
    const p = Math.max(1, Math.min(newPage, totalPages));
    if (onPageChange) onPageChange(p); else setInternalPage(p);
  }, [onPageChange, totalPages]);

  const handlePageSizeChange = useCallback((newSize) => {
    if (onPageSizeChange) onPageSizeChange(newSize); else { setInternalPageSize(newSize); setInternalPage(1); }
  }, [onPageSizeChange]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setInternalPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({}); setGlobalFilterValue(''); setInternalPage(1);
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) => v) || globalFilterValue;

  const allSelected = paginatedData.length > 0 && paginatedData.every((row) => selectedIds.includes(row[rowKey]));
  const someSelected = paginatedData.some((row) => selectedIds.includes(row[rowKey])) && !allSelected;

  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !paginatedData.some((row) => row[rowKey] === id)));
    } else {
      const newIds = paginatedData.map((row) => row[rowKey]);
      onSelectionChange([...new Set([...selectedIds, ...newIds])]);
    }
  }, [allSelected, onSelectionChange, paginatedData, rowKey, selectedIds]);

  const toggleSelectRow = useCallback((id) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter((sid) => sid !== id));
    else onSelectionChange([...selectedIds, id]);
  }, [onSelectionChange, selectedIds]);

  const exportCSV = useCallback(() => {
    const headers = columns.filter((c) => !c.hidden).map((c) => c.label || c.key);
    const rows = sortedData.map((row) => columns.filter((c) => !c.hidden).map((c) => {
      const val = c.exportAccessor ? c.exportAccessor(row) : row[c.key];
      const str = String(val ?? '').replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }, [sortedData, columns]);

  if (loading) {
    return (
      <div className={`rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm overflow-hidden ${className}`}>
        <div className="px-6 py-4 border-b border-white/[0.06] space-y-3">
          <div className="h-5 w-32 bg-white/[0.05] rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/[0.03] rounded animate-pulse" />
        </div>
        <div className="divide-y divide-white/[0.03]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex gap-4">
              {Array.from({ length: Math.min(columns.length, 6) }).map((_, j) => (
                <div key={j} className="h-4 bg-white/[0.05] rounded flex-1 animate-pulse" style={{ animationDelay: `${j * 100}ms` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!paginatedData || paginatedData.length === 0) {
    return (
      <div className={`rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm overflow-hidden ${className}`}>
        {(title || actions) && (
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        <EmptyState variant={hasActiveFilters ? 'search' : 'empty'} title={hasActiveFilters ? 'Nenhum resultado para os filtros aplicados' : emptyText} description={hasActiveFilters ? 'Tente ajustar os critérios de pesquisa.' : emptyDescription} action={hasActiveFilters ? <button onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] transition-all"><X className="w-4 h-4" />Limpar filtros</button> : emptyAction} />
      </div>
    );
  }

  const startItem = (safePage - 1) * pageSizeVal + 1;
  const endItem = Math.min(safePage * pageSizeVal, totalItems);

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm overflow-hidden ${className}`}>
      {(title || subtitle || actions || globalFilter || filterable) && (
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {globalFilter && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input type="text" placeholder="Pesquisar..." value={globalFilterValue} onChange={(e) => { setGlobalFilterValue(e.target.value); setInternalPage(1); }} className="pl-9 pr-8 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 w-48" />
                  {globalFilterValue && <button onClick={() => setGlobalFilterValue('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>}
                </div>
              )}
              {filterable && (
                <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${showFilters || hasActiveFilters ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200'}`}>
                  <Filter className="w-3.5 h-3.5" />Filtros
                  {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-cyan-500 text-[0.6rem] flex items-center justify-center text-slate-950 font-bold">{Object.values(filters).filter(Boolean).length + (globalFilterValue ? 1 : 0)}</span>}
                </
