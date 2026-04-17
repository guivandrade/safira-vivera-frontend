'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CampaignInsightsResponse } from '@/types/campaigns';

/**
 * Variante do useCampaignInsights pra casos onde o range vem explícito
 * (não do filters-store). Usado no split-view compare.
 */
export function useInsightsRange(
  from: string,
  to: string,
  enabled = true,
): UseQueryResult<CampaignInsightsResponse, Error> {
  return useQuery({
    queryKey: ['campaign-insights', from, to],
    queryFn: async () => {
      const res = await apiClient.get<CampaignInsightsResponse>(
        `/campaigns/insights?from=${from}&to=${to}`,
      );
      return res.data;
    },
    enabled: enabled && !!from && !!to,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
