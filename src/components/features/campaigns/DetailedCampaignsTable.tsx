'use client';

import { useMemo } from 'react';
import { CampaignInsightsResponse, CampaignSummary } from '@/types/campaigns';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusDot } from '@/components/ui/StatusDot';
import { CardHeader } from '@/components/ui/Card';
import { formatCurrency, formatNumber, formatPercent, safeDiv } from '@/lib/formatters';
import { CsvExportButton } from './CsvExportButton';
import { useFiltersStore } from '@/stores/filters-store';
import { useToast } from '@/providers/toast-provider';
import { buildCsv, downloadCsv } from '@/lib/csv-export';

interface DetailedCampaignsTableProps {
  data: CampaignInsightsResponse;
  onRowClick?: (campaign: CampaignSummary) => void;
}

export function DetailedCampaignsTable({ data, onRowClick }: DetailedCampaignsTableProps) {
  const platform = useFiltersStore((s) => s.platform);
  const toast = useToast();

  const filteredCampaigns = useMemo(() => {
    if (platform === 'all') return data.campaigns;
    return data.campaigns.filter((c) => c.provider === platform);
  }, [data.campaigns, platform]);

  const columns: DataTableColumn<CampaignSummary>[] = [
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusDot status="active" />,
      width: '100px',
      hideable: false,
    },
    {
      key: 'provider',
      header: 'Plat.',
      render: (c) => <ProviderTag provider={c.provider} />,
      width: '90px',
    },
    {
      key: 'name',
      header: 'Campanha',
      sortable: true,
      sortValue: (c) => c.name.toLowerCase(),
      hideable: false,
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{c.name}</p>
          <p className="truncate font-mono text-[10px] text-ink-subtle">{c.id}</p>
        </div>
      ),
    },
    {
      key: 'spend',
      header: 'Invest.',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.spend,
      render: (c) => formatCurrency(c.spend, 2),
    },
    {
      key: 'conv',
      header: 'Conv.',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.conversions,
      render: (c) => formatNumber(c.conversions),
    },
    {
      key: 'cpa',
      header: 'CPA',
      tooltip: 'Custo por Aquisição.',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.cpa ?? Infinity,
      render: (c) => (c.cpa && isFinite(c.cpa) ? formatCurrency(c.cpa, 2) : '—'),
    },
    {
      key: 'ctr',
      header: 'CTR',
      tooltip: 'Click-Through Rate: cliques ÷ impressões.',
      align: 'right',
      sortable: true,
      sortValue: (c) => safeDiv(c.clicks, c.impressions),
      render: (c) => {
        const ctr = safeDiv(c.clicks, c.impressions) * 100;
        return c.impressions > 0 ? formatPercent(ctr, 2) : '—';
      },
    },
    {
      key: 'clicks',
      header: 'Cliques',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.clicks,
      render: (c) => formatNumber(c.clicks),
    },
    {
      key: 'impr',
      header: 'Impr.',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.impressions,
      render: (c) => formatNumber(c.impressions),
    },
  ];

  const filterSuffix = platform === 'all' ? 'todas' : platform;

  return (
    <div className="space-y-3">
      <CardHeader
        title="Todas as campanhas"
        description={`${filteredCampaigns.length} campanha${filteredCampaigns.length === 1 ? '' : 's'} no período`}
        action={
          <CsvExportButton
            rows={filteredCampaigns}
            filename={`campanhas-${filterSuffix}.csv`}
          />
        }
      />
      <DataTable
        data={filteredCampaigns}
        columns={columns}
        rowKey={(c) => `${c.provider}-${c.id}`}
        onRowClick={onRowClick}
        searchable
        searchPlaceholder="Buscar campanha por nome ou ID..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
        }
        pageSize={20}
        initialSort={{ key: 'spend', direction: 'desc' }}
        stickyHeader
        emptyLabel="Nenhuma campanha encontrada"
        columnStorageKey="campaigns-detailed"
        selectable
        bulkActions={[
          {
            label: 'Exportar CSV',
            onRun: (rows) => {
              const csv = buildCsv(rows, [
                { header: 'Plataforma', value: (c) => (c.provider === 'google' ? 'Google Ads' : 'Meta Ads') },
                { header: 'Nome', value: (c) => c.name },
                { header: 'ID', value: (c) => c.id },
                { header: 'Investimento (R$)', value: (c) => c.spend.toFixed(2) },
                { header: 'Conversões', value: (c) => c.conversions },
                { header: 'Cliques', value: (c) => c.clicks },
                { header: 'Impressões', value: (c) => c.impressions },
              ]);
              downloadCsv(`campanhas-selecionadas-${new Date().toISOString().slice(0, 10)}.csv`, csv);
              toast.success(`${rows.length} campanha${rows.length === 1 ? '' : 's'} exportada${rows.length === 1 ? '' : 's'}`);
            },
          },
        ]}
      />
    </div>
  );
}

function ProviderTag({ provider }: { provider: 'google' | 'meta' }) {
  const dot = provider === 'google' ? 'bg-google' : 'bg-meta';
  const label = provider === 'google' ? 'Google' : 'Meta';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

interface CampaignDetailDrawerProps {
  campaign: CampaignSummary | null;
  onClose: () => void;
}

export function CampaignDetailDrawer({ campaign, onClose }: CampaignDetailDrawerProps) {
  if (!campaign) return null;
  const ctr = safeDiv(campaign.clicks, campaign.impressions) * 100;
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <ProviderTag provider={campaign.provider} />
            <h2 id="drawer-title" className="mt-2 text-lg font-semibold text-ink">
              {campaign.name}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-ink-subtle">{campaign.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-ink-muted hover:bg-surface-subtle hover:text-ink"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <StatusDot status="active" />

        <dl className="mt-6 grid grid-cols-2 gap-3">
          <StatItem label="Investimento" value={formatCurrency(campaign.spend, 2)} />
          <StatItem label="Conversões" value={formatNumber(campaign.conversions)} />
          <StatItem label="Cliques" value={formatNumber(campaign.clicks)} />
          <StatItem label="Impressões" value={formatNumber(campaign.impressions)} />
          <StatItem
            label="CPA"
            value={campaign.cpa && isFinite(campaign.cpa) ? formatCurrency(campaign.cpa, 2) : '—'}
          />
          <StatItem label="CTR" value={campaign.impressions > 0 ? formatPercent(ctr, 2) : '—'} />
        </dl>

        <div className="mt-6 rounded-md bg-surface-subtle p-3 text-xs text-ink-muted">
          Breakdown diário, histórico de status e por-criativo estarão disponíveis quando o backend
          expandir os endpoints de Meta/Google.
        </div>
      </aside>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface-muted p-3">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
