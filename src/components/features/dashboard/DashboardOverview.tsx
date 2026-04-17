'use client';

import { useMemo } from 'react';
import { useCampaignInsights } from '@/hooks/use-campaign-insights';
import { useFiltersStore } from '@/stores/filters-store';
import { useDashboardLayout, LAYOUTS, WidgetKey } from '@/stores/dashboard-layout-store';
import { KpiCards } from '@/components/features/campaigns/KpiCards';
import { SpendChart } from '@/components/features/campaigns/SpendChart';
import { ConversionsChart } from '@/components/features/campaigns/ConversionsChart';
import { FunnelChart } from '@/components/features/campaigns/FunnelChart';
import { TopCampaignsTable } from '@/components/features/campaigns/TopCampaignsTable';
import { DashboardOverviewSkeleton } from '@/components/features/campaigns/CampaignsSkeleton';
import { EmptyStateCTA } from '@/components/features/campaigns/EmptyStateCTA';
import { InsightsFeed } from './InsightsFeed';
import { ShortcutCard } from './ShortcutCard';
import { LayoutSwitcher } from './LayoutSwitcher';
import { FreshnessIndicator } from '@/components/ui/FreshnessIndicator';

export function DashboardOverview() {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useCampaignInsights();
  const platform = useFiltersStore((s) => s.platform);
  const setMonthFilter = useFiltersStore((s) => s.setMonthFilter);
  const { layout } = useDashboardLayout();
  const activeWidgets = LAYOUTS[layout].widgets;

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

  const handleBarClick = (monthIso: string) => {
    setMonthFilter(monthIso);
    window.location.href = '/campanhas';
  };

  if (isLoading) return <DashboardOverviewSkeleton />;

  const widgets: Record<WidgetKey, React.ReactNode> = {
    insights: data && hasAnyData ? <InsightsFeed key="insights" data={data} /> : null,
    kpis:
      data && hasAnyData ? (
        <div key="kpis">
          <KpiCards data={data} platformFilter={platform} />
        </div>
      ) : null,
    goals: null, // card de metas removido do dashboard
    charts:
      data && hasAnyData ? (
        <div key="charts" className="grid gap-4 lg:grid-cols-2">
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
      ) : null,
    funnel:
      data && hasAnyData ? (
        <div key="funnel" className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FunnelChart
              stages={funnelStages}
              title="Funil de conversão"
              description="Impressões → Cliques → Conversões no período"
            />
          </div>
          {activeWidgets.includes('shortcuts') && (
            <div className="space-y-3">
              <ShortcutCard href="/palavras-chave" title="Palavras-chave" description="Termos que convertem mais no Google" />
              <ShortcutCard href="/criativos" title="Criativos" description="Rank de anúncios Meta por conversão" />
              <ShortcutCard href="/geografia" title="Geografia" description="De onde vêm suas conversões" />
            </div>
          )}
        </div>
      ) : null,
    shortcuts: null, // renderizado dentro de 'funnel' quando ambos ativos
    'top-campaigns':
      data && hasAnyData && topCampaigns.length > 0 ? (
        <TopCampaignsTable key="top" campaigns={topCampaigns} />
      ) : null,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Visão geral</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Os números do negócio em 15 segundos — use os filtros no topo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FreshnessIndicator updatedAt={dataUpdatedAt} isFetching={isFetching} onRefresh={() => refetch()} />
          <LayoutSwitcher />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {error instanceof Error ? error.message : 'Erro ao carregar dados'}
        </div>
      )}

      {activeWidgets.map((key) => widgets[key])}

      {data && !hasAnyData && <EmptyStateCTA variant="no-data" />}
    </div>
  );
}
