'use client';

import { useMemo } from 'react';
import { useCampaignInsights } from '@/hooks/use-campaign-insights';
import { useFiltersStore } from '@/stores/filters-store';
import { KpiCards } from '@/components/features/campaigns/KpiCards';
import { SpendChart } from '@/components/features/campaigns/SpendChart';
import { ConversionsChart } from '@/components/features/campaigns/ConversionsChart';
import { FunnelChart } from '@/components/features/campaigns/FunnelChart';
import { TopCampaignsTable } from '@/components/features/campaigns/TopCampaignsTable';
import {
  DashboardOverviewSkeleton,
} from '@/components/features/campaigns/CampaignsSkeleton';
import { EmptyStateCTA } from '@/components/features/campaigns/EmptyStateCTA';
import { InsightsFeed } from './InsightsFeed';
import { WeekdayHeatmap } from './WeekdayHeatmap';
import { GoalsCard } from './GoalsCard';
import { ShortcutCard } from './ShortcutCard';
import { FreshnessIndicator } from '@/components/ui/FreshnessIndicator';

export function DashboardOverview() {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useCampaignInsights();
  const platform = useFiltersStore((s) => s.platform);
  const setMonthFilter = useFiltersStore((s) => s.setMonthFilter);

  const { funnelStages, hasAnyData } = useMemo(() => {
    if (!data) return { funnelStages: [], hasAnyData: false };
    const filteredCampaigns = data.campaigns.filter((c) =>
      platform === 'all' ? true : c.provider === platform,
    );
    const impressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    const clicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const conversions = data.monthlyData.reduce((sum, m) => {
      if (platform === 'meta') return sum + m.meta.conversions;
      if (platform === 'google') return sum + m.google.conversions;
      return sum + m.totalConversions;
    }, 0);
    return {
      funnelStages: [
        { key: 'impressions', label: 'Impressões', value: impressions },
        { key: 'clicks', label: 'Cliques', value: clicks },
        { key: 'conversions', label: 'Conversões', value: conversions },
      ],
      hasAnyData: data.monthlyData.length > 0,
    };
  }, [data, platform]);

  const topCampaigns = useMemo(() => {
    if (!data) return [];
    const filtered = data.campaigns.filter((c) =>
      platform === 'all' ? true : c.provider === platform,
    );
    return [...filtered].sort((a, b) => b.spend - a.spend).slice(0, 5);
  }, [data, platform]);

  // Previews para shortcut cards
  const topKeywordsPreview = useMemo(
    () => [
      { label: 'vivera joias anel', value: '94 conv.' },
      { label: 'anel de ouro feminino', value: '41 conv.' },
      { label: 'aliança casamento', value: '38 conv.' },
    ],
    [],
  );
  const topCreativesPreview = useMemo(
    () => [
      { label: 'Black Friday Hero', value: '680 conv.' },
      { label: 'Coleção Primavera', value: '412 conv.' },
      { label: 'Dia das Mães Vídeo', value: '298 conv.' },
    ],
    [],
  );
  const topGeoPreview = useMemo(
    () => [
      { label: 'Pinheiros', value: '94 conv.' },
      { label: 'Vila Madalena', value: '78 conv.' },
      { label: 'Jardim Paulistano', value: '62 conv.' },
    ],
    [],
  );

  const handleBarClick = (monthIso: string) => {
    setMonthFilter(monthIso);
    window.location.href = '/campanhas';
  };

  if (isLoading) return <DashboardOverviewSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Visão geral</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Os números do negócio em 15 segundos — use os filtros no topo.
          </p>
        </div>
        <FreshnessIndicator updatedAt={dataUpdatedAt} isFetching={isFetching} onRefresh={() => refetch()} />
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {error instanceof Error ? error.message : 'Erro ao carregar dados'}
        </div>
      )}

      {data && hasAnyData && <InsightsFeed data={data} />}

      {data && hasAnyData && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <KpiCards data={data} platformFilter={platform} />
          </div>
          <GoalsCard data={data} />
        </div>
      )}

      {data && hasAnyData && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SpendChart
            data={data.monthlyData}
            platformFilter={platform}
            onBarClick={handleBarClick}
            showComparison
          />
          <ConversionsChart
            data={data.monthlyData}
            platformFilter={platform}
            onBarClick={handleBarClick}
            showComparison
          />
        </div>
      )}

      {/* Funil + atalhos */}
      {data && hasAnyData && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FunnelChart
              stages={funnelStages}
              title="Funil de conversão"
              description="Impressões → Cliques → Conversões no período"
            />
          </div>
          <div className="space-y-3">
            <ShortcutCard
              href="/palavras-chave"
              title="Palavras-chave"
              description="Termos que convertem mais no Google"
              preview={topKeywordsPreview}
            />
            <ShortcutCard
              href="/criativos"
              title="Criativos"
              description="Rank de anúncios Meta por conversão"
              preview={topCreativesPreview}
            />
            <ShortcutCard
              href="/geografia"
              title="Geografia"
              description="De onde vêm suas conversões"
              preview={topGeoPreview}
            />
          </div>
        </div>
      )}

      {data && hasAnyData && <WeekdayHeatmap />}

      {data && hasAnyData && topCampaigns.length > 0 && <TopCampaignsTable campaigns={topCampaigns} />}

      {data && !hasAnyData && <EmptyStateCTA variant="no-data" />}
    </div>
  );
}
