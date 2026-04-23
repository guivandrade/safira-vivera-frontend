'use client';

import { cn } from '@/lib/cn';
import type { DataTableColumn } from './types';

interface DataTableBodyProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  selectable: boolean;
  selected: Set<string>;
  onToggleRow: (id: string) => void;
  onRowClick?: (row: T) => void;
  emptyLabel: string;
}

export function DataTableBody<T>({
  rows,
  columns,
  rowKey,
  selectable,
  selected,
  onToggleRow,
  onRowClick,
  emptyLabel,
}: DataTableBodyProps<T>) {
  if (rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length + (selectable ? 1 : 0)}
            className="px-4 py-10 text-center text-sm text-ink-muted"
          >
            {emptyLabel}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {rows.map((row) => {
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
              <td className="w-10 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleRow(id)}
                  aria-label="Selecionar linha"
                  className="h-3.5 w-3.5 accent-accent"
                />
              </td>
            )}
            {columns.map((col) => (
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
      })}
    </tbody>
  );
}
