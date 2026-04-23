'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface EmptyStateCTAProps {
  variant: 'connect-google' | 'connect-meta' | 'no-data';
  onConnectGoogle?: () => void;
  isConnecting?: boolean;
}

export function EmptyStateCTA({ variant, onConnectGoogle, isConnecting }: EmptyStateCTAProps) {
  if (variant === 'connect-google') {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-google text-sm font-bold text-white">
            G
          </span>
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Conecte o Google Ads para ver o comparativo completo
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              Hoje só aparecem dados do Meta. Conecte o Google para comparar performance.
            </p>
          </div>
        </div>
        {onConnectGoogle && (
          <Button
            size="sm"
            variant="primary"
            onClick={onConnectGoogle}
            disabled={isConnecting}
          >
            {isConnecting ? 'Conectando...' : 'Conectar Google Ads'}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'connect-meta') {
    return (
      <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-500/30 dark:bg-blue-500/10">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-meta text-sm font-bold text-white">
          f
        </span>
        <div>
          <p className="font-medium text-blue-900 dark:text-blue-200">
            Sem dados do Meta Ads no período
          </p>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/80">
            Verifique o token no backend ou se há campanhas ativas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-line bg-surface-muted p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink-subtle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-ink">Sem dados no período selecionado</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
        Tente aumentar o período (ex: últimos 30 dias) ou verifique se há campanhas ativas nas
        plataformas conectadas.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href="/integracoes">
          <Button size="sm" variant="secondary">
            Ver integrações
          </Button>
        </Link>
      </div>
    </div>
  );
}
