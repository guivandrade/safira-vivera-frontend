'use client';

import Link from 'next/link';
import { useCurrentAccount } from '@/providers/auth-provider';
import { useAuth } from '@/providers/auth-provider';

/**
 * Banner avisando que o cliente ainda não tem nenhuma plataforma de anúncios
 * conectada. Fica visível em todas as páginas de dashboard até a 1ª
 * integração. Some quando o account tem `hasMeta` ou `hasGoogle = true`.
 *
 * Escondemos pra staff Safira impersonando — staff ajusta feature flags
 * direto no admin, não pela UI do cliente.
 */
export function NoIntegrationsBanner() {
  const { user } = useAuth();
  const currentAccount = useCurrentAccount();

  if (!currentAccount) return null;
  if (currentAccount.hasMeta || currentAccount.hasGoogle) return null;

  const isStaff = user?.isSafiraStaff ?? false;
  const ctaHref = isStaff ? '/admin/clientes' : '/integracoes';
  const ctaLabel = isStaff ? 'Habilitar no admin' : 'Conectar plataforma';

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 md:px-6">
      <div className="min-w-0">
        <strong className="font-semibold">Nenhuma plataforma de anúncios conectada.</strong>{' '}
        <span>Conecte Meta Ads ou Google Ads pra ver métricas reais.</span>
      </div>
      <Link
        href={ctaHref}
        className="shrink-0 rounded border border-amber-400 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-50 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
