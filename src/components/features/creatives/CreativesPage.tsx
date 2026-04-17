'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { EmptyStatePlaceholder } from '@/components/ui/EmptyStatePlaceholder';
import { KpiCard } from '@/components/features/campaigns/KpiCards';
import { CsvExportButton } from '@/components/features/campaigns/CsvExportButton';
import { mockCreatives, CreativeRow } from '@/mocks/creatives';
import { formatCurrency, formatNumber, formatPercent, safeDiv } from '@/lib/formatters';
import { cn } from '@/lib/cn';

export function CreativesPage() {
  const [mode, setMode] = useState<'gallery' | 'table'>('gallery');
  const rows = mockCreatives;

  const totals = useMemo(() => {
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const conversions = rows.reduce((s, r) => s + r.conversions, 0);
    const spend = rows.reduce((s, r) => s + r.spend, 0);
    return { impressions, clicks, conversions, spend };
  }, [rows]);

  const sortedByPerformance = useMemo(
    () => [...rows].sort((a, b) => b.conversions - a.conversions),
    [rows],
  );

  const columns: DataTableColumn<CreativeRow>[] = [
    {
      key: 'name',
      header: 'Criativo',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 shrink-0 rounded border border-line"
            style={{ background: r.thumbnail }}
            aria-hidden
          />
          <div>
            <p className="font-medium text-ink">{r.name}</p>
            <p className="text-[11px] text-ink-subtle">{r.campaign}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (r) => (
        <span className="inline-flex items-center rounded border border-line bg-surface-subtle px-2 py-0.5 text-[11px] text-ink-muted">
          {r.type}
        </span>
      ),
      width: '120px',
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
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Criativos</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Rank dos anúncios do Meta por conversão — identifique o que está funcionando.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-meta" /> Meta Ads
          </span>
          <div className="inline-flex items-center rounded-md border border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setMode('gallery')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium',
                mode === 'gallery' ? 'bg-surface-subtle text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              Galeria
            </button>
            <button
              type="button"
              onClick={() => setMode('table')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium',
                mode === 'table' ? 'bg-surface-subtle text-ink' : 'text-ink-muted hover:text-ink',
              )}
            >
              Tabela
            </button>
          </div>
        </div>
      </div>

      <EmptyStatePlaceholder
        variant="sample-data"
        title="Exibindo dados de exemplo"
        description="Aguardando integração com Meta Ads em nível de criativo — a UI já está pronta."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          metric={{
            key: 'total',
            label: 'Criativos',
            tooltip: 'Número de criativos ativos.',
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
            key: 'conv',
            label: 'Conversões',
            tooltip: 'Conversões atribuídas aos criativos.',
            formatted: formatNumber(totals.conversions),
            delta: null,
          }}
        />
        <KpiCard
          metric={{
            key: 'spend',
            label: 'Investimento',
            tooltip: 'Investimento total no período.',
            formatted: formatCurrency(totals.spend, 0),
            delta: null,
          }}
        />
      </div>

      <div className="flex justify-end">
        <CsvExportButton
          rows={rows}
          filename="criativos.csv"
          columns={[
            { header: 'Criativo', value: (r) => r.name },
            { header: 'Campanha', value: (r) => r.campaign },
            { header: 'Tipo', value: (r) => r.type },
            { header: 'Impressões', value: (r) => r.impressions },
            { header: 'Cliques', value: (r) => r.clicks },
            { header: 'Conversões', value: (r) => r.conversions },
            { header: 'Investimento (R$)', value: (r) => r.spend.toFixed(2) },
          ]}
        />
      </div>

      {mode === 'gallery' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedByPerformance.map((c, idx) => (
            <Card key={c.id} padding="none" className="overflow-hidden">
              <div
                className="relative flex h-40 items-end justify-start p-3"
                style={{ background: c.thumbnail }}
                aria-hidden
              >
                <span className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
                  {c.type}
                </span>
                <span className="rounded bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-ink">
                  #{idx + 1}
                </span>
              </div>
              <div className="p-4">
                <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                <p className="truncate text-[11px] text-ink-subtle">{c.campaign}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Stat label="Conv." value={formatNumber(c.conversions)} />
                  <Stat
                    label="CTR"
                    value={formatPercent(safeDiv(c.clicks, c.impressions) * 100, 1)}
                  />
                  <Stat
                    label="CPA"
                    value={c.conversions > 0 ? formatCurrency(safeDiv(c.spend, c.conversions), 0) : '—'}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Buscar criativo ou campanha..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) || r.campaign.toLowerCase().includes(q)
          }
          initialSort={{ key: 'conv', direction: 'desc' }}
          stickyHeader
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-ink-subtle">{label}</p>
      <p className="font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}
