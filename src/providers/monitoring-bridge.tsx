'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { registerMonitoringProvider } from '@/lib/monitoring';

/**
 * Registra o Sentry como provider do `monitoring` do app assim que o client
 * monta. Fica em client component porque `registerMonitoringProvider`
 * persiste o provider numa variável de módulo no runtime.
 *
 * Se `NEXT_PUBLIC_SENTRY_DSN` está vazio, `Sentry.init` (no arquivo
 * `sentry.client.config.ts`) não roda e as chamadas abaixo viram no-op —
 * seguro deixar registrado sempre.
 */
export function MonitoringBridge() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    registerMonitoringProvider({
      captureException: (err, ctx) => {
        Sentry.captureException(err, ctx ? { extra: ctx } : undefined);
      },
      captureMessage: (msg, level) => {
        Sentry.captureMessage(msg, level ?? 'info');
      },
    });
  }, []);
  return null;
}
