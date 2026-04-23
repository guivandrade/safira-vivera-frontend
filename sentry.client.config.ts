import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    // Amostragem conservadora — dashboards têm muito tráfego de ACK e pouca
    // sessão real de usuário final. Aumentar se precisar de mais dados.
    tracesSampleRate: 0.1,
    // Sem replays por enquanto — são pesados em banda.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
