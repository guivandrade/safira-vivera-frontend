'use client';

import { Tooltip } from './Tooltip';

interface InfoIconProps {
  tooltip: string;
  label?: string;
}

export function InfoIcon({ tooltip, label }: InfoIconProps) {
  return (
    <Tooltip content={tooltip}>
      <button
        type="button"
        aria-label={label ? `Ajuda: ${label}` : 'Mais informações'}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-subtle text-[10px] font-semibold text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        ?
      </button>
    </Tooltip>
  );
}
