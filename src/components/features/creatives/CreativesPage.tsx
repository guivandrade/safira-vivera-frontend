'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { EmptyStatePlaceholder } from '@/components/ui/EmptyStatePlaceholder';
import { KpiCard } from '@/components/features/campaigns/KpiCards';
import { CsvExportButton } from '@/components/features/campaigns/CsvExportButton';
import {
  KpiCardsSkeleton,
  TableSkeleton,
} from '@/components/features/campaigns/CampaignsSkeleton';
import { useCreatives } from '@/hooks/use-creatives';
import type { CreativeRow } from '@/types/api';
import { formatCurrency, formatNumber, formatPercent, safeDiv } from '@/lib/formatters';
import { cn } from '@/lib/cn';

export function CreativesPage() {
  const [mode, setMode] = useState<'gallery' | 'table'>('gallery');
  const { data, isLoading, error } = useCreatives();

  const rows = data?.creatives ?? [];
  const totals = data?.totals ?? { impressions: 0, clicks: 0, conversions: 0, spend: 0 };
  const hasData = rows.length > 0;

  const sortedByPerformance = useMemo(
    () => [...rows].sort((a, b) => b.conversions - a.conversions),
    [rows],
  );

  const columns: DataTableColumn<CreativeRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Criativo',
        sortable: true,
        sortValue: (r) => r.name,
        hideable: false,
        render: (r) => (
          <div className="flex items-center gap-3">
            <CreativeThumb row={r} size={40} />
            <div>
              <p className="font-medium text-ink">{r.name}</p>
              <p className="text-[11px] text-ink-subtle">{r.campaignName}</p>
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
        render: (r) => formatCurrency(r.spend),
      },
      {
        key: 'cpa',
        header: 'CPA',
        align: 'right',
        sortable: true,
        sortValue: (r) => safeDiv(r.spend, r.conversions),
        render: (r) => {
          const cpa = safeDiv(r.spend, r.conversions);
          return r.conversions > 0 ? formatCurrency(cpa) : '—';
        },
      },
    ],
    [],
  );

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

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {error instanceof Error ? error.message : 'Erro ao carregar criativos'}
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

      {isLoading ? (
        <>
          <KpiCardsSkeleton />
          <TableSkeleton />
        </>
      ) : hasData ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard metric={{ key: 'total', label: 'Criativos', tooltip: 'Número de criativos ativos.', formatted: formatNumber(rows.length), delta: null }} />
            <KpiCard metric={{ key: 'impr', label: 'Impressões', tooltip: 'Total de vezes que os anúncios foram exibidos.', formatted: formatNumber(totals.impressions), delta: null }} />
            <KpiCard metric={{ key: 'conv', label: 'Conversões', tooltip: 'Conversões atribuídas aos criativos.', formatted: formatNumber(totals.conversions), delta: null }} />
            <KpiCard metric={{ key: 'spend', label: 'Investimento', tooltip: 'Investimento total no período.', formatted: formatCurrency(totals.spend), delta: null }} />
          </div>

          <div className="flex justify-end">
            <CsvExportButton
              rows={rows}
              filename="criativos.csv"
              columns={[
                { header: 'Criativo', value: (r) => r.name },
                { header: 'Campanha', value: (r) => r.campaignName },
                { header: 'Tipo', value: (r) => r.type },
                { header: 'Plataforma', value: (r) => (r.provider === 'google' ? 'Google Ads' : 'Meta Ads') },
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
                  <div className="relative flex h-40 items-end justify-start overflow-hidden">
                    <CreativeThumb row={c} />
                    <span className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
                      {c.type}
                    </span>
                    <span className="absolute left-2 bottom-2 rounded bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-ink">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                    <p className="truncate text-[11px] text-ink-subtle">{c.campaignName}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <Stat label="Conv." value={formatNumber(c.conversions)} />
                      <Stat label="CTR" value={formatPercent(safeDiv(c.clicks, c.impressions) * 100, 1)} />
                      <Stat label="CPA" value={c.conversions > 0 ? formatCurrency(safeDiv(c.spend, c.conversions), 0) : '—'} />
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
                r.name.toLowerCase().includes(q) || r.campaignName.toLowerCase().includes(q)
              }
              initialSort={{ key: 'conv', direction: 'desc' }}
              stickyHeader
              columnStorageKey="creatives"
            />
          )}
        </>
      ) : (
        <EmptyStatePlaceholder
          variant="no-data"
          title="Nenhum criativo no período"
          description="Verifique se o Meta Ads tem campanhas com anúncios ativos ou ajuste o filtro de período."
        />
      )}
    </div>
  );
}

function CreativeThumb({ row, size }: { row: CreativeRow; size?: number }) {
  const style: React.CSSProperties = size ? { width: size, height: size } : { width: '100%', height: '100%' };
  const className = cn('shrink-0 overflow-hidden rounded border border-line bg-surface-subtle', size ? '' : 'flex-1');

  if (row.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={row.thumbnailUrl} alt="" style={style} className={className + ' object-cover'} />
    );
  }
  return (
    <div
      className={className}
      style={{
        ...style,
        background: `linear-gradient(135deg, ${hashColor(row.id, 0)}, ${hashColor(row.id, 3)})`,
      }}
      aria-hidden
    />
  );
}

const palette = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#fb923c'];
function hashColor(seed: string, offset: number): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  return palette[(Math.abs(hash) + offset) % palette.length];
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-ink-subtle">{label}</p>
      <p className="font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}
