'use client';

import { useMemo } from 'react';
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

export function KpiCards({ data, platformFilter = 'all' }: KpiCardsProps) {
  const includeBoosts = useFiltersStore((s) => s.includeBoosts);

  const metrics = useMemo<KpiMetric[]>(() => {
    // KPIs agregam a partir de campaigns[] (não monthlyData) pra permitir
    // filtrar por `objective`. Boosts (Meta Business Suite) têm spend sem
    // conversão — incluí-los inflaria o CPA e confundiria a Vera.
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

    // Delta vs período anterior — usa `previousPeriod` do backend (já sem
    // boosts por default) quando disponível; senão, cai no último mês do
    // monthlyData como heurística.
    let spendDelta: number | null = null;
    let convDelta: number | null = null;
    let cpaDelta: number | null = null;

    if (data.previousPeriod && platformFilter === 'all') {
      const prev = data.previousPeriod;
      spendDelta = percentDelta(totalSpend, prev.totalSpend);
      convDelta = percentDelta(totalConversions, prev.totalConversions);
      const prevCpa = safeDiv(prev.totalSpend, prev.totalConversions);
      cpaDelta = percentDelta(cpa, prevCpa);
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

    return [
      {
        key: 'spend',
        label: 'Investimento',
        tooltip:
          'Total gasto em mídia paga no período. ' +
          (includeBoosts ? 'Inclui posts turbinados do Meta Business Suite.' : 'Posts turbinados (Meta Business Suite) excluídos.'),
        formatted: formatCurrency(totalSpend),
        delta: spendDelta,
      },
      {
        key: 'conversions',
        label: 'Conversões',
        tooltip: 'Total de conversões no período. Posts turbinados não geram conversão trackada.',
        formatted: formatNumber(totalConversions),
        delta: convDelta,
      },
      {
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
      {
        key: 'ctr',
        label: 'CTR',
        tooltip: 'Click-Through Rate: cliques ÷ impressões. Mede atração do criativo.',
        formatted: totalImpressions > 0 ? formatPercent(ctr, 2) : '—',
        delta: null,
      },
      {
        key: 'impressions',
        label: 'Impressões',
        tooltip: 'Total de vezes que os anúncios foram exibidos.',
        formatted: formatNumber(totalImpressions),
        delta: null,
      },
    ];
  }, [data, platformFilter, includeBoosts]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {metrics.map((metric) => (
        <KpiCard key={metric.key} metric={metric} />
      ))}
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
