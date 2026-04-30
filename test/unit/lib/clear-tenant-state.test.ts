import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  clearAuthAndTenantState,
  clearAuthAndTenantStorageSync,
  clearTenantState,
} from '@/lib/clear-tenant-state';
import { STORAGE_KEYS } from '@/lib/storage-keys';

function seedFullState() {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'tk-access');
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'tk-refresh');
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: 'u1' }));
  localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
  localStorage.setItem(STORAGE_KEYS.IMPERSONATED_ACCOUNT, JSON.stringify({ id: 'a1' }));
  localStorage.setItem('safira-filters', '{"preset":"last7"}');
  localStorage.setItem('safira-saved-views', '[{"name":"v1"}]');
  localStorage.setItem('safira-annotations', '[{"label":"x"}]');
  localStorage.setItem('safira-dashboard-layout', '{"layout":"grid"}');
  localStorage.setItem('safira-kpi-order-acc1', '["spend"]');
  localStorage.setItem('safira-col-order-campaigns', '["name"]');
}

describe('clearTenantState', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient();
    queryClient.setQueryData(['campaign-insights'], { campaigns: [{ id: 'c1' }] });
    queryClient.setQueryData(['preferences'], { theme: 'dark' });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('limpa cache do React Query', () => {
    seedFullState();
    expect(queryClient.getQueryData(['campaign-insights'])).toBeDefined();

    clearTenantState(queryClient);

    expect(queryClient.getQueryData(['campaign-insights'])).toBeUndefined();
    expect(queryClient.getQueryData(['preferences'])).toBeUndefined();
  });

  it('remove stores Zustand não-particionadas', () => {
    seedFullState();

    clearTenantState(queryClient);

    expect(localStorage.getItem('safira-filters')).toBeNull();
    expect(localStorage.getItem('safira-saved-views')).toBeNull();
    expect(localStorage.getItem('safira-annotations')).toBeNull();
    expect(localStorage.getItem('safira-dashboard-layout')).toBeNull();
  });

  it('preserva tokens, USER, IMPERSONATED_ACCOUNT e theme', () => {
    seedFullState();

    clearTenantState(queryClient);

    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('tk-access');
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('tk-refresh');
    expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEYS.IMPERSONATED_ACCOUNT)).toBeDefined();
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
  });

  it('preserva prefs particionadas por accountId', () => {
    seedFullState();

    clearTenantState(queryClient);

    expect(localStorage.getItem('safira-kpi-order-acc1')).toBe('["spend"]');
    expect(localStorage.getItem('safira-col-order-campaigns')).toBe('["name"]');
  });

  it('não estoura quando localStorage está vazio', () => {
    expect(() => clearTenantState(queryClient)).not.toThrow();
  });
});

describe('clearAuthAndTenantState', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient();
    queryClient.setQueryData(['x'], 1);
  });

  it('remove tokens, user, IMPERSONATED_ACCOUNT e tenant stores', () => {
    seedFullState();

    clearAuthAndTenantState(queryClient);

    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.IMPERSONATED_ACCOUNT)).toBeNull();
    expect(localStorage.getItem('safira-filters')).toBeNull();
    expect(localStorage.getItem('safira-saved-views')).toBeNull();
  });

  it('preserva theme e prefs por accountId', () => {
    seedFullState();

    clearAuthAndTenantState(queryClient);

    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
    expect(localStorage.getItem('safira-kpi-order-acc1')).toBe('["spend"]');
  });

  it('limpa o cache do React Query', () => {
    seedFullState();
    expect(queryClient.getQueryData(['x'])).toBe(1);

    clearAuthAndTenantState(queryClient);

    expect(queryClient.getQueryData(['x'])).toBeUndefined();
  });
});

describe('clearAuthAndTenantStorageSync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('remove tudo (tokens + tenant stores) sem precisar de queryClient', () => {
    seedFullState();

    clearAuthAndTenantStorageSync();

    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.IMPERSONATED_ACCOUNT)).toBeNull();
    expect(localStorage.getItem('safira-filters')).toBeNull();
    expect(localStorage.getItem('safira-saved-views')).toBeNull();
    expect(localStorage.getItem('safira-annotations')).toBeNull();
    expect(localStorage.getItem('safira-dashboard-layout')).toBeNull();
  });

  it('preserva theme e prefs por accountId', () => {
    seedFullState();

    clearAuthAndTenantStorageSync();

    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
    expect(localStorage.getItem('safira-kpi-order-acc1')).toBe('["spend"]');
    expect(localStorage.getItem('safira-col-order-campaigns')).toBe('["name"]');
  });

  it('é safe em SSR (window undefined)', () => {
    const original = (globalThis as { window?: unknown }).window;
    // Simula SSR removendo window. jsdom expõe window globalmente.
    vi.stubGlobal('window', undefined);
    expect(() => clearAuthAndTenantStorageSync()).not.toThrow();
    vi.stubGlobal('window', original);
  });
});
