'use client';

import { formatNumber } from '@/lib/formatters';

interface LoadMoreButtonProps {
  loaded: number;
  total: number | null;
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
  label?: string;
}

export function LoadMoreButton({
  loaded,
  total,
  hasMore,
  isLoading,
  onClick,
  label = 'itens',
}: LoadMoreButtonProps) {
  const showCount = total !== null && total > 0;
  if (!showCount && !hasMore) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
      <span>
        {showCount ? (
          <>
            Mostrando <strong className="tabular-nums text-ink">{formatNumber(loaded)}</strong>{' '}
            de <strong className="tabular-nums text-ink">{formatNumber(total)}</strong> {label}
          </>
        ) : (
          <>
            <strong className="tabular-nums text-ink">{formatNumber(loaded)}</strong> {label}
          </>
        )}
      </span>
      {hasMore && (
        <button
          type="button"
          onClick={onClick}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Carregando...' : 'Carregar mais'}
        </button>
      )}
    </div>
  );
}
