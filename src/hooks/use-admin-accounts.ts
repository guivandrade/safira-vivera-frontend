'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { clearTenantState } from '@/lib/clear-tenant-state';
import type {
  AdminAccount,
  CreateAccountInput,
  ImpersonateResponse,
  UpdateAccountInput,
  UpdateOwnerInput,
} from '@/types/admin';

const KEY_LIST = ['admin-accounts'] as const;
const KEY_ONE = (id: string) => ['admin-accounts', id] as const;

export function useAdminAccounts() {
  return useQuery({
    queryKey: KEY_LIST,
    queryFn: async () => {
      const { data } = await apiClient.get<AdminAccount[]>('/admin/accounts');
      return data;
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminAccount(id: string | undefined) {
  return useQuery({
    queryKey: id ? KEY_ONE(id) : KEY_LIST,
    queryFn: async () => {
      const { data } = await apiClient.get<AdminAccount>(`/admin/accounts/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAccountInput) => {
      const { data } = await apiClient.post<AdminAccount>('/admin/accounts', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY_LIST });
    },
  });
}

export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAccountInput) => {
      const { data } = await apiClient.patch<AdminAccount>(`/admin/accounts/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY_LIST });
      queryClient.invalidateQueries({ queryKey: KEY_ONE(id) });
    },
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY_LIST });
    },
  });
}

export function useResetOwnerPassword(id: string) {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      await apiClient.post(`/admin/accounts/${id}/reset-owner-password`, { newPassword });
    },
  });
}

export function useUpdateOwner(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateOwnerInput) => {
      const { data } = await apiClient.patch<AdminAccount>(
        `/admin/accounts/${id}/owner`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY_LIST });
      queryClient.invalidateQueries({ queryKey: KEY_ONE(id) });
    },
  });
}

/**
 * Emite JWT novo apontando pro account alvo e substitui os tokens no storage.
 * Depois de chamar isso, o frontend redireciona pra /dashboard — todas as
 * queries invalidam e puxam dados do novo account.
 *
 * Também salva o id do account original (staff) pra exibir banner + permitir
 * retorno via "sair da impersonação".
 */
export function useImpersonateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data } = await apiClient.post<ImpersonateResponse>(
        `/admin/accounts/${accountId}/impersonate`,
      );
      return data;
    },
    onSuccess: (data) => {
      // Ordem importa: limpa cache/stores ANTES de gravar os tokens novos.
      // `clearTenantState` chama `queryClient.clear()` (remove caches do
      // account anterior, ao contrário de `invalidateQueries` que só marca
      // stale e mantém os dados visíveis até o refetch chegar).
      clearTenantState(queryClient);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      localStorage.setItem(
        STORAGE_KEYS.IMPERSONATED_ACCOUNT,
        JSON.stringify(data.currentAccount),
      );
    },
  });
}
