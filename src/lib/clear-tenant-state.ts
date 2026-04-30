import type { QueryClient } from '@tanstack/react-query';
import { STORAGE_KEYS } from './storage-keys';

/**
 * Stores Zustand persistidas que NÃO são particionadas por accountId.
 * Quando o tenant ativo muda (logout, impersonate enter/exit), elas precisam
 * ser limpas pra evitar vazamento de filtros, views salvas e anotações de
 * uma conta aparecerem na seguinte.
 *
 * Stores particionadas por accountId (`safira-kpi-order-{id}`,
 * `safira-col-order-{id}`, `safira-cols-{id}`, `safira-kpi-hidden-{id}`) NÃO
 * entram aqui — elas já são naturalmente isoladas e sobrevivem entre sessões.
 *
 * `safira-theme` também não entra — é preferência de aparência do device.
 */
const TENANT_SCOPED_STORE_KEYS = [
  'safira-filters',
  'safira-saved-views',
  'safira-annotations',
  'safira-dashboard-layout',
] as const;

function removeKeys(keys: readonly string[]) {
  if (typeof window === 'undefined') return;
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // quota / private mode — segue o jogo
    }
  });
}

/**
 * Limpa cache do React Query + stores Zustand não particionadas por account.
 * Usado em transições de tenant (impersonate enter/exit) onde os tokens novos
 * já foram setados pelo caller e não devem ser tocados.
 */
export function clearTenantState(queryClient: QueryClient) {
  queryClient.clear();
  removeKeys(TENANT_SCOPED_STORE_KEYS);
}

/**
 * Limpa tudo: tokens, dados de user, IMPERSONATED_ACCOUNT, cache RQ, stores
 * tenant-scoped. Mantém apenas `safira-theme` e prefs de coluna/KPI por
 * accountId (que sobrevivem entre logins e ficam disponíveis se o mesmo user
 * voltar).
 *
 * Usado em logout normal (UserMenu, OrphanAccessScreen).
 */
export function clearAuthAndTenantState(queryClient: QueryClient) {
  removeKeys([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
    STORAGE_KEYS.IMPERSONATED_ACCOUNT,
  ]);
  clearTenantState(queryClient);
}

/**
 * Versão sem queryClient pra contextos não-React (interceptor do api-client).
 * Limpa tokens + stores tenant-scoped. O cache do React Query é descartado
 * implicitamente pelo full reload (`window.location.href`) que segue.
 */
export function clearAuthAndTenantStorageSync() {
  removeKeys([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
    STORAGE_KEYS.IMPERSONATED_ACCOUNT,
    ...TENANT_SCOPED_STORE_KEYS,
  ]);
}
