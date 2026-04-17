'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCampaignInsights } from '@/hooks/use-campaign-insights';
import { useGoogleAdsStatus } from '@/hooks/use-integration-status';
import { useFiltersStore } from '@/stores/filters-store';
import { apiClient } from '@/lib/api-client';
import { CampaignSummary } from '@/types/campaigns';
import { ChartsSkeleton, KpiCardsSkeleton, TableSkeleton } from './CampaignsSkeleton';
import { SpendChart } from './SpendChart';
import { ConversionsChart } from './ConversionsChart';
import { DetailedCampaignsTable, CampaignDetailDrawer } from './DetailedCampaignsTable';
import { KpiCards } from './KpiCards';
import { EmptyStateCTA } from './EmptyStateCTA';
import { Button } from '@/components/ui/Button';

export function CampaignsDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useCampaignInsights();
  const platform = useFiltersStore((s) => s.platform);
  const { data: googleStatus } = useGoogleAdsStatus();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<CampaignSummary | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'google_connected') {
      setShowSuccess(true);
      refetch();
      const t = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams, refetch]);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const response = await apiClient.get<{ authUrl: string }>(
        '/integrations/google-ads/oauth/authorize',
      );
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      setConnectError(err?.response?.data?.message || 'Erro ao iniciar conexão com Google Ads');
      setIsConnecting(false);
    }
  };

  const providerTotals = useMemo(() => {
    if (!data) return { google: 0, meta: 0 };
    return data.monthlyData.reduce(
      (acc, m) => {
        acc.google += m.google.spend;
        acc.meta += m.meta.spend;
        return acc;
      },
      { google: 0, meta: 0 },
    );
  }, [data]);

  const hasAnyData = !!data && data.monthlyData.length > 0;
  const googleConnected = !!googleStatus?.connected;
  const showGoogleCta = !googleConnected || providerTotals.google === 0;
  const showMetaEmpty = hasAnyData && providerTotals.meta === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Campanhas</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Todas as campanhas ativas + histórico — scan por performance e investimento.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => refetch()}
          disabled={isFetching}
          leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          }
        >
          {isFetching ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Flash messages */}
      {showSuccess && (
        <div className="rounded-md border border-success/30 bg-success/5 px-4 py-2.5 text-sm text-success">
          ● Google Ads conectado. Atualizando dados...
        </div>
      )}
      {connectError && (
        <div className="rounded-md border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {connectError}
        </div>
      )}

      {data?.errors && data.errors.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning/5 px-4 py-2.5 text-sm">
          <p className="font-medium text-warning">Alguns dados podem estar incompletos</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-ink-muted">
            {data.errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm font-medium text-danger">
            Erro: {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
          <Button size="sm" variant="primary" className="mt-3" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!isLoading && !error && hasAnyData && showGoogleCta && (
        <EmptyStateCTA
          variant="connect-google"
          onConnectGoogle={handleConnectGoogle}
          isConnecting={isConnecting}
        />
      )}
      {!isLoading && !error && showMetaEmpty && <EmptyStateCTA variant="connect-meta" />}

      {isLoading ? <KpiCardsSkeleton /> : data && hasAnyData && <KpiCards data={data} platformFilter={platform} />}

      {isLoading ? (
        <ChartsSkeleton />
      ) : (
        data &&
        hasAnyData && (
          <div className="grid gap-4 lg:grid-cols-2">
            <SpendChart data={data.monthlyData} platformFilter={platform} />
            <ConversionsChart data={data.monthlyData} platformFilter={platform} />
          </div>
        )
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : (
        data &&
        hasAnyData && (
          <DetailedCampaignsTable data={data} onRowClick={setActiveCampaign} />
        )
      )}

      {!isLoading && !error && data && !hasAnyData && <EmptyStateCTA variant="no-data" />}

      <CampaignDetailDrawer campaign={activeCampaign} onClose={() => setActiveCampaign(null)} />
    </div>
  );
}
