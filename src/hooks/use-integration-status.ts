'use client';

import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient } from '@/lib/api-client';
import type { GoogleAdsStatus, MetaAdsStatus } from '@/types/api';

export type { GoogleAdsStatus, MetaAdsStatus };

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

/**
 * Status da integração Meta. Backend novo retorna 401 quando o account não
 * tem credential Meta provisionada (após o api-client tentar refresh do JWT
 * uma vez). Normalizamos pra `connected: false` pra UI mostrar empty state
 * em vez de erro genérico — o caso "sem credential" é estado válido, não falha.
 *
 * Demais erros (network, 5xx, etc.) propagam normalmente.
 */
export function useMetaAdsStatus(): UseQueryResult<MetaAdsStatus, Error> {
  return useQuery({
    queryKey: ['integration-status', 'meta-ads'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<MetaAdsStatus>('/integrations/meta-ads/status');
        return response.data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          return { connected: false, expiresAt: null };
        }
        throw err;
      }
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
