'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { DataTableColumn } from './types';

interface DataTableSummaryProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  selectable: boolean;
  summaryRow?: (rows: T[], columns: DataTableColumn<T>[]) => Record<string, ReactNode>;
  summaryLabel: string;
}

export function DataTableSummary<T>({
  rows,
  columns,
  selectable,
  summaryRow,
  summaryLabel,
}: DataTableSummaryProps<T>) {
  if (!summaryRow || rows.length === 0) return null;

  const summary = summaryRow(rows, columns);

  return (
    <tfoot className="border-t-2 border-line bg-surface-subtle font-medium">
      <tr>
        {selectable && <td className="w-10 px-3 py-2.5" />}
        {columns.map((col, idx) => {
          const content = summary[col.key];
          return (
            <td
              key={col.key}
              className={cn(
                'px-4 py-2.5 text-sm text-ink',
                col.align === 'right' && 'text-right tabular-nums',
                col.align === 'center' && 'text-center',
              )}
            >
              {content ?? (idx === 0 ? <span className="font-semibold">{summaryLabel}</span> : null)}
            </td>
          );
        })}
      </tr>
    </tfoot>
  );
}

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({ page, pageSize, total, onPageChange }: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-muted">
      <span>
        Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
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
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded border border-line px-2 py-1 text-xs hover:bg-surface-subtle disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
