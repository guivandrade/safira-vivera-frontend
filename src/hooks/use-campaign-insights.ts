'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CampaignInsightsResponse } from '@/types/campaigns';
import { useFiltersStore } from '@/stores/filters-store';
import type { DateRangeValue } from '@/components/ui/DateRangePicker';

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resolveRange(period: DateRangeValue): { from: string; to: string } {
  const today = new Date();

  if (period.preset === 'custom' && period.from && period.to) {
    return { from: period.from, to: period.to };
  }

  switch (period.preset) {
    case 'this-month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
    case 'this-year': {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
    case 'last-90d': {
      const from = new Date(today);
      from.setDate(from.getDate() - 90);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
    case 'last-180d':
    default: {
      const from = new Date(today);
      from.setDate(from.getDate() - 180);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
  }
}

export function useCampaignInsights(): UseQueryResult<CampaignInsightsResponse, Error> {
  const period = useFiltersStore((s) => s.period);
  const { from, to } = resolveRange(period);

  return useQuery({
    queryKey: ['campaign-insights', from, to],
    queryFn: async () => {
      const response = await apiClient.get<CampaignInsightsResponse>(
        `/campaigns/insights?from=${from}&to=${to}`,
      );
      return response.data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}
