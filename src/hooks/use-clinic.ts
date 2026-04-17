'use client';

import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ClinicGetResponse, ClinicSettings } from '@/types/api';

export function useClinic(): UseQueryResult<ClinicGetResponse, Error> {
  return useQuery({
    queryKey: ['clinic'],
    queryFn: async () => {
      const res = await apiClient.get<ClinicGetResponse>('/settings/clinic');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useUpdateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ClinicSettings> & Pick<ClinicSettings, 'name' | 'address' | 'city' | 'state'>) => {
      const res = await apiClient.put<ClinicSettings>('/settings/clinic', payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic'] });
      qc.invalidateQueries({ queryKey: ['geography-local'] });
    },
  });
}
