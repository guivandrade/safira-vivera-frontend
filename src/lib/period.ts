import type { DateRangeValue } from '@/components/ui/DateRangePicker';

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Presets "Últimos N dias" seguem a convenção do Meta/Google Ads Manager:
 * usam **D-1** (exclui hoje) porque o dia corrente tem dados incompletos
 * (campanhas ainda rodando, conversões ainda entrando).
 *
 * Ex.: hoje = 17/04. "Últimos 7 dias" = 10/04 até 16/04 (7 dias exatos).
 *
 * Presets "Este mês" e "Este ano" são exceção — incluem hoje, porque
 * a intenção é mostrar o mês/ano corrente em progresso.
 */
function lastNDaysRange(n: number, today: Date): { from: string; to: string } {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const from = new Date(yesterday);
  from.setDate(yesterday.getDate() - (n - 1));
  return { from: toIsoDate(from), to: toIsoDate(yesterday) };
}

export function resolveRange(period: DateRangeValue): { from: string; to: string } {
  const today = new Date();

  if (period.preset === 'custom' && period.from && period.to) {
    return { from: period.from, to: period.to };
  }

  switch (period.preset) {
    case 'today':
      // Exceção: inclui só o dia corrente. Usado pra acompanhamento em tempo
      // real durante o dia (spend rolando, conversões chegando).
      return { from: toIsoDate(today), to: toIsoDate(today) };
    case 'last-7d':
      return lastNDaysRange(7, today);
    case 'last-90d':
      return lastNDaysRange(90, today);
    case 'last-180d':
      return lastNDaysRange(180, today);
    case 'this-month': {
      // Exceção: inclui hoje (mês em progresso)
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
    case 'this-year': {
      // Exceção: inclui hoje (ano em progresso)
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: toIsoDate(from), to: toIsoDate(today) };
    }
    default:
      return lastNDaysRange(180, today);
  }
}
