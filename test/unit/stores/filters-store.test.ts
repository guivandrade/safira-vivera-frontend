import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useFiltersStore } from '@/stores/filters-store';

/**
 * Reset da store entre testes. Zustand persist middleware mantém referência
 * global — sem reset, um teste vaza estado no próximo.
 */
function resetStore() {
  useFiltersStore.setState({
    period: { preset: 'last-180d' },
    platform: 'all',
    monthFilter: null,
    includeBoosts: false,
    includeInactive: false,
  });
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

afterEach(() => {
  localStorage.clear();
});

describe('filters-store defaults', () => {
  it('period default é last-180d', () => {
    expect(useFiltersStore.getState().period).toEqual({ preset: 'last-180d' });
  });

  it('platform default é all', () => {
    expect(useFiltersStore.getState().platform).toBe('all');
  });

  it('includeBoosts default é false', () => {
    expect(useFiltersStore.getState().includeBoosts).toBe(false);
  });

  it('includeInactive default é false', () => {
    expect(useFiltersStore.getState().includeInactive).toBe(false);
  });
});

describe('filters-store setters', () => {
  it('setPeriod zera monthFilter (evita drill-down órfão)', () => {
    useFiltersStore.setState({ monthFilter: '2026-03' });
    useFiltersStore.getState().setPeriod({ preset: 'last-7d' });
    const s = useFiltersStore.getState();
    expect(s.period).toEqual({ preset: 'last-7d' });
    expect(s.monthFilter).toBeNull();
  });

  it('setPlatform não zera outros filtros', () => {
    useFiltersStore.getState().setIncludeBoosts(true);
    useFiltersStore.getState().setPlatform('meta');
    expect(useFiltersStore.getState().includeBoosts).toBe(true);
    expect(useFiltersStore.getState().platform).toBe('meta');
  });

  it('setMonthFilter aceita null para limpar drill-down', () => {
    useFiltersStore.getState().setMonthFilter('2026-02');
    expect(useFiltersStore.getState().monthFilter).toBe('2026-02');
    useFiltersStore.getState().setMonthFilter(null);
    expect(useFiltersStore.getState().monthFilter).toBeNull();
  });
});

describe('filters-store persistence', () => {
  it('persiste sob a chave safira-filters', () => {
    useFiltersStore.getState().setIncludeBoosts(true);
    const raw = localStorage.getItem('safira-filters');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.includeBoosts).toBe(true);
  });

  it('não persiste monthFilter (drill-down é efêmero)', () => {
    useFiltersStore.getState().setMonthFilter('2026-02');
    // monthFilter não está no partialize, então não deve aparecer em localStorage
    const raw = localStorage.getItem('safira-filters');
    const parsed = JSON.parse(raw!);
    expect(parsed.state.monthFilter).toBeUndefined();
  });

  it('persiste version 2 (migration schema atual)', () => {
    useFiltersStore.getState().setPlatform('meta');
    const raw = localStorage.getItem('safira-filters');
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(2);
  });
});
