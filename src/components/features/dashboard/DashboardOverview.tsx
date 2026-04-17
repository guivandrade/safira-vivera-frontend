'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useCampaignInsights } from '@/hooks/use-campaign-insights';
import { useFiltersStore } from '@/stores/filters-store';
import { Card } from '@/components/ui/Card';
import { KpiCards } from '@/components/features/campaigns/KpiCards';
import { SpendChart } from '@/components/features/campaigns/SpendChart';
import { ConversionsChart } from '@/components/features/campaigns/ConversionsChart';
import { FunnelChart } from '@/components/features/campaigns/FunnelChart';
import { TopCampaignsTable } from '@/components/features/campaigns/TopCampaignsTable';
import {
  KpiCardsSkeleton,
  ChartsSkeleton,
  TableSkeleton,
} from '@/components/features/campaigns/CampaignsSkeleton';
import { EmptyStateCTA } from '@/components/features/campaigns/EmptyStateCTA';

export function DashboardOverview() {
  const { data, isLoading, error } = useCampaignInsights();
  const platform = useFiltersStore((s) => s.platform);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Visão geral</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Os números do negócio em 15 segundos — use os filtros no topo.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {error instanceof Error ? error.message : 'Erro ao carregar dados'}
        </div>
      )}

      {isLoading ? <KpiCardsSkeleton /> : data && hasAnyData && <KpiCards data={data} platformFilter={platform} />}

      {isLoading ? (
        <ChartsSkeleton />
      ) : (
        data && hasAnyData && (
          <div className="grid gap-4 lg:grid-cols-2">
            <SpendChart data={data.monthlyData} platformFilter={platform} />
            <ConversionsChart data={data.monthlyData} platformFilter={platform} />
          </div>
        )
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
              description="Veja quais termos convertem mais no Google"
            />
            <ShortcutCard
              href="/criativos"
              title="Criativos"
              description="Rank de anúncios Meta por conversão"
            />
            <ShortcutCard
              href="/geografia"
              title="Geografia"
              description="De onde vêm suas conversões"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : (
        data && hasAnyData && topCampaigns.length > 0 && <TopCampaignsTable campaigns={topCampaigns} />
      )}

      {!isLoading && data && !hasAnyData && <EmptyStateCTA variant="no-data" />}
    </div>
  );
}

function ShortcutCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="group transition-colors hover:border-accent/40 hover:bg-surface-subtle" padding="md">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">{title}</p>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-ink" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      </Card>
    </Link>
  );
}
