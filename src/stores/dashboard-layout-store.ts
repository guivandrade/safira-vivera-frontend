'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LayoutKey = 'default' | 'conversions-focus' | 'spend-focus' | 'executive';

interface LayoutState {
  layout: LayoutKey;
  setLayout: (layout: LayoutKey) => void;
}

export const useDashboardLayout = create<LayoutState>()(
  persist(
    (set) => ({
      layout: 'default',
      setLayout: (layout) => set({ layout }),
    }),
    { name: 'safira-dashboard-layout', version: 1 },
  ),
);

export interface LayoutConfig {
  label: string;
  description: string;
  /** Ordem e visibilidade dos widgets. Widget não listado = escondido. */
  widgets: readonly WidgetKey[];
}

export type WidgetKey =
  | 'insights'
  | 'kpis'
  | 'goals'
  | 'charts'
  | 'funnel'
  | 'shortcuts'
  | 'heatmap'
  | 'top-campaigns';

export const LAYOUTS: Record<LayoutKey, LayoutConfig> = {
  default: {
    label: 'Padrão',
    description: 'Tudo visível, ordem padrão',
    widgets: ['insights', 'kpis', 'goals', 'charts', 'funnel', 'shortcuts', 'heatmap', 'top-campaigns'],
  },
  'conversions-focus': {
    label: 'Foco em conversões',
    description: 'Prioriza insights, funil e heatmap',
    widgets: ['insights', 'funnel', 'kpis', 'heatmap', 'top-campaigns', 'charts'],
  },
  'spend-focus': {
    label: 'Foco em investimento',
    description: 'Prioriza metas de orçamento e charts',
    widgets: ['goals', 'kpis', 'charts', 'top-campaigns', 'insights'],
  },
  executive: {
    label: 'Visão executiva',
    description: 'Apenas o essencial — insights, KPIs e metas',
    widgets: ['insights', 'kpis', 'goals'],
  },
};
