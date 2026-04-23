/**
 * Fonte única de verdade para todas as keys de localStorage do app.
 *
 * Motivação: as strings viviam espalhadas em ~10 arquivos e com convenções
 * divergentes (`access_token` sem prefixo vs `safira-theme` vs `safira-cols-`
 * vs `safira-col-order-`). Typos silenciosos = perda de estado; renomear
 * uma key exigia busca textual em todo o repo.
 *
 * Os valores literais estão preservados como estavam em produção — mudar
 * a string invalida sessões ativas (auth) e layouts salvos (prefs). Uma
 * normalização futura de prefixo precisa vir com migration (ler key antiga,
 * escrever key nova) e fica pra outro PR.
 */

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'safira-theme',
  IMPERSONATED_ACCOUNT: 'safira-impersonated',
} as const;

export const storageKeyFor = {
  kpiOrder: (id: string) => `safira-kpi-order-${id}`,
  kpiHidden: (id: string) => `safira-kpi-hidden-${id}`,
  columnOrder: (id: string) => `safira-col-order-${id}`,
  columnHidden: (id: string) => `safira-cols-${id}`,
} as const;
