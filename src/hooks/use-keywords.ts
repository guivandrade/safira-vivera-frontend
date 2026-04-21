'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { KeywordRow, KeywordTotals, KeywordsResponse } from '@/types/api';
import { useFiltersStore } from '@/stores/filters-store';
import { resolveRange } from '@/lib/period';
import { useResetOnInvalidCursor } from './use-reset-on-invalid-cursor';

const PAGE_SIZE = 500;
const ZERO_TOTALS: KeywordTotals = { impressions: 0, clicks: 0, conversions: 0, spend: 0 };

export interface UseKeywordsResult {
  rows: KeywordRow[];
  totals: KeywordTotals;
  errors: string[] | undefined;
  total: number | null;
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
}

export function useKeywords(): UseKeywordsResult {
  const period = useFiltersStore((s) => s.period);
  const { from, to } = resolveRange(period);
  const queryKey = ['keywords', from, to] as const;

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ from, to, pageSize: String(PAGE_SIZE) });
      if (pageParam) params.set('cursor', pageParam);
      const res = await apiClient.get<KeywordsResponse>(
        `/campaigns/keywords?${params.toString()}`,
      );
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pageInfo?.nextCursor ?? undefined,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  useResetOnInvalidCursor(query.error, queryKey);

  const pages = query.data?.pages ?? [];
  const errors = pages.flatMap((p) => p.errors ?? []);

  return {
    rows: pages.flatMap((p) => p.keywords),
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
