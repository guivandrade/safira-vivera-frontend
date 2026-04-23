'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCampaignInsights } from '@/hooks/use-campaign-insights';
import { useGoogleAdsStatus } from '@/hooks/use-integration-status';
import { useFiltersStore } from '@/stores/filters-store';
import { useToast } from '@/providers/toast-provider';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/errors';
import { CampaignSummary, MonthlyData } from '@/types/campaigns';
import { formatMonthShort } from '@/lib/formatters';
import { ChartsSkeleton, KpiCardsSkeleton, TableSkeleton } from './CampaignsSkeleton';
import { SpendChart } from './SpendChart';
import { ConversionsChart } from './ConversionsChart';
import { DetailedCampaignsTable, CampaignDetailDrawer } from './DetailedCampaignsTable';
import { KpiCards } from './KpiCards';
import { EmptyStateCTA } from './EmptyStateCTA';
import { AnnotationsPanel } from './AnnotationsPanel';
import { Button } from '@/components/ui/Button';
import { FreshnessIndicator } from '@/components/ui/FreshnessIndicator';
import { ApiErrorsBanner } from '@/components/ui/ApiErrorsBanner';

export function CampaignsDashboard() {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useCampaignInsights();
  const platform = useFiltersStore((s) => s.platform);
  const monthFilter = useFiltersStore((s) => s.monthFilter);
  const setMonthFilter = useFiltersStore((s) => s.setMonthFilter);
  const includeBoosts = useFiltersStore((s) => s.includeBoosts);
  const setIncludeBoosts = useFiltersStore((s) => s.setIncludeBoosts);
  const includeInactive = useFiltersStore((s) => s.includeInactive);
  const setIncludeInactive = useFiltersStore((s) => s.setIncludeInactive);
  const { data: googleStatus } = useGoogleAdsStatus();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<CampaignSummary | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (success === 'google_connected') {
      toast.success('Google Ads conectado. Atualizando dados...', { title: 'Conectado' });
      refetch();
      return;
    }

    if (!errorParam) return;

    const errorMap: Record<string, { variant: 'error' | 'warning'; title: string; msg: string; duration?: number }> = {
      missing_refresh_token: {
        variant: 'error',
        title: 'Conexão incompleta',
        msg: 'Revogue o acesso em myaccount.google.com/permissions e clique em "Conectar" de novo.',
        duration: 10000,
      },
      save_failed: {
        variant: 'error',
        title: 'Erro ao salvar',
        msg: 'Não conseguimos salvar as credenciais. Tente novamente em alguns segundos.',
      },
      invalid_state: {
        variant: 'error',
        title: 'Sessão expirou',
        msg: 'O link de autorização expirou. Clique em "Conectar" novamente.',
      },
      oauth_denied: {
        variant: 'warning',
        title: 'Conexão cancelada',
        msg: 'Você cancelou a autorização no Google.',
      },
      no_code: {
        variant: 'error',
        title: 'Retorno inválido do Google',
        msg: 'A resposta do Google veio sem o código de autorização. Tente conectar novamente.',
      },
      oauth_failed: {
        variant: 'error',
        title: 'Falha na conexão',
        msg: 'Erro genérico no fluxo OAuth. Se persistir, verifique as permissões na sua conta Google.',
      },
    };

    const mapped = errorMap[errorParam];
    if (mapped) {
      const fn = mapped.variant === 'error' ? toast.error : toast.warning;
      fn(mapped.msg, { title: mapped.title, duration: mapped.duration });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    try {
      const response = await apiClient.get<{ authUrl: string }>(
        '/integrations/google-ads/oauth/authorize',
      );
      if (!response.data?.authUrl) {
        throw new Error('Resposta inválida do servidor: authUrl ausente.');
      }
      window.location.href = response.data.authUrl;
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Erro ao iniciar conexão com Google Ads'));
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

  const filteredMonthly: MonthlyData[] = useMemo(() => {
    if (!data) return [];
    if (!monthFilter) return data.monthlyData;
    return data.monthlyData.filter((m) => m.month === monthFilter);
  }, [data, monthFilter]);

  const filteredResponse = useMemo(() => {
    if (!data) return null;
    if (!monthFilter) return data;
    return { ...data, monthlyData: filteredMonthly };
  }, [data, monthFilter, filteredMonthly]);

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
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessIndicator updatedAt={dataUpdatedAt} isFetching={isFetching} />
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="h-3.5 w-3.5 accent-accent"
            />
            Comparar período anterior
          </label>
          <label
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-muted"
            title="Posts turbinados via Meta Business Suite geram spend sem conversão trackada. Desligado por default pra não inflar o CPA."
          >
            <input
              type="checkbox"
              checked={includeBoosts}
              onChange={(e) => setIncludeBoosts(e.target.checked)}
              className="h-3.5 w-3.5 accent-accent"
            />
            Incluir posts turbinados
          </label>
          <label
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-muted"
            title="Por padrão, só campanhas ACTIVE aparecem. Ligue pra ver pausadas/removidas."
          >
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-3.5 w-3.5 accent-accent"
            />
            Incluir pausadas/removidas
          </label>
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
      </div>

      {monthFilter && (
        <div className="inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs">
          <span className="text-ink-muted">Mês:</span>
          <span className="font-medium text-ink">{formatMonthShort(monthFilter)}</span>
          <button
            type="button"
            onClick={() => setMonthFilter(null)}
            aria-label="Limpar filtro de mês"
            className="text-ink-muted hover:text-ink"
          >
            ×
          </button>
        </div>
      )}

      <ApiErrorsBanner errors={data?.errors} />

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

      {isLoading ? (
        <KpiCardsSkeleton />
      ) : (
        filteredResponse && hasAnyData && <KpiCards data={filteredResponse} platformFilter={platform} />
      )}

      {isLoading ? (
        <ChartsSkeleton />
      ) : (
        data &&
        hasAnyData && (
          <div className="grid gap-4 lg:grid-cols-2">
            <SpendChart
              data={data.monthlyData}
              platformFilter={platform}
              onBarClick={setMonthFilter}
              showComparison={showComparison}
            />
            <ConversionsChart
              data={data.monthlyData}
              platformFilter={platform}
              onBarClick={setMonthFilter}
              showComparison={showComparison}
            />
          </div>
        )
      )}

      {data && hasAnyData && <AnnotationsPanel monthlyData={data.monthlyData} />}

      {isLoading ? (
        <TableSkeleton />
      ) : (
        filteredResponse &&
        hasAnyData && (
          <DetailedCampaignsTable data={filteredResponse} onRowClick={setActiveCampaign} />
        )
      )}

      {!isLoading && !error && data && !hasAnyData && <EmptyStateCTA variant="no-data" />}

      <CampaignDetailDrawer campaign={activeCampaign} onClose={() => setActiveCampaign(null)} />
    </div>
  );
}
