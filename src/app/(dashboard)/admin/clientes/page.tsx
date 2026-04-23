'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAdminAccounts, useImpersonateAccount } from '@/hooks/use-admin-accounts';
import { useToast } from '@/providers/toast-provider';
import type { AdminAccount } from '@/types/admin';

const NICHE_LABEL: Record<string, string> = {
  LOCAL_BUSINESS: 'Negócio local',
  INFOPRODUCT: 'Infoproduto',
  ECOMMERCE: 'E-commerce',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SUSPENDED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ARCHIVED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function AdminClientesPage() {
  const { data, isLoading, error } = useAdminAccounts();
  const router = useRouter();
  const impersonate = useImpersonateAccount();
  const toast = useToast();

  const handleImpersonate = async (account: AdminAccount) => {
    try {
      await impersonate.mutateAsync(account.id);
      toast.success(`Visualizando como ${account.name}`);
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro desconhecido', {
        title: 'Falha ao impersonar',
      });
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Clientes</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Gerencie todos os clientes cadastrados na plataforma.
          </p>
        </div>
        <Link href="/admin/clientes/novo">
          <Button variant="primary">Novo cliente</Button>
        </Link>
      </header>

      {isLoading && <Skeleton />}

      {error && (
        <Card>
          <p className="text-sm text-danger">Erro ao carregar clientes: {error.message}</p>
        </Card>
      )}

      {data && data.length === 0 && (
        <Card>
          <p className="text-sm text-ink-muted">
            Nenhum cliente cadastrado. Clique em &ldquo;Novo cliente&rdquo; pra começar.
          </p>
        </Card>
      )}

      {data && data.length > 0 && (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wider text-ink-subtle">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Nicho</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">OWNER</th>
                <th className="px-4 py-3">Integrações</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((acc) => (
                <tr key={acc.id} className="border-b border-line-subtle last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clientes/${acc.id}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {acc.name}
                    </Link>
                    <div className="text-xs text-ink-subtle">{acc.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {NICHE_LABEL[acc.nicheType] ?? acc.nicheType}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[acc.status] ?? ''}`}
                    >
                      {acc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink">{acc.owner.name}</div>
                    <div className="text-xs text-ink-subtle">{acc.owner.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {acc.hasGoogle && <span className="mr-2">Google</span>}
                    {acc.hasMeta && <span>Meta</span>}
                    {!acc.hasGoogle && !acc.hasMeta && <span className="text-ink-subtle">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleImpersonate(acc)}
                      disabled={impersonate.isPending || acc.status !== 'ACTIVE'}
                    >
                      Visualizar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <Card padding="none">
      <div className="animate-pulse divide-y divide-line-subtle">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 bg-surface-subtle/40" />
        ))}
      </div>
    </Card>
  );
}
