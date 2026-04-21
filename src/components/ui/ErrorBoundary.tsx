'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, { componentStack: info.componentStack ?? undefined });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <DefaultFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto mt-16 max-w-md rounded-lg border border-line bg-surface p-6 text-center"
    >
      <h2 className="text-base font-semibold text-ink">Algo deu errado</h2>
      <p className="mt-2 text-sm text-ink-muted">
        A página encontrou um erro inesperado. Tente recarregar.
      </p>
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
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Recarregar página
        </button>
      </div>
    </div>
  );
}
