'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useColumnOrder } from '@/hooks/use-preferences';
import { useColumnVisibility } from '@/hooks/use-column-visibility';
import { DataTableHeader } from './data-table/DataTableHeader';
import { DataTableToolbar } from './data-table/DataTableToolbar';
import { DataTableBulkBar } from './data-table/DataTableBulkBar';
import { DataTableBody } from './data-table/DataTableBody';
import { DataTablePagination, DataTableSummary } from './data-table/DataTableFooter';
import type { BulkAction, DataTableColumn, SortState } from './data-table/types';

export type { DataTableColumn } from './data-table/types';

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
  /** Persiste colunas ocultas em localStorage + habilita DnD de ordem via /settings/preferences. */
  columnStorageKey?: string;
  /** Habilita seleção múltipla de linhas. */
  selectable?: boolean;
  /** Ações para linhas selecionadas (ex: exportar, pausar). */
  bulkActions?: BulkAction<T>[];
  /** Linha de resumo no rodapé da tabela (ex: totais).
   *  Recebe os dados já filtrados/ordenados, mas antes da paginação. */
  summaryRow?: (
    rows: T[],
    columns: DataTableColumn<T>[],
  ) => Record<string, React.ReactNode>;
  /** Label da linha de resumo. Default: "Total". */
  summaryLabel?: string;
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
  summaryRow,
  summaryLabel = 'Total',
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>(initialSort ?? null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDesktop, setIsDesktop] = useState(true);

  const defaultOrder = useMemo(() => columns.map((c) => c.key), [columns]);
  const { order, setOrder, reset: resetOrder } = useColumnOrder(
    columnStorageKey ?? '__none__',
    defaultOrder,
  );
  const { hidden: hiddenCols, toggle: toggleColumn, reset: resetHidden } =
    useColumnVisibility(columnStorageKey);

  const dndEnabled = !!columnStorageKey && isDesktop;

  // DnD só em viewport >= md — evita conflito com scroll horizontal em mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const orderedColumns = useMemo(() => {
    const byKey = new Map(columns.map((c) => [c.key, c]));
    const effective = columnStorageKey ? order : defaultOrder;
    const out: DataTableColumn<T>[] = [];
    for (const key of effective) {
      const col = byKey.get(key);
      if (col) out.push(col);
    }
    // Segurança: se algum key sumiu do order mas existe em columns (race), append
    for (const col of columns) {
      if (!out.includes(col)) out.push(col);
    }
    return out;
  }, [columns, order, defaultOrder, columnStorageKey]);

  const visibleColumns = useMemo(
    () => orderedColumns.filter((c) => !hiddenCols.has(c.key)),
    [orderedColumns, hiddenCols],
  );

  // IDs reordenáveis pra DnD: apenas colunas visíveis E com draggable != false E hideable != false
  const draggableIds = useMemo(
    () =>
      visibleColumns
        .filter((c) => c.draggable !== false && c.hideable !== false)
        .map((c) => c.key),
    [visibleColumns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...order];
    next.splice(oldIndex, 1);
    next.splice(newIndex, 0, String(active.id));
    setOrder(next);
  };

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

  const toggleSort = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key, direction: 'asc' };
      return null;
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

  const orderIsDefault = useMemo(
    () => order.every((k, i) => k === defaultOrder[i]),
    [order, defaultOrder],
  );

  const handleResetLayout = () => {
    resetOrder();
    resetHidden();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <DataTableToolbar
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setPage(1);
        }}
        columns={columns}
        hiddenCols={hiddenCols}
        onToggleColumn={toggleColumn}
        onResetLayout={handleResetLayout}
        columnStorageKey={columnStorageKey}
        dndEnabled={dndEnabled}
        orderIsDefault={orderIsDefault}
      />

      {selectable && (
        <DataTableBulkBar
          selectedCount={selected.size}
          actions={bulkActions}
          selectedRows={selectedRows}
          onClear={() => setSelected(new Set())}
        />
      )}

      <div className="overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={draggableIds} strategy={horizontalListSortingStrategy}>
            <table className="w-full text-sm">
              <DataTableHeader
                columns={visibleColumns}
                draggableIds={draggableIds}
                selectable={selectable}
                sort={sort}
                allSelected={allSelected}
                someSelected={someSelected}
                dndEnabled={dndEnabled}
                stickyHeader={stickyHeader}
                onSortToggle={toggleSort}
                onToggleAllPage={toggleAllPage}
              />
              <DataTableBody
                rows={paginated}
                columns={visibleColumns}
                rowKey={rowKey}
                selectable={selectable}
                selected={selected}
                onToggleRow={toggleRow}
                onRowClick={onRowClick}
                emptyLabel={emptyLabel}
              />
              <DataTableSummary
                rows={sorted}
                columns={visibleColumns}
                selectable={selectable}
                summaryRow={summaryRow}
                summaryLabel={summaryLabel}
              />
            </table>
          </SortableContext>
        </DndContext>
      </div>

      {pageSize && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={sorted.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
