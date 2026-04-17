'use client';

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
    <div className="rounded-lg border border-line bg-surface p-10 text-center">
      <h3 className="text-sm font-semibold text-ink">Nenhum dado disponível</h3>
      <p className="mt-1 text-xs text-ink-muted">
        Conecte uma plataforma ou verifique se há campanhas ativas no período selecionado.
      </p>
    </div>
  );
}
