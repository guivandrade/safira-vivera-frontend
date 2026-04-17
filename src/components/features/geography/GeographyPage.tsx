'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { EmptyStatePlaceholder } from '@/components/ui/EmptyStatePlaceholder';
import { TutorialSteps } from '@/components/ui/TutorialSteps';
import { KpiCard } from '@/components/features/campaigns/KpiCards';
import { CsvExportButton } from '@/components/features/campaigns/CsvExportButton';
import { LocalRadiusMap } from './LocalRadiusMap';
import {
  mockClinic,
  mockNeighborhoods,
  mockNeighborhoodQueries,
  NeighborhoodRow,
} from '@/mocks/geography';
import { formatCurrency, formatNumber, formatPercent, safeDiv } from '@/lib/formatters';
import { cn } from '@/lib/cn';

export function GeographyPage() {
  const neighborhoods = mockNeighborhoods;
  const clinic = mockClinic;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const spend = neighborhoods.reduce((s, n) => s + n.spend, 0);
    const conversions = neighborhoods.reduce((s, n) => s + n.conversions, 0);
    const clicks = neighborhoods.reduce((s, n) => s + n.clicks, 0);
    const searches = neighborhoods.reduce((s, n) => s + n.searches, 0);
    return { spend, conversions, clicks, searches };
  }, [neighborhoods]);

  const topByConversions = useMemo(
    () => [...neighborhoods].sort((a, b) => b.conversions - a.conversions).slice(0, 5),
    [neighborhoods],
  );

  const selected = neighborhoods.find((n) => n.id === selectedId) ?? null;
  const selectedQueries = selectedId
    ? mockNeighborhoodQueries.filter((q) => q.neighborhoodId === selectedId)
    : [];

  const columns: DataTableColumn<NeighborhoodRow>[] = [
    {
      key: 'name',
      header: 'Bairro',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-[11px] text-ink-subtle">
            {r.city}/{r.state} · {r.distanceKm}km
          </p>
        </div>
      ),
    },
    {
      key: 'searches',
      header: 'Buscas',
      tooltip: 'Total de buscas relacionadas originadas deste bairro.',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.searches,
      render: (r) => formatNumber(r.searches),
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
      key: 'conv',
      header: 'Conv.',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.conversions,
      render: (r) => formatNumber(r.conversions),
    },
    {
      key: 'convRate',
      header: 'Conv. %',
      tooltip: 'Conversões por clique vindo desse bairro.',
      align: 'right',
      sortable: true,
      sortValue: (r) => safeDiv(r.conversions, r.clicks),
      render: (r) => formatPercent(safeDiv(r.conversions, r.clicks) * 100, 2),
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
      render: (r) =>
        r.conversions > 0 ? formatCurrency(safeDiv(r.spend, r.conversions)) : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Geografia</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          De onde vêm os clientes da {clinic.name} num raio de {clinic.radiusKm}km — quais bairros
          convertem mais, e o que eles buscam.
        </p>
      </div>

      <EmptyStatePlaceholder
        variant="sample-data"
        title="Exibindo dados de exemplo"
        description="Aguardando integração com geographic_view (Google) e breakdown por região (Meta). Quando chegar, a UI preenche sozinha."
      />

      <TutorialSteps
        title="Como essa página vai funcionar quando o backend estiver pronto"
        steps={[
          { done: true, title: 'UI mapa radial + tabela implementada' },
          { done: false, title: 'Configurar endereço da clínica', description: 'Endpoint /settings/clinic com geocoding automático.' },
          { done: false, title: 'Backend expõe /campaigns/geography/local', description: 'Cruza user_location_view (Google) com lat/lng da clínica pra filtrar no raio.' },
          { done: false, title: 'Swap do mock pela chamada real' },
        ]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard metric={{ key: 'bairros', label: 'Bairros ativos', tooltip: 'Bairros que geraram ao menos 1 busca no período.', formatted: formatNumber(neighborhoods.length), delta: null }} />
        <KpiCard metric={{ key: 'searches', label: 'Buscas locais', tooltip: 'Buscas no Google vindas de dispositivos dentro do raio.', formatted: formatNumber(totals.searches), delta: null }} />
        <KpiCard metric={{ key: 'conv', label: 'Conversões', tooltip: 'Conversões atribuídas a usuários dentro do raio.', formatted: formatNumber(totals.conversions), delta: null }} />
        <KpiCard metric={{ key: 'spend', label: 'Investimento', tooltip: 'Investimento total em campanhas locais.', formatted: formatCurrency(totals.spend), delta: null }} />
      </div>

      {/* Mapa + Top bairros */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card padding="md">
          <CardHeader
            title={`Raio de ${clinic.radiusKm}km`}
            description={`${clinic.address} · ${clinic.city}/${clinic.state} — clique num bairro para ver buscas`}
          />
          <LocalRadiusMap
            clinic={clinic}
            neighborhoods={neighborhoods}
            highlightedId={selectedId}
            onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
          />
        </Card>

        <div className="space-y-3">
          <Card padding="md">
            <CardHeader title="Top 5 bairros" description="Ordenados por conversões" />
            <ol className="space-y-2">
              {topByConversions.map((n, idx) => (
                <li
                  key={n.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md border border-transparent p-2 hover:bg-surface-subtle',
                    selectedId === n.id && 'border-accent/40 bg-accent/5',
                  )}
                  onClick={() => setSelectedId((prev) => (prev === n.id ? null : n.id))}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-[11px] font-semibold text-ink">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{n.name}</p>
                    <p className="text-[11px] text-ink-subtle">
                      {n.distanceKm}km · {formatNumber(n.searches)} buscas
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {formatNumber(n.conversions)}
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          {selected && (
            <Card padding="md">
              <CardHeader
                title={selected.name}
                description={`${formatNumber(selected.searches)} buscas · ${formatNumber(selected.conversions)} conversões`}
              />
              {selectedQueries.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                    O que este bairro mais busca
                  </p>
                  <ul className="space-y-1.5">
                    {selectedQueries.map((q) => (
                      <li
                        key={q.query}
                        className="flex items-center justify-between gap-3 rounded border border-line bg-surface-muted px-2.5 py-1.5 text-xs"
                      >
                        <span className="truncate text-ink">{q.query}</span>
                        <span className="shrink-0 tabular-nums text-ink-muted">
                          {q.conversions} conv.
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-ink-muted">
                  Sem dados de buscas específicas para este bairro ainda.
                </p>
              )}
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="mt-3 text-[11px] text-ink-muted hover:text-ink"
              >
                Limpar seleção
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* Tabela completa */}
      <div className="space-y-3">
        <CardHeader
          title="Todos os bairros"
          description={`${neighborhoods.length} bairros no raio`}
          action={
            <CsvExportButton
              rows={neighborhoods}
              filename="bairros.csv"
              columns={[
                { header: 'Bairro', value: (r) => r.name },
                { header: 'Cidade', value: (r) => r.city },
                { header: 'UF', value: (r) => r.state },
                { header: 'Distância (km)', value: (r) => r.distanceKm },
                { header: 'Buscas', value: (r) => r.searches },
                { header: 'Cliques', value: (r) => r.clicks },
                { header: 'Conversões', value: (r) => r.conversions },
                { header: 'Investimento (R$)', value: (r) => r.spend.toFixed(2) },
              ]}
            />
          }
        />
        <DataTable
          data={neighborhoods}
          columns={columns}
          rowKey={(r) => r.id}
          searchable
          searchPlaceholder="Buscar bairro..."
          searchFilter={(r, q) => r.name.toLowerCase().includes(q)}
          initialSort={{ key: 'conv', direction: 'desc' }}
          onRowClick={(r) => setSelectedId(r.id)}
          stickyHeader
        />
      </div>
    </div>
  );
}
