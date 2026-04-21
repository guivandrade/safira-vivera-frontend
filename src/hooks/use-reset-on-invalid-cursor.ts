'use client';

import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { AxiosError } from 'axios';

// Race: se filtros (from/to/campaignId/radiusKm/cityId) mudarem entre o envio
// do fetchNextPage e a resposta, o backend devolve 400 com "cursor inválido".
// Reiniciamos silenciosamente — a próxima render refaz a primeira página.
function isInvalidCursor(err: unknown): boolean {
  if (!(err instanceof AxiosError)) return false;
  if (err.response?.status !== 400) return false;
  const payload = JSON.stringify(err.response?.data ?? '');
  return /cursor/i.test(payload);
}

export function useResetOnInvalidCursor(error: unknown, queryKey: QueryKey) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (isInvalidCursor(error)) {
      queryClient.resetQueries({ queryKey });
    }
    // queryKey é uma array nova a cada render; serializamos pra dep estável
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, queryClient, JSON.stringify(queryKey)]);
}
