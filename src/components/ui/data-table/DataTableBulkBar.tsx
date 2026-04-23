'use client';

import { cn } from '@/lib/cn';
import type { BulkAction } from './types';

interface DataTableBulkBarProps<T> {
  selectedCount: number;
  actions: BulkAction<T>[];
  selectedRows: T[];
  onClear: () => void;
}

export function DataTableBulkBar<T>({
  selectedCount,
  actions,
  selectedRows,
  onClear,
}: DataTableBulkBarProps<T>) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-subtle px-4 py-2 text-xs">
      <span className="font-medium text-ink">
        {selectedCount} selecionada{selectedCount === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              action.onRun(selectedRows);
              onClear();
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
          onClick={onClear}
          className="rounded border border-line bg-surface px-2 py-1 text-xs text-ink-muted hover:text-ink"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
