'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { useAuth } from '@/providers/auth-provider';

/**
 * Exibe banner fixo no topo quando staff Safira está impersonando um cliente.
 * Fonte de verdade: `user.isSafiraStaff && currentAccount !== null`.
 * Staff sem currentAccount está fora de impersonação — está na lista admin.
 *
 * Botão "Sair" chama /auth/logout-all (ou apenas logout no token atual?) —
 * escolha mais segura aqui é logout simples + clearar impersonation flag,
 * sem invalidar todas as sessões (staff pode estar logado em outra aba).
 */
export function ImpersonationBanner() {
  const { user, currentAccount } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!user?.isSafiraStaff || !currentAccount) return null;

  const handleExit = async () => {
    try {
      // Logout do token corrente (o que tem currentAccountId fixado).
      // Staff precisa re-login ou voltar via /admin/clientes; aqui o fluxo
      // mais direto é limpar tokens + ir pra /login.
      await apiClient.post('/auth/logout').catch(() => null);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_ACCOUNT);
      queryClient.clear();
      router.replace('/login?returnUrl=%2Fadmin%2Fclientes');
    }
  };

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 md:px-6">
      <div className="min-w-0 truncate">
        <strong className="font-semibold">Visualizando como cliente:</strong>{' '}
        <span>{currentAccount.name}</span>
      </div>
      <button
        type="button"
        onClick={handleExit}
        className="shrink-0 rounded border border-amber-400 bg-white px-2 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-50 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900"
      >
        Sair da visualização
      </button>
    </div>
  );
}
