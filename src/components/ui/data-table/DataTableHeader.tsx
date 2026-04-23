'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { cn } from '@/lib/cn';
import { InfoIcon } from '../InfoIcon';
import type { DataTableColumn, SortState } from './types';

interface HeaderCellProps<T> {
  col: DataTableColumn<T>;
  active: boolean;
  direction?: 'asc' | 'desc';
  onSortToggle: () => void;
  dndEnabled: boolean;
}

function HeaderCell<T>({ col, active, direction, onSortToggle, dndEnabled }: HeaderCellProps<T>) {
  const sortable = useSortable({ id: col.key, disabled: !dndEnabled });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style: React.CSSProperties = {
    width: col.width,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: dndEnabled ? 'grab' : undefined,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        'px-4 py-2.5 text-xs font-medium text-ink-muted',
        col.align === 'right' && 'text-right',
        col.align === 'center' && 'text-center',
        col.sortable && 'select-none hover:text-ink',
        dndEnabled && 'touch-none',
        col.className,
      )}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}
      {...(dndEnabled ? attributes : {})}
      {...(dndEnabled ? listeners : {})}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1.5',
          col.align === 'right' && 'justify-end',
          col.align === 'center' && 'justify-center',
        )}
        onClick={
          col.sortable
            ? (e) => {
                e.stopPropagation();
                onSortToggle();
              }
            : undefined
        }
        style={col.sortable ? { cursor: 'pointer' } : undefined}
      >
        {col.header}
        {col.tooltip && <InfoIcon tooltip={col.tooltip} />}
        {col.sortable && (
          <span aria-hidden className="text-[10px] text-ink-subtle">
            {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        )}
      </span>
    </th>
  );
}

interface DataTableHeaderProps<T> {
  columns: DataTableColumn<T>[];
  draggableIds: string[];
  selectable: boolean;
  sort: SortState;
  allSelected: boolean;
  someSelected: boolean;
  dndEnabled: boolean;
  stickyHeader: boolean;
  onSortToggle: (key: string) => void;
  onToggleAllPage: () => void;
}

export function DataTableHeader<T>({
  columns,
  draggableIds,
  selectable,
  sort,
  allSelected,
  someSelected,
  dndEnabled,
  stickyHeader,
  onSortToggle,
  onToggleAllPage,
}: DataTableHeaderProps<T>) {
  return (
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
              onChange={onToggleAllPage}
              aria-label="Selecionar todas nesta página"
              className="h-3.5 w-3.5 accent-accent"
            />
          </th>
        )}
        {columns.map((col) => (
          <HeaderCell
            key={col.key}
            col={col}
            active={sort?.key === col.key}
            direction={sort?.direction}
            onSortToggle={() => onSortToggle(col.key)}
            dndEnabled={dndEnabled && draggableIds.includes(col.key)}
          />
        ))}
      </tr>
    </thead>
  );
}
