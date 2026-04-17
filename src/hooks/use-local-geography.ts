'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { LocalGeographyResponse, QueriesByCityResponse } from '@/types/api';
import { useFiltersStore } from '@/stores/filters-store';
import { resolveRange } from '@/lib/period';

export function useLocalGeography(
  options: { enabled?: boolean; radiusKm?: number } = {},
): UseQueryResult<LocalGeographyResponse, Error> {
  const period = useFiltersStore((s) => s.period);
  const platform = useFiltersStore((s) => s.platform);
  const { from, to } = resolveRange(period);

  return useQuery({
    queryKey: ['geography-local', from, to, platform, options.radiusKm],
    queryFn: async () => {
      const params = new URLSearchParams({ from, to });
      if (options.radiusKm) params.set('radiusKm', String(options.radiusKm));
      if (platform !== 'all') params.set('provider', platform);
      const res = await apiClient.get<LocalGeographyResponse>(
        `/campaigns/geography/local?${params.toString()}`,
      );
      return res.data;
    },
    enabled: options.enabled !== false,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useQueriesByCity(
  cityId: string | null,
): UseQueryResult<QueriesByCityResponse, Error> {
  const period = useFiltersStore((s) => s.period);
  const { from, to } = resolveRange(period);

  return useQuery({
    queryKey: ['geography-queries', cityId, from, to],
    queryFn: async () => {
      const res = await apiClient.get<QueriesByCityResponse>(
        `/campaigns/geography/queries-by-city?cityId=${cityId}&from=${from}&to=${to}&limit=10`,
      );
      return res.data;
    },
    enabled: !!cityId,
    staleTime: 5 * 60 * 1000,
  });
}
