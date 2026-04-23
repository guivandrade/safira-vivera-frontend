'use client';

import { useMemo } from 'react';
import { useCampaignInsights } from '@/hooks/use-campaign-insights';
import { useFiltersStore } from '@/stores/filters-store';
import { Card } from '@/components/ui/Card';
import { FunnelChart } from '@/components/features/campaigns/lazy-charts';
import { KpiCardsSkeleton } from '@/components/features/campaigns/CampaignsSkeleton';
import { EmptyStateCTA } from '@/components/features/campaigns/EmptyStateCTA';
import { formatNumber, formatPercent, safeDiv } from '@/lib/formatters';

export function FunnelPage() {
  const { data, isLoading } = useCampaignInsights();
  const platform = useFiltersStore((s) => s.platform);
  const includeBoosts = useFiltersStore((s) => s.includeBoosts);
  const includeInactive = useFiltersStore((s) => s.includeInactive);

  const stages = useMemo(() => {
    if (!data) return { global: [], meta: [], google: [] };

    const sumByProvider = (p: 'meta' | 'google') => {
      const camps = data.campaigns.filter((c) => {
        if (c.provider !== p) return false;
        if (!includeBoosts && c.objective === 'boost') return false;
        if (!includeInactive && c.status && c.status !== 'ACTIVE') return false;
        return true;
      });
      return {
        impressions: camps.reduce((s, c) => s + c.impressions, 0),
        clicks: camps.reduce((s, c) => s + c.clicks, 0),
        conversions: camps.reduce((s, c) => s + c.conversions, 0),
      };
    };

    const meta = sumByProvider('meta');
    const google = sumByProvider('google');
    const global = {
      impressions: meta.impressions + google.impressions,
      clicks: meta.clicks + google.clicks,
      conversions: meta.conversions + google.conversions,
    };

    const toStages = (x: { impressions: number; clicks: number; conversions: number }) => [
      { key: 'impressions', label: 'Impressões', value: x.impressions },
      { key: 'clicks', label: 'Cliques', value: x.clicks },
      { key: 'conversions', label: 'Conversões', value: x.conversions },
    ];

    return { global: toStages(global), meta: toStages(meta), google: toStages(google) };
  }, [data, includeBoosts, includeInactive]);

  const displayed =
    platform === 'meta' ? stages.meta : platform === 'google' ? stages.google : stages.global;
  const hasAnyData = !!data && data.monthlyData.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Funil de conversão</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Quantas pessoas viram, clicaram e converteram no período. Compare Meta e Google lado a
          lado.
        </p>
      </div>

      {isLoading && <KpiCardsSkeleton />}

      {!isLoading && hasAnyData && data && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FunnelChart
                stages={displayed}
                title={
                  platform === 'meta'
                    ? 'Funil — Meta Ads'
                    : platform === 'google'
                      ? 'Funil — Google Ads'
                      : 'Funil — Todas as plataformas'
                }
                description="Valores absolutos com taxa de passagem entre etapas"
                accentClass={
                  platform === 'meta' ? 'bg-meta' : platform === 'google' ? 'bg-google' : 'bg-accent'
                }
              />
            </div>
            <div className="space-y-3">
              <RateCard
                label="Taxa de clique"
                value={formatPercent(safeDiv(displayed[1].value, displayed[0].value) * 100, 2)}
                hint="Cliques por impressão (CTR)"
              />
              <RateCard
                label="Taxa de conversão"
                value={formatPercent(safeDiv(displayed[2].value, displayed[1].value) * 100, 2)}
                hint="Conversões por clique"
              />
              <RateCard
                label="Conversão geral"
                value={formatPercent(safeDiv(displayed[2].value, displayed[0].value) * 100, 3)}
                hint="Conversões por impressão"
              />
            </div>
          </div>

          {platform === 'all' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <FunnelChart
                stages={stages.meta}
                title="Meta Ads"
                description={`Imp. ${formatNumber(stages.meta[0].value)} · Cliques ${formatNumber(stages.meta[1].value)} · Conv. ${formatNumber(stages.meta[2].value)}`}
                accentClass="bg-meta"
              />
              <FunnelChart
                stages={stages.google}
                title="Google Ads"
                description={`Imp. ${formatNumber(stages.google[0].value)} · Cliques ${formatNumber(stages.google[1].value)} · Conv. ${formatNumber(stages.google[2].value)}`}
                accentClass="bg-google"
              />
            </div>
          )}
        </>
      )}

      {!isLoading && (!data || !hasAnyData) && <EmptyStateCTA variant="no-data" />}
    </div>
  );
}

function RateCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card padding="md">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>
    </Card>
  );
}
