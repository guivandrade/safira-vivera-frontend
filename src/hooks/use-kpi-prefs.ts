'use client';

import { useCallback, useEffect, useState } from 'react';
import { storageKeyFor } from '@/lib/storage-keys';

/**
 * Persiste ordem e visibilidade de uma lista (ex: KPI cards do dashboard)
 * em localStorage. Mesmo padrão de useColumnOrder, mas standalone — não
 * depende de /settings/preferences porque KPI layout é puramente cosmético
 * e não precisa sync entre devices.
 */
export function useKpiPrefs(
  storageKey: string,
  defaultOrder: string[],
): {
  order: string[];
  hidden: Set<string>;
  setOrder: (next: string[]) => void;
  toggleHidden: (key: string) => void;
  reset: () => void;
} {
  const orderKey = storageKeyFor.kpiOrder(storageKey);
  const hiddenKey = storageKeyFor.kpiHidden(storageKey);

  const [order, setOrderState] = useState<string[]>(defaultOrder);
  const [hidden, setHiddenState] = useState<Set<string>>(new Set());

  // Hidrata depois do mount (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawOrder = localStorage.getItem(orderKey);
      if (rawOrder) {
        const parsed = JSON.parse(rawOrder) as string[];
        setOrderState(mergeOrder(parsed, defaultOrder));
      }
      const rawHidden = localStorage.getItem(hiddenKey);
      if (rawHidden) setHiddenState(new Set(JSON.parse(rawHidden) as string[]));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey, hiddenKey]);

  const setOrder = useCallback(
    (next: string[]) => {
      setOrderState(next);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(orderKey, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
    },
    [orderKey],
  );

  const toggleHidden = useCallback(
    (key: string) => {
      setHiddenState((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(hiddenKey, JSON.stringify(Array.from(next)));
          } catch {
            // ignore
          }
        }
        return next;
      });
    },
    [hiddenKey],
  );

  const reset = useCallback(() => {
    setOrderState(defaultOrder);
    setHiddenState(new Set());
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(orderKey);
        localStorage.removeItem(hiddenKey);
      } catch {
        // ignore
      }
    }
  }, [defaultOrder, orderKey, hiddenKey]);

  return { order, hidden, setOrder, toggleHidden, reset };
}

function mergeOrder(stored: string[], defaultOrder: string[]): string[] {
  const defaultSet = new Set(defaultOrder);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const k of stored) {
    if (defaultSet.has(k) && !seen.has(k)) {
      result.push(k);
      seen.add(k);
    }
  }
  for (const k of defaultOrder) if (!seen.has(k)) result.push(k);
  return result;
}
