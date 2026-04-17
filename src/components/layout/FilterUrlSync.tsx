'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFiltersStore } from '@/stores/filters-store';
import type { DateRangeValue, PresetKey } from '@/components/ui/DateRangePicker';
import type { PlatformFilter } from '@/components/ui/PlatformTabs';

/**
 * Sincroniza o filters-store com a querystring:
 * - Ao montar/mudar URL: lê ?period=... &platform=... &from= &to= e aplica no store.
 * - Ao mudar o store: escreve querystring (sem recarregar).
 *
 * Permite deep links tipo `/campanhas?platform=meta&period=this-year`.
 */
const VALID_PRESETS: PresetKey[] = ['last-7d', 'this-month', 'last-90d', 'last-180d', 'this-year', 'custom'];
const VALID_PLATFORMS: PlatformFilter[] = ['all', 'meta', 'google'];

export function FilterUrlSync() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const period = useFiltersStore((s) => s.period);
  const platform = useFiltersStore((s) => s.platform);
  const setPeriod = useFiltersStore((s) => s.setPeriod);
  const setPlatform = useFiltersStore((s) => s.setPlatform);
  const hydrated = useRef(false);

  // URL → store (apenas uma vez por mudança de URL)
  useEffect(() => {
    const urlPeriod = searchParams.get('period') as PresetKey | null;
    const urlPlatform = searchParams.get('platform') as PlatformFilter | null;
    const urlFrom = searchParams.get('from');
    const urlTo = searchParams.get('to');

    let next: DateRangeValue | null = null;
    if (urlPeriod === 'custom' && urlFrom && urlTo) {
      next = { preset: 'custom', from: urlFrom, to: urlTo };
    } else if (urlPeriod && VALID_PRESETS.includes(urlPeriod) && urlPeriod !== 'custom') {
      next = { preset: urlPeriod };
    }
    if (next) setPeriod(next);

    if (urlPlatform && VALID_PLATFORMS.includes(urlPlatform)) {
      setPlatform(urlPlatform);
    }

    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Store → URL
  useEffect(() => {
    if (!hydrated.current) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('period', period.preset);
    if (period.preset === 'custom' && period.from && period.to) {
      params.set('from', period.from);
      params.set('to', period.to);
    } else {
      params.delete('from');
      params.delete('to');
    }
    if (platform !== 'all') params.set('platform', platform);
    else params.delete('platform');

    const current = searchParams.toString();
    const next = params.toString();
    if (current !== next) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, platform]);

  return null;
}
