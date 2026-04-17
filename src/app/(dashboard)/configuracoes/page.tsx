import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'Configurações | Vivera',
};

export default function ConfiguracoesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Configurações</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Preferências da conta e do workspace.</p>
      </div>

      <div className="space-y-3">
        <Link href="/configuracoes/clinica">
          <Card padding="md" className="group cursor-pointer transition-colors hover:border-accent/40 hover:bg-surface-subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Clínica</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Endereço, raio de análise e geocoding
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-ink" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </Card>
        </Link>

        <Link href="/integracoes">
          <Card padding="md" className="group cursor-pointer transition-colors hover:border-accent/40 hover:bg-surface-subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Integrações</p>
                <p className="mt-0.5 text-xs text-ink-muted">Meta Ads e Google Ads</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-ink" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
