import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 py-12 text-ink">
      <div className="w-full max-w-md space-y-6 text-center">
        <p className="text-5xl font-bold text-ink-muted">404</p>
        <div>
          <h1 className="text-xl font-semibold">Página não encontrada</h1>
          <p className="mt-2 text-sm text-ink-muted">
            O endereço que você abriu não existe ou foi movido.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Ir para o dashboard
        </Link>
      </div>
    </div>
  );
}
