'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { InfoIcon } from './InfoIcon';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  tooltip?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => number | string;
  render: (row: T) => ReactNode;
  width?: string;
  /** Coluna pode ser ocultada pelo usuário via config. Default: true. */
  hideable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
  stickyHeader?: boolean;
  initialSort?: { key: string; direction: 'asc' | 'desc' };
  /** Persiste colunas ocultas em localStorage. Chave única por tabela. */
  columnStorageKey?: string;
  /** Habilita seleção múltipla de linhas. */
  selectable?: boolean;
  /** Ações para linhas selecionadas (ex: exportar, pausar). */
  bulkActions?: { label: string; onRun: (rows: T[]) => void; variant?: 'default' | 'danger' }[];
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  searchFilter,
  pageSize,
  onRowClick,
  emptyLabel = 'Nenhum registro encontrado',
  stickyHeader = false,
  initialSort,
  columnStorageKey,
  selectable = false,
  bulkActions = [],
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    initialSort ?? null,
  );
  const [page, setPage] = useState(1);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colConfigOpen, setColConfigOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const configRef = useRef<HTMLDivElement>(null);

  // Hidratação das colunas ocultas
  useEffect(() => {
    if (!columnStorageKey) return;
    try {
      const raw = localStorage.getItem(`safira-cols-${columnStorageKey}`);
      if (raw) setHiddenCols(new Set(JSON.parse(raw)));
    } catch {
      // ignore
    }
  }, [columnStorageKey]);

  useEffect(() => {
    if (!columnStorageKey) return;
    localStorage.setItem(`safira-cols-${columnStorageKey}`, JSON.stringify(Array.from(hiddenCols)));
  }, [hiddenCols, columnStorageKey]);

  useEffect(() => {
    if (!colConfigOpen) return;
    const onClick = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setColConfigOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [colConfigOpen]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenCols.has(c.key)),
    [columns, hiddenCols],
  );

  const filtered = useMemo(() => {
    if (!query || !searchable || !searchFilter) return data;
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => searchFilter(row, q));
  }, [data, query, searchable, searchFilter]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col || !col.sortValue) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va < vb) return sort.direction === 'asc' ? -1 : 1;
      if (va > vb) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sort, columns]);

  const paginated = useMemo(() => {
    if (!pageSize) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;

  const toggleSort = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key, direction: 'asc' };
      return null;
    });
  };

  const toggleColumn = (key: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPageIds = paginated.map(rowKey);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selected.has(id));
  const someSelected = allPageIds.some((id) => selected.has(id)) && !allSelected;

  const toggleAllPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) allPageIds.forEach((id) => next.delete(id));
      else allPageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const selectedRows = useMemo(
    () => data.filter((row) => selected.has(rowKey(row))),
    [data, selected, rowKey],
  );

  const hideableColumns = columns.filter((c) => c.hideable !== false);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {(searchable || columnStorageKey) && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-2">
          {searchable && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-ink-subtle" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xs text-ink-muted hover:text-ink"
                  aria-label="Limpar busca"
                >
                  Limpar
                </button>
              )}
            </>
          )}

          {columnStorageKey && hideableColumns.length > 0 && (
            <div className="relative ml-auto" ref={configRef}>
              <button
                type="button"
                onClick={() => setColConfigOpen((v) => !v)}
                aria-label="Configurar colunas"
                title="Configurar colunas"
                className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface px-2 text-xs text-ink-muted hover:bg-surface-subtle hover:text-ink"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                Colunas
              </button>
              {colConfigOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-line bg-surface p-2 shadow-lg"
                >
                  <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                    Colunas visíveis
                  </p>
                  {hideableColumns.map((col) => (
                    <label
                      key={col.key}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-surface-subtle"
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="h-3.5 w-3.5 accent-accent"
                      />
                      {col.header}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectable && selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-subtle px-4 py-2 text-xs">
          <span className="font-medium text-ink">
            {selected.size} selecionada{selected.size === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  action.onRun(selectedRows);
                  setSelected(new Set());
                }}
                className={cn(
                  'rounded border px-2 py-1 text-xs font-medium',
                  action.variant === 'danger'
                    ? 'border-danger/30 bg-danger/5 text-danger hover:bg-danger/10'
                    : 'border-line bg-surface text-ink-muted hover:text-ink',
                )}
              >
                {action.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded border border-line bg-surface px-2 py-1 text-xs text-ink-muted hover:text-ink"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={cn('bg-surface-subtle', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAllPage}
                    aria-label="Selecionar todas nesta página"
                    className="h-3.5 w-3.5 accent-accent"
                  />
                </th>
              )}
              {visibleColumns.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      'px-4 py-2.5 text-xs font-medium text-ink-muted',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.sortable && 'cursor-pointer select-none hover:text-ink',
                      col.className,
                    )}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                    aria-sort={
                      active
                        ? sort?.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        col.align === 'right' && 'justify-end',
                        col.align === 'center' && 'justify-center',
                      )}
                    >
                      {col.header}
                      {col.tooltip && <InfoIcon tooltip={col.tooltip} />}
                      {col.sortable && (
                        <span aria-hidden className="text-[10px] text-ink-subtle">
                          {active ? (sort?.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-10 text-center text-sm text-ink-muted"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const id = rowKey(row);
                const isSelected = selected.has(id);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'border-t border-line-subtle',
                      onRowClick && 'cursor-pointer hover:bg-surface-subtle',
                      isSelected && 'bg-accent/5',
                    )}
                  >
                    {selectable && (
                      <td
                        className="w-10 px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          aria-label="Selecionar linha"
                          className="h-3.5 w-3.5 accent-accent"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-2.5 text-ink',
                          col.align === 'right' && 'text-right tabular-nums',
                          col.align === 'center' && 'text-center',
                          col.className,
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageSize && sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-muted">
          <span>
            Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} de{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-line px-2 py-1 text-xs hover:bg-surface-subtle disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-line px-2 py-1 text-xs hover:bg-surface-subtle disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
