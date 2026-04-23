'use client';

import { useMemo } from 'react';
import { useFiltersStore } from '@/stores/filters-store';
import { useCurrentAccount } from '@/providers/auth-provider';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { PlatformTabs } from '@/components/ui/PlatformTabs';

interface FilterBarProps {
  showPlatform?: boolean;
  lockedPlatform?: 'meta' | 'google';
}

export function FilterBar({ showPlatform = true, lockedPlatform }: FilterBarProps) {
  const period = useFiltersStore((s) => s.period);
  const setPeriod = useFiltersStore((s) => s.setPeriod);
  const platform = useFiltersStore((s) => s.platform);
  const setPlatform = useFiltersStore((s) => s.setPlatform);
  const currentAccount = useCurrentAccount();

  // Fonte de verdade dos providers disponíveis vem do account ativo. Se o
  // hook ainda não resolveu, default pros dois pra não esconder UI durante
  // a carga inicial.
  const availableProviders = useMemo<('meta' | 'google')[]>(() => {
    if (!currentAccount) return ['meta', 'google'];
    const providers: ('meta' | 'google')[] = [];
    if (currentAccount.hasMeta) providers.push('meta');
    if (currentAccount.hasGoogle) providers.push('google');
    return providers;
  }, [currentAccount]);

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <DateRangePicker value={period} onChange={setPeriod} />
      {showPlatform && availableProviders.length > 0 && (
        <PlatformTabs
          value={lockedPlatform ?? platform}
          onChange={setPlatform}
          lockedTo={lockedPlatform}
          availableProviders={availableProviders}
        />
      )}
    </div>
  );
}
