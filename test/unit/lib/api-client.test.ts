import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AxiosError } from 'axios';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import apiClient from '@/lib/api-client';

interface MockState {
  refreshCalls: number;
  failedUrls: Set<string>;
  refreshTokensIssued: string[];
  newAccessToken: string;
  refreshShouldFail: boolean;
}

let state: MockState;
let originalAdapter: AxiosAdapter | undefined;

function makeResponse(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config,
  };
}

function reject401(config: InternalAxiosRequestConfig, data: unknown = { error: 'unauthorized' }): never {
  const response = makeResponse(config, data, 401);
  throw new AxiosError(
    'Request failed with status code 401',
    AxiosError.ERR_BAD_RESPONSE,
    config,
    null,
    response,
  );
}

function buildAdapter(): AxiosAdapter {
  return async (config) => {
    const url = config.url ?? '';

    if (url.includes('/auth/refresh')) {
      state.refreshCalls++;
      if (state.refreshShouldFail) {
        reject401(config, { error: 'invalid_grant' });
      }
      const newRefresh = `REFRESH_${state.refreshCalls}`;
      state.refreshTokensIssued.push(newRefresh);
      await new Promise((r) => setTimeout(r, 20));
      return makeResponse(config, {
        access_token: state.newAccessToken,
        refresh_token: newRefresh,
      });
    }

    const token = (config.headers?.Authorization as string | undefined) ?? '';
    const isBearerNew = token === `Bearer ${state.newAccessToken}`;

    if (!isBearerNew && !state.failedUrls.has(url)) {
      state.failedUrls.add(url);
      reject401(config);
    }

    return makeResponse(config, { url, ok: true });
  };
}

beforeEach(() => {
  state = {
    refreshCalls: 0,
    failedUrls: new Set(),
    refreshTokensIssued: [],
    newAccessToken: 'NEW_ACCESS_TOKEN',
    refreshShouldFail: false,
  };
  originalAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;
  apiClient.defaults.adapter = buildAdapter();

  localStorage.clear();
  localStorage.setItem('access_token', 'OLD_TOKEN');
  localStorage.setItem('refresh_token', 'OLD_REFRESH');

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/dashboard', search: '', href: '' },
    });
  }
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

describe('api-client — refresh_token rotation', () => {
  it('persiste o novo refresh_token rotacionado após refresh', async () => {
    await apiClient.get('/protected');

    expect(state.refreshCalls).toBe(1);
    expect(localStorage.getItem('refresh_token')).toBe('REFRESH_1');
    expect(localStorage.getItem('access_token')).toBe('NEW_ACCESS_TOKEN');
  });

  it('persiste access_token mesmo quando backend não rotaciona refresh', async () => {
    const baseAdapter = buildAdapter();
    apiClient.defaults.adapter = async (config) => {
      if (config.url?.includes('/auth/refresh')) {
        state.refreshCalls++;
        return makeResponse(config, { access_token: state.newAccessToken });
      }
      return baseAdapter(config);
    };

    await apiClient.get('/protected');

    expect(localStorage.getItem('access_token')).toBe('NEW_ACCESS_TOKEN');
    expect(localStorage.getItem('refresh_token')).toBe('OLD_REFRESH');
  });
});

describe('api-client — single-flight 401', () => {
  it('compartilha a mesma refresh entre múltiplos 401 concorrentes', async () => {
    const [r1, r2, r3] = await Promise.all([
      apiClient.get('/a'),
      apiClient.get('/b'),
      apiClient.get('/c'),
    ]);

    expect(state.refreshCalls).toBe(1);
    expect(r1.data).toEqual({ url: '/a', ok: true });
    expect(r2.data).toEqual({ url: '/b', ok: true });
    expect(r3.data).toEqual({ url: '/c', ok: true });
  });

  it('todas as requests concorrentes usam o novo access_token', async () => {
    const seenAuthHeaders: string[] = [];
    const baseAdapter = buildAdapter();
    apiClient.defaults.adapter = async (config) => {
      const auth = config.headers?.Authorization as string | undefined;
      if (!config.url?.includes('/auth/refresh')) {
        seenAuthHeaders.push(auth ?? '');
      }
      return baseAdapter(config);
    };

    await Promise.all([apiClient.get('/x'), apiClient.get('/y')]);

    const finalAuths = seenAuthHeaders.filter((h) => h === `Bearer ${state.newAccessToken}`);
    expect(finalAuths.length).toBeGreaterThanOrEqual(2);
  });

  it('reset refreshPromise permite nova refresh em round seguinte', async () => {
    await apiClient.get('/round1');
    expect(state.refreshCalls).toBe(1);

    // Reset estado pra forçar novo 401 na próxima request
    state.failedUrls.clear();
    state.newAccessToken = 'EVEN_NEWER_TOKEN';
    localStorage.setItem('access_token', 'OLD_TOKEN_2');

    await apiClient.get('/round2');
    expect(state.refreshCalls).toBe(2);
  });
});

describe('api-client — falha no refresh', () => {
  it('limpa tokens quando refresh retorna 401', async () => {
    state.refreshShouldFail = true;

    await expect(apiClient.get('/protected')).rejects.toBeDefined();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('não tenta refresh quando não há refresh_token no storage', async () => {
    localStorage.removeItem('refresh_token');

    await expect(apiClient.get('/protected')).rejects.toBeDefined();

    expect(state.refreshCalls).toBe(0);
  });
});

describe('api-client — não intercepta auth endpoints', () => {
  it('não tenta refresh em 401 vindo do /auth/login', async () => {
    state.refreshShouldFail = true;

    await expect(
      apiClient.post('/auth/login', { email: 'x', password: 'y' }),
    ).rejects.toBeDefined();

    expect(state.refreshCalls).toBe(0);
  });
});

describe('api-client — request interceptor', () => {
  it('adiciona Bearer token do localStorage em cada request', async () => {
    localStorage.setItem('access_token', 'EXISTING_TOKEN');
    state.newAccessToken = 'EXISTING_TOKEN'; // evita 401

    const seen: string[] = [];
    apiClient.defaults.adapter = async (config) => {
      seen.push(config.headers?.Authorization as string);
      return makeResponse(config, { ok: true });
    };

    await apiClient.get('/foo');

    expect(seen[0]).toBe('Bearer EXISTING_TOKEN');
  });

  it('não adiciona Authorization quando não há token', async () => {
    localStorage.clear();
    state.newAccessToken = '';

    const seen: Array<string | undefined> = [];
    apiClient.defaults.adapter = async (config) => {
      seen.push(config.headers?.Authorization as string | undefined);
      return makeResponse(config, { ok: true });
    };

    await apiClient.get('/public');

    expect(seen[0]).toBeUndefined();
  });
});
