'use client';

import { useFiltersStore } from '@/stores/filters-store';
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangePicker value={period} onChange={setPeriod} />
      {showPlatform && (
        <PlatformTabs
          value={lockedPlatform ?? platform}
          onChange={setPlatform}
          lockedTo={lockedPlatform}
        />
      )}
    </div>
  );
}
