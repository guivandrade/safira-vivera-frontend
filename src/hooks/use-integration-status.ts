'use client';

import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { GoogleAdsStatus } from '@/types/api';

export type { GoogleAdsStatus };

export function useGoogleAdsStatus(): UseQueryResult<GoogleAdsStatus, Error> {
  return useQuery({
    queryKey: ['integration-status', 'google-ads'],
    queryFn: async () => {
      const response = await apiClient.get<GoogleAdsStatus>('/integrations/google-ads/status');
      return response.data;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useDisconnectGoogleAds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/integrations/google-ads/disconnect');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-status', 'google-ads'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-insights'] });
    },
  });
}
