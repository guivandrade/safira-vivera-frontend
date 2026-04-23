'use client';

import { useEffect, useState } from 'react';
import { storageKeyFor } from '@/lib/storage-keys';

/**
 * Persiste o set de colunas ocultas de uma tabela em localStorage.
 *
 * Separado do `useColumnOrder` (que sincroniza com backend) porque
 * visibility é preferência puramente local — não vale o round-trip
 * pra `/settings/preferences` e não precisa de cross-device sync.
 */
export function useColumnVisibility(storageKey: string | undefined) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKeyFor.columnHidden(storageKey));
      if (raw) setHidden(new Set(JSON.parse(raw)));
    } catch {
      // localStorage indisponível ou payload corrompido — começa com vazio
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(
        storageKeyFor.columnHidden(storageKey),
        JSON.stringify(Array.from(hidden)),
      );
    } catch {
      // quota cheia ou localStorage off — silencioso
    }
  }, [hidden, storageKey]);

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const reset = () => setHidden(new Set());

  return { hidden, setHidden, toggle, reset };
}
