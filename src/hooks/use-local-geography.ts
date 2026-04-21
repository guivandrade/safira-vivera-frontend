'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ClinicCenter,
  GeographyTotals,
  LocalGeographyResponse,
  NeighborhoodMetrics,
  QueriesByCityResponse,
  QueryByRow,
} from '@/types/api';
import { useFiltersStore } from '@/stores/filters-store';
import { resolveRange } from '@/lib/period';
import { useResetOnInvalidCursor } from './use-reset-on-invalid-cursor';

const GEOGRAPHY_PAGE_SIZE = 100;
// queries-by-city tem máx 100 no backend, mas UX mostra poucas por vez
const QUERIES_PAGE_SIZE = 10;

const ZERO_TOTALS: GeographyTotals = {
  searches: 0,
  impressions: 0,
  clicks: 0,
  conversions: 0,
  spend: 0,
};

export interface UseLocalGeographyResult {
  rows: NeighborhoodMetrics[];
  clinic: ClinicCenter | undefined;
  totals: GeographyTotals;
  errors: string[] | undefined;
  total: number | null;
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
}

export function useLocalGeography(
  options: { enabled?: boolean; radiusKm?: number } = {},
): UseLocalGeographyResult {
  const period = useFiltersStore((s) => s.period);
  const platform = useFiltersStore((s) => s.platform);
  const { from, to } = resolveRange(period);
  const queryKey = [
    'geography-local',
    from,
    to,
    platform,
    options.radiusKm,
  ] as const;

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ from, to, pageSize: String(GEOGRAPHY_PAGE_SIZE) });
      if (options.radiusKm) params.set('radiusKm', String(options.radiusKm));
      if (platform !== 'all') params.set('provider', platform);
      if (pageParam) params.set('cursor', pageParam);
      const res = await apiClient.get<LocalGeographyResponse>(
        `/campaigns/geography/local?${params.toString()}`,
      );
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo?.nextCursor ?? undefined,
    enabled: options.enabled !== false,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  useResetOnInvalidCursor(query.error, queryKey);

  const pages = query.data?.pages ?? [];
  const errors = pages.flatMap((p) => p.errors ?? []);

  return {
    rows: pages.flatMap((p) => p.neighborhoods),
    clinic: pages[0]?.clinic,
    totals: pages[0]?.totals ?? ZERO_TOTALS,
    errors: errors.length ? errors : undefined,
    total: pages[0]?.pageInfo?.total ?? null,
    hasMore: !!query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    error: query.error,
  };
}

export interface UseQueriesByCityResult {
  rows: QueryByRow[];
  errors: string[] | undefined;
  total: number | null;
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
}

export function useQueriesByCity(cityId: string | null): UseQueriesByCityResult {
  const period = useFiltersStore((s) => s.period);
  const { from, to } = resolveRange(period);
  const queryKey = ['geography-queries', cityId, from, to] as const;

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        cityId: cityId ?? '',
        from,
        to,
        pageSize: String(QUERIES_PAGE_SIZE),
      });
      if (pageParam) params.set('cursor', pageParam);
      const res = await apiClient.get<QueriesByCityResponse>(
        `/campaigns/geography/queries-by-city?${params.toString()}`,
      );
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo?.nextCursor ?? undefined,
    enabled: !!cityId,
    staleTime: 5 * 60 * 1000,
  });

  useResetOnInvalidCursor(query.error, queryKey);

  const pages = query.data?.pages ?? [];
  const errors = pages.flatMap((p) => p.errors ?? []);

  return {
    rows: pages.flatMap((p) => p.queries),
    errors: errors.length ? errors : undefined,
    total: pages[0]?.pageInfo?.total ?? null,
    hasMore: !!query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    error: query.error,
  };
}
