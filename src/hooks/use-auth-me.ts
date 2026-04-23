'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { MeResponse } from '@/types/auth-me';

/**
 * Consome `GET /auth/me` — source of truth pro user, accounts e
 * permissões efetivas.
 *
 * `staleTime: 30s` — compromisso entre responsividade e custo de
 * request. Quando admin revoga uma permissão, mudança propaga em
 * até 30s no client sem precisar forçar re-login. Para invalidar
 * imediatamente (ex: troca de role), chame `queryClient.invalidateQueries
 * ({ queryKey: ['auth-me'] })` após a mutation.
 */
export function useAuthMe(): UseQueryResult<MeResponse, Error> {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const { data } = await apiClient.get<MeResponse>('/auth/me');
      return data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}
