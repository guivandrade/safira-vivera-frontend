'use client';

import { Button } from '@/components/ui/Button';
import { buildCsv, CsvColumn, downloadCsv } from '@/lib/csv-export';
import { CampaignSummary } from '@/types/campaigns';

interface CsvExportButtonProps<T = CampaignSummary> {
  rows: T[];
  columns?: CsvColumn<T>[];
  filename?: string;
  label?: string;
}

const defaultColumns: CsvColumn<CampaignSummary>[] = [
  { header: 'Plataforma', value: (c) => (c.provider === 'google' ? 'Google Ads' : 'Meta Ads') },
  { header: 'Nome', value: (c) => c.name },
  { header: 'ID', value: (c) => c.id },
  { header: 'Investimento (R$)', value: (c) => c.spend.toFixed(2) },
  { header: 'Conversões', value: (c) => c.conversions },
  { header: 'Cliques', value: (c) => c.clicks },
  { header: 'Impressões', value: (c) => c.impressions },
  { header: 'CPA (R$)', value: (c) => (c.cpa && isFinite(c.cpa) ? c.cpa.toFixed(2) : '') },
];

export function CsvExportButton<T = CampaignSummary>({
  rows,
  columns,
  filename = 'campanhas.csv',
  label = 'Exportar CSV',
}: CsvExportButtonProps<T>) {
  const disabled = rows.length === 0;
  const cols = (columns ?? (defaultColumns as unknown as CsvColumn<T>[]));

  const handleClick = () => {
    const csv = buildCsv(rows, cols);
    const stamped = filename.replace(/(\.csv)?$/, `-${new Date().toISOString().slice(0, 10)}.csv`);
    downloadCsv(stamped, csv);
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleClick}
      disabled={disabled}
      leftIcon={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      }
    >
      {label}
    </Button>
  );
}
