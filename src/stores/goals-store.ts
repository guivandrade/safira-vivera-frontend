'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Goals {
  /** Meta mensal de conversões (0 = desativado) */
  monthlyConversions: number;
  /** Teto de CPA (R$). Excedeu → alerta. (0 = desativado) */
  maxCpa: number;
  /** Teto de investimento mensal (R$). 0 = desativado */
  monthlyBudget: number;
}

interface State {
  goals: Goals;
  setGoals: (goals: Partial<Goals>) => void;
  reset: () => void;
}

const defaultGoals: Goals = {
  monthlyConversions: 0,
  maxCpa: 0,
  monthlyBudget: 0,
};

export const useGoals = create<State>()(
  persist(
    (set) => ({
      goals: defaultGoals,
      setGoals: (partial) => set((s) => ({ goals: { ...s.goals, ...partial } })),
      reset: () => set({ goals: defaultGoals }),
    }),
    { name: 'safira-goals', version: 1 },
  ),
);
