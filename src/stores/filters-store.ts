'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DateRangeValue } from '@/components/ui/DateRangePicker';
import type { PlatformFilter } from '@/components/ui/PlatformTabs';

interface FiltersState {
  period: DateRangeValue;
  platform: PlatformFilter;
  /** Drill-down: quando setado, filtra visualizações para um mês específico (YYYY-MM). */
  monthFilter: string | null;
  /** Incluir posts turbinados do Meta Business Suite nos cálculos. Default: false
   *  (boosts têm spend sem conversão trackada — inflariam o CPA). */
  includeBoosts: boolean;
  /** Incluir campanhas com status PAUSED/REMOVED nas listas. Default: false
   *  (Vera quase sempre quer ver só o que está ativo). */
  includeInactive: boolean;
  setPeriod: (period: DateRangeValue) => void;
  setPlatform: (platform: PlatformFilter) => void;
  setMonthFilter: (month: string | null) => void;
  setIncludeBoosts: (v: boolean) => void;
  setIncludeInactive: (v: boolean) => void;
}

const defaultPeriod: DateRangeValue = { preset: 'last-180d' };

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      period: defaultPeriod,
      platform: 'all',
      monthFilter: null,
      includeBoosts: false,
      includeInactive: false,
      setPeriod: (period) => set({ period, monthFilter: null }),
      setPlatform: (platform) => set({ platform }),
      setMonthFilter: (monthFilter) => set({ monthFilter }),
      setIncludeBoosts: (includeBoosts) => set({ includeBoosts }),
      setIncludeInactive: (includeInactive) => set({ includeInactive }),
    }),
    {
      name: 'safira-filters',
      partialize: (state) => ({
        period: state.period,
        platform: state.platform,
        includeBoosts: state.includeBoosts,
        includeInactive: state.includeInactive,
      }),
      migrate: (persisted: unknown) => {
        const state = (persisted ?? {}) as Partial<FiltersState>;
        const legacy = state.period?.preset;
        const validPresets = ['today', 'last-7d', 'this-month', 'last-90d', 'last-180d', 'this-year', 'custom'];
        if (legacy && !validPresets.includes(legacy)) {
          return { ...state, period: defaultPeriod };
        }
        return state;
      },
      version: 2,
    },
  ),
);
