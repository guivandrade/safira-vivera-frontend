/**
 * Ponto único de captura de erros e eventos pra observabilidade.
 *
 * O bridge com Sentry vive em `src/providers/monitoring-bridge.tsx` e é
 * registrado automaticamente no `RootLayout`. Se `NEXT_PUBLIC_SENTRY_DSN`
 * não estiver setado, tudo cai no stub abaixo (console em dev, no-op em prod).
 */

export interface MonitoringContext {
  componentStack?: string;
  [key: string]: unknown;
}

export interface MonitoringProvider {
  captureException: (err: unknown, context?: MonitoringContext) => void;
  captureMessage: (msg: string, level?: 'info' | 'warning' | 'error') => void;
}

let provider: MonitoringProvider | null = null;
const isDev = process.env.NODE_ENV === 'development';

export function registerMonitoringProvider(p: MonitoringProvider): void {
  provider = p;
}

export function captureException(error: unknown, context?: MonitoringContext): void {
  if (provider) {
    provider.captureException(error, context);
    return;
  }
  if (isDev) {
    // eslint-disable-next-line no-console
    console.error('[monitoring] captureException', error, context);
  }
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
): void {
  if (provider) {
    provider.captureMessage(message, level);
    return;
  }
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`[monitoring:${level}]`, message);
  }
}
