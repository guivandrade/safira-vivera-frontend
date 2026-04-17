'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Annotation {
  id: string;
  month: string; // YYYY-MM
  label: string;
  createdAt: number;
}

interface State {
  annotations: Annotation[];
  add: (month: string, label: string) => void;
  remove: (id: string) => void;
}

export const useAnnotations = create<State>()(
  persist(
    (set) => ({
      annotations: [],
      add: (month, label) =>
        set((s) => ({
          annotations: [
            ...s.annotations,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              month,
              label: label.trim(),
              createdAt: Date.now(),
            },
          ],
        })),
      remove: (id) => set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) })),
    }),
    { name: 'safira-annotations', version: 1 },
  ),
);
