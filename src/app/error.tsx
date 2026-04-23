'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error] Server component error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 py-12 text-ink">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-warning"
            aria-hidden
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold">Algo não saiu como o esperado</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Avisamos o time. Você pode tentar de novo ou voltar para o dashboard.
          </p>
          {error.digest && (
            <p className="mt-3 font-mono text-[11px] text-ink-subtle">ref {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Tentar de novo
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Ir para o dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
