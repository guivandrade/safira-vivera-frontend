import { ConnectionStatusCards } from '@/components/features/campaigns/ConnectionStatusCards';

export const metadata = {
  title: 'Integrações | Vivera',
};

export default function IntegracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Integrações</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Conecte e monitore as plataformas de mídia paga.
        </p>
      </div>
      <ConnectionStatusCards />
    </div>
  );
}
