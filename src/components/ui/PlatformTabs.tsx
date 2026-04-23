'use client';

import { cn } from '@/lib/cn';

export type PlatformFilter = 'all' | 'meta' | 'google';

interface PlatformTabsProps {
  value: PlatformFilter;
  onChange: (next: PlatformFilter) => void;
  lockedTo?: PlatformFilter;
  /**
   * Quais providers o account atual tem habilitados. Default: ambos. Quando
   * só um está ativo, a aba do outro some e "Todas" é escondida (redundante).
   * Quando nenhum está ativo, o componente não renderiza.
   */
  availableProviders?: ('meta' | 'google')[];
}

const baseOptions: { key: PlatformFilter; label: string; dotClass?: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'meta', label: 'Meta', dotClass: 'bg-meta' },
  { key: 'google', label: 'Google', dotClass: 'bg-google' },
];

export function PlatformTabs({
  value,
  onChange,
  lockedTo,
  availableProviders = ['meta', 'google'],
}: PlatformTabsProps) {
  const showMeta = availableProviders.includes('meta');
  const showGoogle = availableProviders.includes('google');
  const providerCount = availableProviders.length;

  if (providerCount === 0) return null;

  const options = baseOptions.filter((opt) => {
    if (opt.key === 'meta') return showMeta;
    if (opt.key === 'google') return showGoogle;
    // "Todas" só faz sentido quando há mais de um provider disponível
    return providerCount > 1;
  });

  return (
    <div
      role="tablist"
      aria-label="Filtro de plataforma"
      className="inline-flex items-center rounded-md border border-line bg-surface p-0.5"
    >
      {options.map((opt) => {
        const isActive = value === opt.key;
        const isLocked = !!lockedTo && lockedTo !== opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={isLocked}
            onClick={() => onChange(opt.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'bg-surface-subtle text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink',
              isLocked && 'cursor-not-allowed opacity-40',
            )}
          >
            {opt.dotClass && <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', opt.dotClass)} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
