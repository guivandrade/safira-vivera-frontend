'use client';

import { cn } from '@/lib/cn';

export type PlatformFilter = 'all' | 'meta' | 'google';

interface PlatformTabsProps {
  value: PlatformFilter;
  onChange: (next: PlatformFilter) => void;
  lockedTo?: PlatformFilter;
}

const options: { key: PlatformFilter; label: string; dotClass?: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'meta', label: 'Meta', dotClass: 'bg-meta' },
  { key: 'google', label: 'Google', dotClass: 'bg-google' },
];

export function PlatformTabs({ value, onChange, lockedTo }: PlatformTabsProps) {
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
