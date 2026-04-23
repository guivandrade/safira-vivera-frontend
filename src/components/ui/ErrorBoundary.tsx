'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
  errorCode: string | null;
}

/**
 * Gera um identificador curto (base36 timestamp + 4 chars aleatórios) pra
 * o usuário copiar e reportar ao suporte. Evita tela "Algo deu errado" seca
 * sem nada que o time possa cruzar com logs.
 */
function makeErrorCode(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${ts}-${rand}`;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorCode: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, errorCode: makeErrorCode() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, {
      componentStack: info.componentStack ?? undefined,
      errorCode: this.state.errorCode ?? undefined,
    });
  }

  reset = () => {
    this.setState({ error: null, errorCode: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <DefaultFallback
          error={this.state.error}
          errorCode={this.state.errorCode ?? 'UNKNOWN'}
          onReset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

function DefaultFallback({
  error,
  errorCode,
  onReset,
}: {
  error: Error;
  errorCode: string;
  onReset: () => void;
}) {
  const copyCode = () => {
    navigator.clipboard?.writeText(errorCode).catch(() => null);
  };
  return (
    <div
      role="alert"
      className="mx-auto mt-16 max-w-md rounded-lg border border-line bg-surface p-6 text-center"
    >
      <h2 className="text-base font-semibold text-ink">Algo deu errado</h2>
      <p className="mt-2 text-sm text-ink-muted">
        A página encontrou um erro inesperado. Tente recarregar — se persistir, envie o código
        abaixo ao suporte.
      </p>
      <button
        type="button"
        onClick={copyCode}
        title="Clique pra copiar"
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-line bg-surface-muted px-3 py-1.5 font-mono text-xs text-ink hover:bg-surface-subtle"
      >
        <span aria-label="Código de erro">{errorCode}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      </button>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 overflow-auto rounded border border-line bg-surface-muted p-3 text-left text-xs text-ink-muted">
          {error.message}
        </pre>
      )}
      <div className="mt-5 flex justify-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          Tentar de novo
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:brightness-110"
        >
          Recarregar página
        </button>
      </div>
    </div>
  );
}
