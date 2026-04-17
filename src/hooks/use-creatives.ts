'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreativesResponse } from '@/types/api';
import { useFiltersStore } from '@/stores/filters-store';
import { resolveRange } from '@/lib/period';

export function useCreatives(): UseQueryResult<CreativesResponse, Error> {
  const period = useFiltersStore((s) => s.period);
  const { from, to } = resolveRange(period);

  return useQuery({
    queryKey: ['creatives', from, to],
    queryFn: async () => {
      const res = await apiClient.get<CreativesResponse>(
        `/campaigns/creatives?from=${from}&to=${to}&limit=200`,
      );
      return res.data;
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}
