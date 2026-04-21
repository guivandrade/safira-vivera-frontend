/**
 * Ponto único de captura de erros e eventos pra observabilidade.
 *
 * Hoje é stub: em dev loga no console, em prod é no-op silencioso.
 *
 * Para ativar Sentry (ou outro provider) sem mexer em chamadores:
 * 1. `npm i @sentry/nextjs` e rodar `npx @sentry/wizard@latest -i nextjs`
 * 2. No layout raiz (ou instrumentation.ts), chame `registerMonitoringProvider`
 *    com funções do Sentry:
 *    ```
 *    import * as Sentry from '@sentry/nextjs';
 *    registerMonitoringProvider({
 *      captureException: (err, ctx) => Sentry.captureException(err, { extra: ctx }),
 *      captureMessage: (msg, level) => Sentry.captureMessage(msg, level),
 *    });
 *    ```
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
