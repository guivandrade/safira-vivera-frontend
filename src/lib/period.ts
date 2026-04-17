import type { DateRangeValue } from '@/components/ui/DateRangePicker';

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function resolveRange(period: DateRangeValue): { from: string; to: string } {
  const today = new Date();

  if (period.preset === 'custom' && period.from && period.to) {
    return { from: period.from, to: period.to };
  }

  switch (period.preset) {
    case 'last-7d': {
      // Inclui hoje — "últimos 7 dias" = hoje + 6 dias atrás (total 7).
      // Matches convenção do Meta/Google Ads Manager.
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
    case 'this-month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
    case 'this-year': {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
    case 'last-90d': {
      const from = new Date(today);
      from.setDate(from.getDate() - 90);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
    case 'last-180d':
    default: {
      const from = new Date(today);
      from.setDate(from.getDate() - 180);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
  }
}
