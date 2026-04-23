import type { ReactNode } from 'react';

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
  /** Coluna pode ser reordenada via drag. Default: igual a `hideable` (colunas de identidade ficam fixas). */
  draggable?: boolean;
}

export interface BulkAction<T> {
  label: string;
  onRun: (rows: T[]) => void;
  variant?: 'default' | 'danger';
}

export type SortState = { key: string; direction: 'asc' | 'desc' } | null;
