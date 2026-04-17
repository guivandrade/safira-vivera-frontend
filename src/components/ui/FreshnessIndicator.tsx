'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface FreshnessIndicatorProps {
  updatedAt: Date | number | null | undefined;
  isFetching?: boolean;
  onRefresh?: () => void;
  className?: string;
}

function relative(updatedAt: number): string {
  const diffMs = Date.now() - updatedAt;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) return 'agora';
  if (diffSec < 60) return `há ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

export function FreshnessIndicator({
  updatedAt,
  isFetching,
  onRefresh,
  className,
}: FreshnessIndicatorProps) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  if (!updatedAt) return null;
  const ms = updatedAt instanceof Date ? updatedAt.getTime() : updatedAt;

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-[11px] text-ink-muted', className)}>
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isFetching ? 'animate-pulse bg-accent' : 'bg-success',
        )}
      />
      <span>
        {isFetching ? 'Atualizando...' : `Atualizado ${relative(ms)}`}
      </span>
      {onRefresh && !isFetching && (
        <button
          type="button"
          onClick={onRefresh}
          className="ml-1 rounded p-0.5 text-ink-subtle hover:text-ink"
          aria-label="Atualizar agora"
          title="Atualizar agora"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      )}
    </div>
  );
}
