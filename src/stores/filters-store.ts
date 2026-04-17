'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DateRangeValue } from '@/components/ui/DateRangePicker';
import type { PlatformFilter } from '@/components/ui/PlatformTabs';

interface FiltersState {
  period: DateRangeValue;
  platform: PlatformFilter;
  setPeriod: (period: DateRangeValue) => void;
  setPlatform: (platform: PlatformFilter) => void;
}

const defaultPeriod: DateRangeValue = { preset: 'last-180d' };

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      period: defaultPeriod,
      platform: 'all',
      setPeriod: (period) => set({ period }),
      setPlatform: (platform) => set({ platform }),
    }),
    {
      name: 'safira-filters',
      partialize: (state) => ({ period: state.period, platform: state.platform }),
      // Invalida preset antigo (1m/3m/6m/12m) se persistido num cliente antes da mudança
      migrate: (persisted: any) => {
        const legacy = persisted?.period?.preset;
        if (legacy && !['this-month', 'last-90d', 'last-180d', 'this-year', 'custom'].includes(legacy)) {
          return { ...persisted, period: defaultPeriod };
        }
        return persisted;
      },
      version: 2,
    },
  ),
);
