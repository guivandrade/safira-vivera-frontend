'use client';

import { useMemo } from 'react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { EmptyStatePlaceholder } from '@/components/ui/EmptyStatePlaceholder';
import { TutorialSteps } from '@/components/ui/TutorialSteps';
import { KpiCard } from '@/components/features/campaigns/KpiCards';
import { CsvExportButton } from '@/components/features/campaigns/CsvExportButton';
import { mockKeywords, KeywordRow } from '@/mocks/keywords';
import { formatCurrency, formatNumber, formatPercent, safeDiv } from '@/lib/formatters';

export function KeywordsPage() {
  const rows = mockKeywords;

  const totals = useMemo(() => {
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const conversions = rows.reduce((s, r) => s + r.conversions, 0);
    const spend = rows.reduce((s, r) => s + r.spend, 0);
    return { impressions, clicks, conversions, spend, total: rows.length };
  }, [rows]);

  const columns: DataTableColumn<KeywordRow>[] = [
    {
      key: 'keyword',
      header: 'Palavra-chave',
      sortable: true,
      sortValue: (r) => r.keyword,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.keyword}</p>
          <p className="text-[11px] text-ink-subtle">{r.campaign}</p>
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
      render: (r) => formatCurrency(r.spend, 2),
    },
    {
      key: 'cpa',
      header: 'CPA',
      align: 'right',
      sortable: true,
      sortValue: (r) => safeDiv(r.spend, r.conversions),
      render: (r) => {
        const cpa = safeDiv(r.spend, r.conversions);
        return r.conversions > 0 ? formatCurrency(cpa, 2) : '—';
      },
    },
  ];

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

      <EmptyStatePlaceholder
        variant="sample-data"
        title="Exibindo dados de exemplo"
        description="Aguardando integração com Google Ads keyword_view — a UI já está pronta para receber os dados reais."
      />

      <TutorialSteps
        title="Como essa página vai funcionar quando o backend estiver pronto"
        steps={[
          { done: true, title: 'UI implementada', description: 'Tabela, ordenação, busca e export estão prontos.' },
          { done: false, title: 'Backend expõe /campaigns/keywords', description: 'Query GAQL com keyword_view + ad_group_criterion.keyword.text.', action: { label: 'Ver spec de API', href: 'https://github.com/guivandrade/safira-vivera-backend/issues' } },
          { done: false, title: 'Swap do mock pela chamada real', description: 'Uma mudança só no hook — a página não precisa ser tocada.' },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          metric={{
            key: 'total',
            label: 'Total keywords',
            tooltip: 'Número de palavras-chave ativas no período.',
            formatted: formatNumber(totals.total),
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
            { header: 'Campanha', value: (r) => r.campaign },
            { header: 'Correspondência', value: (r) => r.matchType },
            { header: 'Impressões', value: (r) => r.impressions },
            { header: 'Cliques', value: (r) => r.clicks },
            { header: 'Conversões', value: (r) => r.conversions },
            { header: 'Investimento (R$)', value: (r) => r.spend.toFixed(2) },
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
          r.keyword.toLowerCase().includes(q) || r.campaign.toLowerCase().includes(q)
        }
        pageSize={15}
        initialSort={{ key: 'conv', direction: 'desc' }}
        stickyHeader
      />
    </div>
  );
}
