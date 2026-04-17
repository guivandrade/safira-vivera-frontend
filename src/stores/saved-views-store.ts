'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DateRangeValue } from '@/components/ui/DateRangePicker';
import type { PlatformFilter } from '@/components/ui/PlatformTabs';

export interface SavedView {
  id: string;
  name: string;
  period: DateRangeValue;
  platform: PlatformFilter;
  createdAt: number;
}

interface State {
  views: SavedView[];
  add: (view: Omit<SavedView, 'id' | 'createdAt'>) => SavedView;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
}

export const useSavedViews = create<State>()(
  persist(
    (set) => ({
      views: [],
      add: (view) => {
        const created: SavedView = {
          ...view,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
        };
        set((s) => ({ views: [...s.views, created] }));
        return created;
      },
      remove: (id) => set((s) => ({ views: s.views.filter((v) => v.id !== id) })),
      rename: (id, name) =>
        set((s) => ({ views: s.views.map((v) => (v.id === id ? { ...v, name } : v)) })),
    }),
    { name: 'safira-saved-views', version: 1 },
  ),
);
