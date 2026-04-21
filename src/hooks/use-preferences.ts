'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { storageKeyFor } from '@/lib/storage-keys';

/**
 * Preferences arbitrárias do usuário persistidas no backend.
 * Backend aceita JSON livre em GET/PUT /settings/preferences.
 *
 * Shape é definido pelo frontend — cada feature acrescenta sua chave.
 */
export interface UserPreferences {
  tableColumnsOrder?: Record<string, string[]>;
  // espaço pra outras prefs futuras (notificações, layout, etc)
}

const EMPTY: UserPreferences = {};

export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const res = await apiClient.get<UserPreferences>('/settings/preferences');
      return res.data ?? EMPTY;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    // Se falhar (ex: backend sem o endpoint), cai pro valor vazio em vez de quebrar a UI.
    placeholderData: EMPTY,
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      const res = await apiClient.put<UserPreferences>('/settings/preferences', prefs);
      return res.data;
    },
    // Optimistic update — UI responde instantâneo e reverte se a API falhar
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ['preferences'] });
      const previous = qc.getQueryData<UserPreferences>(['preferences']);
      qc.setQueryData(['preferences'], next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['preferences'], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
}

/**
 * Hook especializado pra column order de uma tabela.
 * Debounce de 500ms pra não espamar PUT a cada drop.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export function useColumnOrder(tableKey: string, defaultOrder: string[]): {
  order: string[];
  setOrder: (next: string[]) => void;
  reset: () => void;
} {
  const { data: prefs } = usePreferences();
  const update = useUpdatePreferences();

  const lsKey = storageKeyFor.columnOrder(tableKey);

  // Hydrate SSR-safe: lê localStorage só no client, depois do mount.
  // Primeiro render usa defaultOrder (evita hydration mismatch), então
  // useEffect puxa do localStorage se houver.
  const [order, setOrderState] = useState<string[]>(() =>
    mergeOrder(defaultOrder, defaultOrder),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        setOrderState(mergeOrder(parsed, defaultOrder));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsKey]);

  // Sincroniza com backend quando prefs chegarem (caso outro device tenha editado)
  const stored = prefs?.tableColumnsOrder?.[tableKey];
  const storedKey = stored?.join(',');
  useEffect(() => {
    if (stored) setOrderState(mergeOrder(stored, defaultOrder));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedKey]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (next: string[]) => {
      // localStorage imediato — garante que F5 não perde a ordem mesmo se
      // backend falhar ou tiver latência.
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(lsKey, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      // Backend debounced — cross-device sync (best-effort).
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const merged: UserPreferences = {
          ...(prefs ?? {}),
          tableColumnsOrder: {
            ...(prefs?.tableColumnsOrder ?? {}),
            [tableKey]: next,
          },
        };
        update.mutate(merged);
      }, 500);
    },
    [prefs, tableKey, update, lsKey],
  );

  const setOrder = useCallback(
    (next: string[]) => {
      setOrderState(next);
      persist(next);
    },
    [persist],
  );

  const reset = useCallback(() => {
    setOrderState(defaultOrder);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(lsKey);
      } catch {
        // ignore
      }
    }
    const merged: UserPreferences = {
      ...(prefs ?? {}),
      tableColumnsOrder: {
        ...(prefs?.tableColumnsOrder ?? {}),
        [tableKey]: defaultOrder,
      },
    };
    update.mutate(merged);
  }, [defaultOrder, prefs, tableKey, update, lsKey]);

  return { order, setOrder, reset };
}

/**
 * Garante que o array persistido cobre exatamente as keys default.
 * - Remove keys que não existem mais no default (ex: coluna removida do código)
 * - Adiciona keys novas no final (ex: coluna nova adicionada ao default)
 */
function mergeOrder(stored: string[], defaultOrder: string[]): string[] {
  const defaultSet = new Set(defaultOrder);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of stored) {
    if (defaultSet.has(key) && !seen.has(key)) {
      result.push(key);
      seen.add(key);
    }
  }
  for (const key of defaultOrder) {
    if (!seen.has(key)) result.push(key);
  }
  return result;
}
