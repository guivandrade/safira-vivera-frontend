'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { KpiCardsSkeleton } from '@/components/features/campaigns/CampaignsSkeleton';
import { EmptyStatePlaceholder } from '@/components/ui/EmptyStatePlaceholder';
import { useInsightsRange } from '@/hooks/use-insights-range';
import { CampaignInsightsResponse } from '@/types/campaigns';
import { formatCurrency, formatNumber, formatPercent, percentDelta, safeDiv } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import { toIsoDate } from '@/lib/period';

interface Range {
  from: string;
  to: string;
}

function defaultRangeA(): Range {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: toIsoDate(from), to: toIsoDate(today) };
}
function defaultRangeB(): Range {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), 0); // último dia do mês passado
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return { from: toIsoDate(start), to: toIsoDate(end) };
}

export function ComparePage() {
  const [rangeA, setRangeA] = useState<Range>(defaultRangeA);
  const [rangeB, setRangeB] = useState<Range>(defaultRangeB);

  const { data: dataA, isLoading: loadingA } = useInsightsRange(rangeA.from, rangeA.to);
  const { data: dataB, isLoading: loadingB } = useInsightsRange(rangeB.from, rangeB.to);

  const metricsA = useMemo(() => computeMetrics(dataA), [dataA]);
  const metricsB = useMemo(() => computeMetrics(dataB), [dataB]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Comparar períodos</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Dois períodos lado a lado pra análise sazonal e de impacto de mudanças.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RangeEditor label="Período A" value={rangeA} onChange={setRangeA} accent="bg-accent" />
        <RangeEditor label="Período B" value={rangeB} onChange={setRangeB} accent="bg-warning" />
      </div>

      {loadingA || loadingB ? (
        <KpiCardsSkeleton />
      ) : !dataA || !dataB ? (
        <EmptyStatePlaceholder variant="no-data" title="Sem dados em um dos períodos" />
      ) : (
        <>
          <MetricRow label="Investimento" a={metricsA.spend} b={metricsB.spend} format={formatCurrency} ceilingGoal />
          <MetricRow label="Conversões" a={metricsA.conversions} b={metricsB.conversions} format={formatNumber} />
          <MetricRow
            label="CPA médio"
            a={metricsA.cpa}
            b={metricsB.cpa}
            format={(v) => (v > 0 ? formatCurrency(v) : '—')}
            ceilingGoal
          />
          <MetricRow label="Cliques" a={metricsA.clicks} b={metricsB.clicks} format={formatNumber} />
          <MetricRow label="Impressões" a={metricsA.impressions} b={metricsB.impressions} format={formatNumber} />
          <MetricRow
            label="CTR"
            a={metricsA.ctr}
            b={metricsB.ctr}
            format={(v) => formatPercent(v, 2)}
          />
        </>
      )}
    </div>
  );
}

interface Metrics {
  spend: number;
  conversions: number;
  clicks: number;
  impressions: number;
  cpa: number;
  ctr: number;
}

function computeMetrics(data: CampaignInsightsResponse | undefined): Metrics {
  if (!data) return { spend: 0, conversions: 0, clicks: 0, impressions: 0, cpa: 0, ctr: 0 };
  const spend = data.monthlyData.reduce((s, m) => s + m.totalSpend, 0);
  const conversions = data.monthlyData.reduce((s, m) => s + m.totalConversions, 0);
  const clicks = data.campaigns.reduce((s, c) => s + c.clicks, 0);
  const impressions = data.campaigns.reduce((s, c) => s + c.impressions, 0);
  return {
    spend,
    conversions,
    clicks,
    impressions,
    cpa: safeDiv(spend, conversions),
    ctr: safeDiv(clicks, impressions) * 100,
  };
}

function RangeEditor({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: Range;
  onChange: (r: Range) => void;
  accent: string;
}) {
  return (
    <Card padding="md">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', accent)} />
            {label}
          </span>
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">De</span>
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="mt-1 w-full rounded border border-line bg-surface-muted px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Até</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="mt-1 w-full rounded border border-line bg-surface-muted px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </div>
    </Card>
  );
}

function MetricRow({
  label,
  a,
  b,
  format,
  ceilingGoal = false,
}: {
  label: string;
  a: number;
  b: number;
  format: (v: number) => string;
  ceilingGoal?: boolean;
}) {
  const delta = percentDelta(a, b);
  const improved = delta !== null && (ceilingGoal ? delta < 0 : delta > 0);
  const worsened = delta !== null && (ceilingGoal ? delta > 0 : delta < 0);

  return (
    <Card padding="md">
      <div className="grid grid-cols-[1fr_1fr_140px] items-center gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{format(a)}</p>
          <p className="text-[11px] text-ink-subtle">Período A</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Comparação
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{format(b)}</p>
          <p className="text-[11px] text-ink-subtle">Período B</p>
        </div>
        <div className="text-right">
          {delta !== null && (
            <>
              <p
                className={cn(
                  'text-lg font-semibold tabular-nums',
                  improved && 'text-success',
                  worsened && 'text-danger',
                  !improved && !worsened && 'text-ink',
                )}
              >
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)}%
              </p>
              <p className="text-[11px] text-ink-subtle">A vs B</p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
