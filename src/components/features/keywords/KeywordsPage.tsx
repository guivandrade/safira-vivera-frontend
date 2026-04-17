'use client';

import { useMemo } from 'react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { EmptyStatePlaceholder } from '@/components/ui/EmptyStatePlaceholder';
import { ApiErrorsBanner } from '@/components/ui/ApiErrorsBanner';
import { KpiCard } from '@/components/features/campaigns/KpiCards';
import { CsvExportButton } from '@/components/features/campaigns/CsvExportButton';
import { TableSkeleton, KpiCardsSkeleton } from '@/components/features/campaigns/CampaignsSkeleton';
import { useKeywords } from '@/hooks/use-keywords';
import type { KeywordRow } from '@/types/api';
import { formatCurrency, formatNumber, formatPercent, safeDiv } from '@/lib/formatters';

export function KeywordsPage() {
  const { data, isLoading, error } = useKeywords();

  const rows = data?.keywords ?? [];
  const totals = data?.totals ?? { impressions: 0, clicks: 0, conversions: 0, spend: 0 };
  const hasData = rows.length > 0;

  const columns: DataTableColumn<KeywordRow>[] = useMemo(
    () => [
      {
        key: 'keyword',
        header: 'Palavra-chave',
        sortable: true,
        sortValue: (r) => r.keyword,
        hideable: false,
        render: (r) => (
          <div>
            <p className="font-medium text-ink">{r.keyword}</p>
            <p className="text-[11px] text-ink-subtle">{r.campaignName}</p>
          </div>
        ),
      },
      {
        key: 'matchType',
        header: 'Correspondência',
        render: (r) => (
          <span className="inline-flex items-center rounded border border-line bg-surface-subtle px-2 py-0.5 text-[11px] text-ink-muted">
            {r.matchType}
          </span>
        ),
        width: '140px',
      },
      {
        key: 'impressions',
        header: 'Impr.',
        align: 'right',
        sortable: true,
        sortValue: (r) => r.impressions,
        render: (r) => formatNumber(r.impressions),
      },
      {
        key: 'clicks',
        header: 'Cliques',
        align: 'right',
        sortable: true,
        sortValue: (r) => r.clicks,
        render: (r) => formatNumber(r.clicks),
      },
      {
        key: 'ctr',
        header: 'CTR',
        align: 'right',
        sortable: true,
        sortValue: (r) => safeDiv(r.clicks, r.impressions),
        render: (r) => formatPercent(safeDiv(r.clicks, r.impressions) * 100, 2),
      },
      {
        key: 'conv',
        header: 'Conv.',
        align: 'right',
        sortable: true,
        sortValue: (r) => r.conversions,
        render: (r) => formatNumber(r.conversions),
      },
      {
        key: 'spend',
        header: 'Invest.',
        align: 'right',
        sortable: true,
        sortValue: (r) => r.spend,
        render: (r) => formatCurrency(r.spend),
      },
      {
        key: 'cpa',
        header: 'CPA',
        align: 'right',
        sortable: true,
        sortValue: (r) => r.cpa ?? Infinity,
        render: (r) => (r.cpa && isFinite(r.cpa) ? formatCurrency(r.cpa) : '—'),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Palavras-chave</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Os termos de busca que trazem clientes via Google Ads.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-google" /> Google Ads
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {error instanceof Error ? error.message : 'Erro ao carregar palavras-chave'}
        </div>
      )}

      <ApiErrorsBanner errors={data?.errors} />

      {isLoading ? (
        <>
          <KpiCardsSkeleton />
          <TableSkeleton />
        </>
      ) : hasData ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              metric={{
                key: 'total',
                label: 'Total keywords',
                tooltip: 'Número de palavras-chave ativas no período.',
                formatted: formatNumber(rows.length),
                delta: null,
              }}
            />
            <KpiCard
              metric={{
                key: 'impr',
                label: 'Impressões',
                tooltip: 'Total de vezes que os anúncios foram exibidos.',
                formatted: formatNumber(totals.impressions),
                delta: null,
              }}
            />
            <KpiCard
              metric={{
                key: 'clicks',
                label: 'Cliques',
                tooltip: 'Total de cliques no período.',
                formatted: formatNumber(totals.clicks),
                delta: null,
              }}
            />
            <KpiCard
              metric={{
                key: 'conv',
                label: 'Conversões',
                tooltip: 'Total de conversões no período.',
                formatted: formatNumber(totals.conversions),
                delta: null,
              }}
            />
          </div>

          <div className="flex justify-end">
            <CsvExportButton
              rows={rows}
              filename="palavras-chave.csv"
              columns={[
                { header: 'Palavra-chave', value: (r) => r.keyword },
                { header: 'Campanha', value: (r) => r.campaignName },
                { header: 'Correspondência', value: (r) => r.matchType },
                { header: 'Impressões', value: (r) => r.impressions },
                { header: 'Cliques', value: (r) => r.clicks },
                { header: 'Conversões', value: (r) => r.conversions },
                { header: 'Investimento (R$)', value: (r) => r.spend.toFixed(2) },
                { header: 'CPA (R$)', value: (r) => (r.cpa ? r.cpa.toFixed(2) : '') },
              ]}
            />
          </div>

          <DataTable
            data={rows}
            columns={columns}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Buscar palavra-chave ou campanha..."
            searchFilter={(r, q) =>
              r.keyword.toLowerCase().includes(q) || r.campaignName.toLowerCase().includes(q)
            }
            pageSize={15}
            initialSort={{ key: 'conv', direction: 'desc' }}
            stickyHeader
            columnStorageKey="keywords"
          />
        </>
      ) : (
        <EmptyStatePlaceholder
          variant="no-data"
          title="Nenhuma palavra-chave no período"
          description="Verifique se o Google Ads está conectado e rodando campanhas de Search, ou ajuste o filtro de período."
        />
      )}
    </div>
  );
}
