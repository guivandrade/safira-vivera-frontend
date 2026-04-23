'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { EmptyStatePlaceholder } from '@/components/ui/EmptyStatePlaceholder';
import { ApiErrorsBanner } from '@/components/ui/ApiErrorsBanner';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';
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

type SortKey = 'conversions' | 'spend' | 'ctr' | 'cpa' | 'impressions';

const SORT_OPTIONS: { key: SortKey; label: string; value: (r: CreativeRow) => number }[] = [
  { key: 'conversions', label: 'Mais conversões', value: (r) => r.conversions },
  { key: 'spend', label: 'Maior investimento', value: (r) => r.spend },
  { key: 'impressions', label: 'Mais impressões', value: (r) => r.impressions },
  {
    key: 'ctr',
    label: 'Melhor CTR',
    value: (r) => safeDiv(r.clicks, r.impressions),
  },
  {
    key: 'cpa',
    // CPA: menor é melhor → invertemos o sort (multiplica por -1 depois)
    label: 'Menor CPA',
    value: (r) => (r.conversions > 0 ? safeDiv(r.spend, r.conversions) : Infinity),
  },
];

export function CreativesPage() {
  const [mode, setMode] = useState<'gallery' | 'table'>('gallery');
  const [sortBy, setSortBy] = useState<SortKey>('conversions');
  const {
    rows: allRows,
    errors,
    total,
    hasMore,
    loadMore,
    isLoading,
    isLoadingMore,
    error,
  } = useCreatives();

  // Página é Meta Ads puro. Se o backend retornar `provider: 'google'` (text
  // ads de Search), filtramos aqui — Google tem sua própria página
  // (/palavras-chave) e mistura confundiria a leitura.
  const rows = useMemo(
    () => allRows.filter((c) => c.provider === 'meta'),
    [allRows],
  );

  // Totais precisam ser recalculados dos `rows` filtrados, não reutilizar
  // `data.totals` (que inclui Google).
  const totals = useMemo(
    () => ({
      impressions: rows.reduce((s, c) => s + c.impressions, 0),
      clicks: rows.reduce((s, c) => s + c.clicks, 0),
      conversions: rows.reduce((s, c) => s + c.conversions, 0),
      spend: rows.reduce((s, c) => s + c.spend, 0),
    }),
    [rows],
  );

  const hasData = rows.length > 0;

  const sortedRows = useMemo(() => {
    const option = SORT_OPTIONS.find((o) => o.key === sortBy)!;
    const sorted = [...rows].sort((a, b) => option.value(b) - option.value(a));
    // CPA é melhor quando menor — inverte a ordem
    return sortBy === 'cpa' ? sorted.reverse() : sorted;
  }, [rows, sortBy]);

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
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink">
            Criativos do Meta Ads
            <span className="inline-flex h-6 items-center rounded-md bg-meta/10 px-2 text-[11px] font-semibold uppercase tracking-wider text-meta">
              Meta
            </span>
          </h1>
          <p className="mt-0.5 max-w-2xl text-sm text-ink-muted">
            Rank dos anúncios do Meta Ads por conversão — identifique qual criativo
            (imagem, vídeo, carrossel) está performando melhor.
            {' '}
            <span className="text-ink-subtle">Google Ads não aparece aqui porque usa rede de pesquisa (keywords) — veja em{' '}
              <Link href="/palavras-chave" className="text-accent hover:underline">
                Palavras-chave
              </Link>
              .
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'gallery' && (
            <label className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <span className="hidden sm:inline">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
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

      <ApiErrorsBanner errors={errors} />

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
              {sortedRows.map((c, idx) => (
                <CreativeGalleryCard key={c.id} row={c} rank={idx + 1} />
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

          <LoadMoreButton
            loaded={allRows.length}
            total={total}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onClick={loadMore}
            label="criativos"
          />
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

/**
 * URLs do CDN do Meta (`scontent.*.fbcdn.net`, `lookaside.fbsbx.com`, etc)
 * apontam pro arquivo de imagem/vídeo cru, NÃO pro post. Se o backend
 * popular `previewUrl` com esse tipo de URL (workaround ou bug), não
 * queremos abrir porque a UX é péssima — usuário clica esperando ver
 * o post e vê uma imagem nua em aba nova.
 */
function isLikelyPostPermalink(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    // Rejeita CDNs conhecidos do Meta
    if (host.includes('fbcdn.net') || host.includes('fbsbx.com') || host.includes('cdninstagram.com')) {
      return false;
    }
    // Aceita hosts de post conhecidos
    if (
      host === 'instagram.com' ||
      host.endsWith('.instagram.com') ||
      host === 'facebook.com' ||
      host.endsWith('.facebook.com') ||
      host === 'fb.com' ||
      host.endsWith('.fb.com')
    ) {
      return true;
    }
    // Desconhecido: melhor não linkar do que levar pra lugar errado
    return false;
  } catch {
    return false;
  }
}

function CreativeGalleryCard({ row, rank }: { row: CreativeRow; rank: number }) {
  // Só trata como "link pro post" se previewUrl parecer um permalink real
  // (instagram.com/p/..., facebook.com/..., etc). CDN URLs são ignoradas.
  const hasLink = isLikelyPostPermalink(row.previewUrl);

  const inner = (
    <Card
      padding="none"
      className={cn(
        'overflow-hidden transition-all',
        hasLink && 'cursor-pointer hover:border-accent/40 hover:shadow-md',
      )}
    >
      <div className="relative flex h-40 items-end justify-start overflow-hidden">
        <CreativeThumb row={row} />
        <span className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
          {row.type}
        </span>
        <span className="absolute left-2 bottom-2 rounded bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-ink">
          #{rank}
        </span>
        {hasLink && (
          <span
            className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-ink"
            title="Abrir post no Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Ver post
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-medium text-ink">{row.name}</p>
        <p className="truncate text-[11px] text-ink-subtle">{row.campaignName}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <Stat label="Conv." value={formatNumber(row.conversions)} />
          <Stat label="CTR" value={formatPercent(safeDiv(row.clicks, row.impressions) * 100, 1)} />
          <Stat
            label="CPA"
            value={row.conversions > 0 ? formatCurrency(safeDiv(row.spend, row.conversions), 0) : '—'}
          />
        </div>
      </div>
    </Card>
  );

  if (hasLink) {
    return (
      <a
        href={row.previewUrl!}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir post "${row.name}" no Instagram em nova aba`}
        className="block"
      >
        {inner}
      </a>
    );
  }

  return inner;
}

function CreativeThumb({ row, size }: { row: CreativeRow; size?: number }) {
  const style: React.CSSProperties = size ? { width: size, height: size } : { width: '100%', height: '100%' };
  const className = cn('shrink-0 overflow-hidden rounded border border-line bg-surface-subtle', size ? '' : 'flex-1');

  if (row.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={row.thumbnailUrl}
        alt={`Miniatura do criativo ${row.name}`}
        loading="lazy"
        decoding="async"
        style={style}
        className={className + ' object-cover'}
      />
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
