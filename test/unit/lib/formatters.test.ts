import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatCompact,
  formatMonthShort,
  safeDiv,
  percentDelta,
} from '@/lib/formatters';

// Locale pt-BR usa U+00A0 (NBSP) como separador de grupo e vírgula decimal.
// Os testes aceitam qualquer whitespace pra não travar em ICU differences entre Node versions.
const currencyPattern = (value: string) => new RegExp(`^R\\$\\s?${value}$`);

describe('formatCurrency', () => {
  it('formata valor inteiro em BRL', () => {
    expect(formatCurrency(1000)).toMatch(currencyPattern('1\\.000,00'));
  });

  it('formata valor decimal com 2 casas', () => {
    expect(formatCurrency(1234.56)).toMatch(currencyPattern('1\\.234,56'));
  });

  it('respeita fractionDigits customizado', () => {
    expect(formatCurrency(10.5, 0)).toMatch(currencyPattern('11'));
  });

  it('retorna "—" para Infinity', () => {
    expect(formatCurrency(Infinity)).toBe('—');
    expect(formatCurrency(-Infinity)).toBe('—');
  });

  it('retorna "—" para NaN', () => {
    expect(formatCurrency(NaN)).toBe('—');
  });

  it('formata zero', () => {
    expect(formatCurrency(0)).toMatch(currencyPattern('0,00'));
  });
});

describe('formatNumber', () => {
  it('formata inteiro com separador pt-BR', () => {
    expect(formatNumber(1234)).toMatch(/^1\.234$/);
  });

  it('respeita fractionDigits', () => {
    expect(formatNumber(1234.567, 2)).toMatch(/^1\.234,57$/);
  });

  it('retorna "—" para NaN', () => {
    expect(formatNumber(NaN)).toBe('—');
  });

  it('retorna "—" para Infinity', () => {
    expect(formatNumber(Infinity)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('adiciona símbolo % ao final', () => {
    expect(formatPercent(50)).toMatch(/^50,00%$/);
  });

  it('retorna "—" para Infinity', () => {
    expect(formatPercent(Infinity)).toBe('—');
  });

  it('respeita fractionDigits', () => {
    expect(formatPercent(12.345, 1)).toMatch(/^12,3%$/);
  });
});

describe('formatCompact', () => {
  it('formata mil como 1 mil', () => {
    expect(formatCompact(1000)).toMatch(/1\s*mil/);
  });

  it('retorna "—" para Infinity', () => {
    expect(formatCompact(Infinity)).toBe('—');
  });
});

describe('safeDiv', () => {
  it('divide normalmente', () => {
    expect(safeDiv(10, 2)).toBe(5);
  });

  it('retorna 0 quando denominador é 0 (evita Infinity/NaN)', () => {
    expect(safeDiv(10, 0)).toBe(0);
  });

  it('retorna 0 quando denominador é NaN', () => {
    expect(safeDiv(10, NaN)).toBe(0);
  });

  it('retorna 0 quando denominador é Infinity', () => {
    expect(safeDiv(10, Infinity)).toBe(0);
  });

  it('permite numerador zero', () => {
    expect(safeDiv(0, 5)).toBe(0);
  });

  it('permite valores negativos', () => {
    expect(safeDiv(-10, 2)).toBe(-5);
  });
});

describe('percentDelta', () => {
  it('calcula delta positivo', () => {
    expect(percentDelta(150, 100)).toBe(50);
  });

  it('calcula delta negativo', () => {
    expect(percentDelta(80, 100)).toBe(-20);
  });

  it('retorna 0 quando ambos são 0', () => {
    expect(percentDelta(0, 0)).toBe(0);
  });

  it('retorna null quando previous é 0 e current é não-zero', () => {
    expect(percentDelta(100, 0)).toBeNull();
  });

  it('retorna null quando current é NaN', () => {
    expect(percentDelta(NaN, 100)).toBeNull();
  });

  it('retorna null quando previous é NaN', () => {
    expect(percentDelta(100, NaN)).toBeNull();
  });

  it('usa Math.abs de previous para deltas negativos corretos', () => {
    // current=-50, previous=-100 → delta = ((-50) - (-100)) / 100 * 100 = 50%
    expect(percentDelta(-50, -100)).toBe(50);
  });
});

describe('formatMonthShort', () => {
  it('formata YYYY-MM para abbreviated pt-BR', () => {
    // "2026-01" → "jan./26" ou "jan./2026" (varia por ICU)
    const result = formatMonthShort('2026-01');
    expect(result.toLowerCase()).toMatch(/jan/);
    expect(result).toMatch(/26/);
  });

  it('formata mês 12', () => {
    const result = formatMonthShort('2025-12');
    expect(result.toLowerCase()).toMatch(/dez/);
  });
});
