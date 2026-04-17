'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { KeywordsResponse } from '@/types/api';
import { useFiltersStore } from '@/stores/filters-store';
import { resolveRange } from '@/lib/period';

export function useKeywords(): UseQueryResult<KeywordsResponse, Error> {
  const period = useFiltersStore((s) => s.period);
  const { from, to } = resolveRange(period);

  return useQuery({
    queryKey: ['keywords', from, to],
    queryFn: async () => {
      const res = await apiClient.get<KeywordsResponse>(
        `/campaigns/keywords?from=${from}&to=${to}&limit=500`,
      );
      return res.data;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}
