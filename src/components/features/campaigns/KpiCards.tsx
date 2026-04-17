'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CampaignInsightsResponse } from '@/types/campaigns';
import { InfoIcon } from '@/components/ui/InfoIcon';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  percentDelta,
  safeDiv,
} from '@/lib/formatters';
import { useFiltersStore } from '@/stores/filters-store';
import { useKpiPrefs } from '@/hooks/use-kpi-prefs';

interface KpiCardsProps {
  data: CampaignInsightsResponse;
  platformFilter?: 'all' | 'meta' | 'google';
}

export interface KpiMetric {
  key: string;
  label: string;
  tooltip: string;
  formatted: string;
  delta: number | null;
  deltaInverted?: boolean;
}

const DEFAULT_ORDER = ['spend', 'conversions', 'cpa', 'ctr', 'impressions', 'clicks'];

export function KpiCards({ data, platformFilter = 'all' }: KpiCardsProps) {
  const includeBoosts = useFiltersStore((s) => s.includeBoosts);
  const { order, hidden, setOrder, toggleHidden, reset } = useKpiPrefs(
    'dashboard',
    DEFAULT_ORDER,
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!configOpen) return;
    const onClick = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setConfigOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [configOpen]);

  const metrics = useMemo<KpiMetric[]>(() => {
    const filteredCampaigns = data.campaigns.filter((c) => {
      if (platformFilter !== 'all' && c.provider !== platformFilter) return false;
      if (!includeBoosts && c.objective === 'boost') return false;
      return true;
    });

    const totalSpend = filteredCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0);
    const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);

    const cpa = safeDiv(totalSpend, totalConversions);
    const ctr = safeDiv(totalClicks, totalImpressions) * 100;

    let spendDelta: number | null = null;
    let convDelta: number | null = null;
    let cpaDelta: number | null = null;
    let clicksDelta: number | null = null;
    let impressionsDelta: number | null = null;

    if (data.previousPeriod && platformFilter === 'all') {
      const prev = data.previousPeriod;
      spendDelta = percentDelta(totalSpend, prev.totalSpend);
      convDelta = percentDelta(totalConversions, prev.totalConversions);
      const prevCpa = safeDiv(prev.totalSpend, prev.totalConversions);
      cpaDelta = percentDelta(cpa, prevCpa);
      clicksDelta = percentDelta(totalClicks, prev.totalClicks);
      impressionsDelta = percentDelta(totalImpressions, prev.totalImpressions);
    } else if (data.monthlyData.length >= 2) {
      const monthly = data.monthlyData;
      const last = monthly[monthly.length - 1];
      const prev = monthly[monthly.length - 2];
      const lastSpend = platformFilter === 'meta' ? last.meta.spend : platformFilter === 'google' ? last.google.spend : last.totalSpend;
      const prevSpend = platformFilter === 'meta' ? prev.meta.spend : platformFilter === 'google' ? prev.google.spend : prev.totalSpend;
      const lastConv = platformFilter === 'meta' ? last.meta.conversions : platformFilter === 'google' ? last.google.conversions : last.totalConversions;
      const prevConv = platformFilter === 'meta' ? prev.meta.conversions : platformFilter === 'google' ? prev.google.conversions : prev.totalConversions;
      spendDelta = percentDelta(lastSpend, prevSpend);
      convDelta = percentDelta(lastConv, prevConv);
      cpaDelta = percentDelta(safeDiv(lastSpend, lastConv), safeDiv(prevSpend, prevConv));
    }

    const byKey: Record<string, KpiMetric> = {
      spend: {
        key: 'spend',
        label: 'Investimento',
        tooltip:
          'Total gasto em mídia paga no período. ' +
          (includeBoosts ? 'Inclui posts turbinados do Meta Business Suite.' : 'Posts turbinados (Meta Business Suite) excluídos.'),
        formatted: formatCurrency(totalSpend),
        delta: spendDelta,
      },
      conversions: {
        key: 'conversions',
        label: 'Conversões',
        tooltip: 'Total de conversões no período. Posts turbinados não geram conversão trackada.',
        formatted: formatNumber(totalConversions),
        delta: convDelta,
      },
      cpa: {
        key: 'cpa',
        label: 'CPA médio',
        tooltip:
          'Custo por Aquisição: investimento ÷ conversões. ' +
          (includeBoosts
            ? 'Inflado por posts turbinados (spend sem conversão).'
            : 'Posts turbinados excluídos pra não inflar.'),
        formatted: totalConversions > 0 ? formatCurrency(cpa, 2) : '—',
        delta: cpaDelta,
        deltaInverted: true,
      },
      ctr: {
        key: 'ctr',
        label: 'CTR',
        tooltip: 'Click-Through Rate: cliques ÷ impressões. Mede atração do criativo.',
        formatted: totalImpressions > 0 ? formatPercent(ctr, 2) : '—',
        delta: null,
      },
      impressions: {
        key: 'impressions',
        label: 'Impressões',
        tooltip: 'Total de vezes que os anúncios foram exibidos.',
        formatted: formatNumber(totalImpressions),
        delta: impressionsDelta,
      },
      clicks: {
        key: 'clicks',
        label: 'Cliques',
        tooltip: 'Total de cliques nos anúncios. Inclui cliques no link e interações.',
        formatted: formatNumber(totalClicks),
        delta: clicksDelta,
      },
    };

    return order.map((k) => byKey[k]).filter((m): m is KpiMetric => !!m);
  }, [data, platformFilter, includeBoosts, order]);

  const visibleMetrics = useMemo(
    () => metrics.filter((m) => !hidden.has(m.key)),
    [metrics, hidden],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...order];
    next.splice(oldIndex, 1);
    next.splice(newIndex, 0, String(active.id));
    setOrder(next);
  };

  const dndEnabled = isDesktop;
  const allMetrics = DEFAULT_ORDER.map((k) => metrics.find((m) => m.key === k)).filter(
    (m): m is KpiMetric => !!m,
  );

  return (
    <div className="relative">
      <div className="mb-2 flex justify-end">
        <div ref={configRef} className="relative">
          <button
            type="button"
            onClick={() => setConfigOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-subtle"
            aria-label="Configurar cards"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Cards
          </button>
          {configOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-border bg-surface p-2 shadow-lg">
              <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
                Visíveis
              </p>
              {allMetrics.map((m) => (
                <label
                  key={m.key}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-surface-subtle"
                >
                  <input
                    type="checkbox"
                    checked={!hidden.has(m.key)}
                    onChange={() => toggleHidden(m.key)}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  <span className="truncate">{m.label}</span>
                </label>
              ))}
              <button
                type="button"
                onClick={() => {
                  reset();
                  setConfigOpen(false);
                }}
                className="mt-1.5 w-full rounded px-2 py-1 text-left text-xs text-ink-muted hover:bg-surface-subtle"
              >
                Restaurar padrão
              </button>
            </div>
          )}
        </div>
      </div>

      {visibleMetrics.length === 0 ? (
        <Card padding="md" className="text-center text-sm text-ink-subtle">
          Nenhum card visível. Use o botão &quot;Cards&quot; acima para mostrar.
        </Card>
      ) : dndEnabled ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleMetrics.map((m) => m.key)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {visibleMetrics.map((metric) => (
                <SortableKpiCard key={metric.key} metric={metric} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {visibleMetrics.map((metric) => (
            <KpiCard key={metric.key} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
}

function SortableKpiCard({ metric }: { metric: KpiMetric }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: metric.key,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <KpiCard metric={metric} />
    </div>
  );
}

export function KpiCard({ metric }: { metric: KpiMetric }) {
  return (
    <Card padding="md" className="min-w-0 overflow-hidden">
      <div className="flex items-center gap-1.5">
        <p className="truncate text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          {metric.label}
        </p>
        <InfoIcon tooltip={metric.tooltip} label={metric.label} />
      </div>
      <p className="mt-1.5 truncate text-xl font-semibold tabular-nums text-ink xl:text-2xl">
        {metric.formatted}
      </p>
      <DeltaIndicator delta={metric.delta} inverted={metric.deltaInverted} />
    </Card>
  );
}

export function DeltaIndicator({
  delta,
  inverted = false,
  suffix = 'vs mês anterior',
}: {
  delta: number | null;
  inverted?: boolean;
  suffix?: string;
}) {
  if (delta === null) {
    return <p className="mt-1 text-[11px] text-ink-subtle">—</p>;
  }

  const positive = delta > 0;
  const isGood = inverted ? !positive : positive;
  const color =
    delta === 0
      ? 'text-ink-subtle'
      : isGood
        ? 'text-success'
        : 'text-danger';
  const arrow = delta === 0 ? '·' : positive ? '↑' : '↓';
  const formatted = `${Math.abs(delta).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

  return (
    <p className={cn('mt-1 truncate text-[11px] font-medium tabular-nums', color)} title={`${arrow} ${formatted} ${suffix}`}>
      {arrow} {formatted} <span className="font-normal text-ink-subtle">{suffix}</span>
    </p>
  );
}
