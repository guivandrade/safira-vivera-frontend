'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CampaignInsightsResponse } from '@/types/campaigns';
import { useFiltersStore } from '@/stores/filters-store';
import { resolveRange } from '@/lib/period';

export function useCampaignInsights(): UseQueryResult<CampaignInsightsResponse, Error> {
  const period = useFiltersStore((s) => s.period);
  const includeBoosts = useFiltersStore((s) => s.includeBoosts);
  const { from, to } = resolveRange(period);

  return useQuery({
    queryKey: ['campaign-insights', from, to, includeBoosts],
    queryFn: async () => {
      const params = new URLSearchParams({ from, to });
      if (includeBoosts) params.set('includeBoosts', 'true');
      const response = await apiClient.get<CampaignInsightsResponse>(
        `/campaigns/insights?${params.toString()}`,
      );
      return response.data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}
