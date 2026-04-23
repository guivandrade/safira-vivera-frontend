import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveRange, toIsoDate } from '@/lib/period';

const fixedNow = new Date('2026-04-17T10:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(fixedNow);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toIsoDate', () => {
  it('formata como YYYY-MM-DD zero-padded', () => {
    expect(toIsoDate(new Date('2026-01-05T00:00:00'))).toBe('2026-01-05');
    expect(toIsoDate(new Date('2026-12-31T00:00:00'))).toBe('2026-12-31');
  });
});

describe('resolveRange — presets "últimos N dias" (excluem hoje)', () => {
  it('last-7d retorna janela de 7 dias terminando ontem', () => {
    // hoje = 17/04 → ontem = 16/04 → 7 dias = 10-16/04
    expect(resolveRange({ preset: 'last-7d' })).toEqual({
      from: '2026-04-10',
      to: '2026-04-16',
    });
  });

  it('last-90d retorna janela de 90 dias terminando ontem', () => {
    const result = resolveRange({ preset: 'last-90d' });
    expect(result.to).toBe('2026-04-16');
    // 90 dias contando o "to", então from = to - 89 dias
    const from = new Date(result.from);
    const to = new Date(result.to);
    const diffDays = Math.round((to.getTime() - from.getTime()) / 86400000);
    expect(diffDays).toBe(89);
  });

  it('last-180d retorna janela de 180 dias', () => {
    const result = resolveRange({ preset: 'last-180d' });
    expect(result.to).toBe('2026-04-16');
    const from = new Date(result.from);
    const to = new Date(result.to);
    const diffDays = Math.round((to.getTime() - from.getTime()) / 86400000);
    expect(diffDays).toBe(179);
  });
});

describe('resolveRange — presets que INCLUEM hoje', () => {
  it('today retorna só o dia atual', () => {
    expect(resolveRange({ preset: 'today' })).toEqual({
      from: '2026-04-17',
      to: '2026-04-17',
    });
  });

  it('this-month retorna do dia 1 até hoje', () => {
    expect(resolveRange({ preset: 'this-month' })).toEqual({
      from: '2026-04-01',
      to: '2026-04-17',
    });
  });

  it('this-year retorna de 01/01 até hoje', () => {
    expect(resolveRange({ preset: 'this-year' })).toEqual({
      from: '2026-01-01',
      to: '2026-04-17',
    });
  });
});

describe('resolveRange — custom', () => {
  it('passa datas custom quando preset=custom + from/to', () => {
    expect(
      resolveRange({ preset: 'custom', from: '2025-12-01', to: '2025-12-31' }),
    ).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('custom sem from/to cai no fallback de 180d (defensivo)', () => {
    const result = resolveRange({ preset: 'custom' });
    // fallback cai no default case → last-180d
    expect(result.to).toBe('2026-04-16');
  });
});

describe('resolveRange — preset desconhecido', () => {
  it('cai no fallback last-180d', () => {
    const result = resolveRange({ preset: 'foo' as never });
    expect(result.to).toBe('2026-04-16');
  });
});
