'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { DataTableColumn } from './types';

interface DataTableToolbarProps<T> {
  searchable: boolean;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (q: string) => void;
  columns: DataTableColumn<T>[];
  hiddenCols: Set<string>;
  onToggleColumn: (key: string) => void;
  onResetLayout: () => void;
  columnStorageKey?: string;
  dndEnabled: boolean;
  orderIsDefault: boolean;
}

export function DataTableToolbar<T>({
  searchable,
  searchPlaceholder,
  query,
  onQueryChange,
  columns,
  hiddenCols,
  onToggleColumn,
  onResetLayout,
  columnStorageKey,
  dndEnabled,
  orderIsDefault,
}: DataTableToolbarProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hideable = columns.filter((c) => c.hideable !== false);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!searchable && !columnStorageKey) return null;

  return (
    <div className="flex items-center gap-2 border-b border-line px-4 py-2">
      {searchable && (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4 shrink-0 text-ink-subtle"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="text-xs text-ink-muted hover:text-ink"
              aria-label="Limpar busca"
            >
              Limpar
            </button>
          )}
        </>
      )}

      {columnStorageKey && (
        <div className={cn('relative', !searchable && 'ml-auto')} ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Configurar colunas"
            title="Configurar colunas"
            className="ml-auto inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface px-2 text-xs text-ink-muted hover:bg-surface-subtle hover:text-ink"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              className="h-3.5 w-3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Colunas
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-line bg-surface p-2 shadow-lg"
            >
              <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                Visibilidade
              </p>
              {hideable.map((col) => (
                <label
                  key={col.key}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-surface-subtle"
                >
                  <input
                    type="checkbox"
                    checked={!hiddenCols.has(col.key)}
                    onChange={() => onToggleColumn(col.key)}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  {col.header}
                </label>
              ))}

              {dndEnabled && (
                <>
                  <div className="my-1 border-t border-line-subtle" />
                  <p className="px-2 pt-1 text-[10px] text-ink-subtle">
                    Arraste os títulos das colunas pra reordenar
                  </p>
                </>
              )}

              {!orderIsDefault && (
                <>
                  <div className="my-1 border-t border-line-subtle" />
                  <button
                    type="button"
                    onClick={onResetLayout}
                    className="w-full rounded px-2 py-1.5 text-left text-sm text-ink-muted hover:bg-surface-subtle hover:text-ink"
                  >
                    Restaurar ordem padrão
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
