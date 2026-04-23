'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { useAuthMe } from '@/hooks/use-auth-me';
import type {
  MeAccount,
  MeCurrentAccount,
  MeResponse,
  MeUser,
  Permission,
} from '@/types/auth-me';

/**
 * Estado derivado do `/auth/me` disponibilizado em qualquer componente
 * dentro do `(dashboard)` layout via `useAuth()`.
 *
 * Três estados principais:
 * - `loading`: primeira carga, nenhum dado disponível
 * - `ready`: user + currentAccount disponíveis (caso "feliz" do usuário)
 * - `orphan`: user autenticado mas sem accounts (acesso revogado, NÃO staff)
 *
 * O próprio guard de rota (`AuthGuard`) renderiza tela de "acesso revogado"
 * quando `orphan` — providers de contexto só expõem o estado sem decidir UI.
 */
interface AuthContextValue {
  user: MeUser | null;
  currentAccount: MeCurrentAccount | null;
  accounts: MeAccount[];
  isLoading: boolean;
  isReady: boolean;
  isOrphan: boolean;
  error: Error | null;

  /** Verifica permissão no currentAccount. Staff sempre passa. */
  can: (permission: Permission) => boolean;

  /** Troca o account ativo. Invalida queries dependentes. */
  switchAccount: (accountId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useAuthMe();

  const can = useCallback(
    (permission: Permission): boolean => {
      const perms = data?.currentAccount?.permissions;
      if (!perms) return false;
      return perms[permission] === true;
    },
    [data],
  );

  const switchAccount = useCallback(
    async (accountId: string) => {
      const { data: result } = await apiClient.post<{
        access_token: string;
        refresh_token: string;
      }>('/auth/switch-account', { accountId });

      // Troca tokens no localStorage — a estratégia de tokens ainda é
      // localStorage-based (pré-Fase 3 cookie migration).
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refresh_token);

      // Invalida /auth/me pra forçar refetch com o novo accountId + todas
      // as queries de dados que dependem do account atual (KPIs, campanhas,
      // etc). É mais seguro limpar geral — a próxima navegação refetcha.
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(() => {
    const user = data?.user ?? null;
    const isStaff = user?.isSafiraStaff ?? false;
    const accounts = data?.accounts ?? [];
    const currentAccount = data?.currentAccount ?? null;
    // Orphan = user logado (não-staff) SEM nenhum account. Staff sem
    // currentAccount é normal (ele seleciona via admin).
    const isOrphan = !!user && !isStaff && accounts.length === 0;
    const isReady = !isLoading && !!user && (isStaff || !!currentAccount);

    return {
      user,
      currentAccount,
      accounts,
      isLoading,
      isReady,
      isOrphan,
      error: error ?? null,
      can,
      switchAccount,
    };
  }, [data, isLoading, error, can, switchAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

/** Atalho tipado pra checar permissão. */
export function useCan(): (permission: Permission) => boolean {
  const { can } = useAuth();
  return can;
}

/** Atalho pro account atual. Retorna null antes de `/auth/me` terminar. */
export function useCurrentAccount(): MeCurrentAccount | null {
  return useAuth().currentAccount;
}

// Re-export do tipo de response pra quem quiser usar isoladamente
export type { MeResponse };
