import { EmptyStatePlaceholder } from '@/components/ui/EmptyStatePlaceholder';

export const metadata = {
  title: 'Configurações | Vivera',
};

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Configurações</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Preferências da conta e do workspace.</p>
      </div>
      <EmptyStatePlaceholder
        title="Em breve"
        description="Ajustes de perfil, notificações e permissões estarão aqui."
      />
    </div>
  );
}
