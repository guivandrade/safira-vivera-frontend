'use client';

import { ReactNode } from 'react';
import { CampaignSummary } from '@/types/campaigns';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusDot } from '@/components/ui/StatusDot';
import { CardHeader } from '@/components/ui/Card';
import { formatCurrency, formatNumber, safeDiv } from '@/lib/formatters';
import { CsvExportButton } from './CsvExportButton';

interface TopCampaignsTableProps {
  campaigns: CampaignSummary[];
  onRowClick?: (campaign: CampaignSummary) => void;
}

export function TopCampaignsTable({ campaigns, onRowClick }: TopCampaignsTableProps) {
  const columns: DataTableColumn<CampaignSummary>[] = [
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusDot status="active" />,
      width: '110px',
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
      render: (c) => <span className="font-medium text-ink">{c.name}</span>,
      hideable: false,
    },
    {
      key: 'spend',
      header: 'Investimento',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.spend,
      render: (c) => formatCurrency(c.spend, 2),
    },
    {
      key: 'conv',
      header: 'Conversões',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.conversions,
      render: (c) => formatNumber(c.conversions),
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
      key: 'cpa',
      header: 'CPA',
      tooltip: 'Custo por Aquisição: investimento ÷ conversões.',
      align: 'right',
      sortable: true,
      sortValue: (c) => c.cpa ?? Infinity,
      render: (c) => (c.cpa && isFinite(c.cpa) ? formatCurrency(c.cpa, 2) : '—'),
    },
  ];

  const computeSummary = (rows: CampaignSummary[]): Record<string, ReactNode> => {
    const totalSpend = rows.reduce((s, c) => s + c.spend, 0);
    const totalConv = rows.reduce((s, c) => s + c.conversions, 0);
    const totalClicks = rows.reduce((s, c) => s + c.clicks, 0);
    const cpa = safeDiv(totalSpend, totalConv);
    return {
      status: <span className="text-xs font-semibold text-ink-muted">Total ({rows.length})</span>,
      spend: formatCurrency(totalSpend, 2),
      conv: formatNumber(totalConv),
      clicks: formatNumber(totalClicks),
      cpa: totalConv > 0 ? formatCurrency(cpa, 2) : '—',
    };
  };

  return (
    <div className="space-y-3">
      <CardHeader
        title="Campanhas mais performáticas"
        description="Ordenadas por investimento — clique para detalhes"
        action={<CsvExportButton rows={campaigns} filename="top-campanhas.csv" />}
      />
      <DataTable
        data={campaigns}
        columns={columns}
        rowKey={(c) => `${c.provider}-${c.id}`}
        onRowClick={onRowClick}
        initialSort={{ key: 'spend', direction: 'desc' }}
        emptyLabel="Nenhuma campanha encontrada no período"
        columnStorageKey="top-campaigns"
        summaryRow={computeSummary}
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
