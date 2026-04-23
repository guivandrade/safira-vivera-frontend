'use client';

import { useState } from 'react';
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
 * Botão "Sair da visualização" chama /auth/exit-impersonation — staff recebe
 * JWT novo sem currentAccountId, continua logado, volta pra /admin/clientes.
 */
export function ImpersonationBanner() {
  const { user, currentAccount } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isExiting, setIsExiting] = useState(false);

  if (!user?.isSafiraStaff || !currentAccount) return null;

  const handleExit = async () => {
    setIsExiting(true);
    try {
      const { data } = await apiClient.post<{
        access_token: string;
        refresh_token: string;
      }>('/auth/exit-impersonation');

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_ACCOUNT);

      // Invalida todas as queries — próxima rota vai refetchar com o JWT novo
      // (sem currentAccountId, pra staff).
      await queryClient.invalidateQueries();
      router.replace('/admin/clientes');
    } catch {
      // Fallback: se o endpoint falhar por qualquer motivo, limpa tudo e manda
      // pro login. Melhor perder a sessão do que deixar staff preso.
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_ACCOUNT);
      queryClient.clear();
      router.replace('/login?returnUrl=%2Fadmin%2Fclientes');
    } finally {
      setIsExiting(false);
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
        disabled={isExiting}
        className="shrink-0 rounded border border-amber-400 bg-white px-2 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900"
      >
        {isExiting ? 'Saindo...' : 'Sair da visualização'}
      </button>
    </div>
  );
}
