import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS, storageKeyFor } from '@/lib/storage-keys';

/**
 * Contract test: **mudar valores dessas keys invalida sessões ativas**
 * (auth) e layouts salvos (prefs). Se esse teste quebrar, foi intencional?
 * Se sim, vem com migration plan. Nunca só "atualize o snapshot".
 */
describe('storage-keys contract', () => {
  it('auth keys têm valores estáveis', () => {
    expect(STORAGE_KEYS.ACCESS_TOKEN).toBe('access_token');
    expect(STORAGE_KEYS.REFRESH_TOKEN).toBe('refresh_token');
    expect(STORAGE_KEYS.USER).toBe('user');
  });

  it('theme key tem valor estável', () => {
    expect(STORAGE_KEYS.THEME).toBe('safira-theme');
  });

  it('kpiOrder factory retorna chave esperada', () => {
    expect(storageKeyFor.kpiOrder('dashboard')).toBe('safira-kpi-order-dashboard');
  });

  it('kpiHidden factory retorna chave esperada', () => {
    expect(storageKeyFor.kpiHidden('dashboard')).toBe('safira-kpi-hidden-dashboard');
  });

  it('columnOrder factory retorna chave esperada', () => {
    expect(storageKeyFor.columnOrder('campaigns')).toBe('safira-col-order-campaigns');
  });

  it('columnHidden factory retorna chave esperada', () => {
    expect(storageKeyFor.columnHidden('campaigns')).toBe('safira-cols-campaigns');
  });

  it('factories aceitam ids com caracteres especiais sem escape', () => {
    // Esses ids podem vir de nomes de tabela/página. Não escapamos por
    // design — o namespace é controlado internamente. Se algum dia vir
    // de input externo, precisa tratar.
    expect(storageKeyFor.kpiOrder('foo bar')).toBe('safira-kpi-order-foo bar');
    expect(storageKeyFor.columnHidden('tab/1')).toBe('safira-cols-tab/1');
  });
});
