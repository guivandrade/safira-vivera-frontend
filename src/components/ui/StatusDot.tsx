import { cn } from '@/lib/cn';
import type { CampaignStatus } from '@/types/campaigns';

export type StatusDotVariant = 'active' | 'paused' | 'removed' | 'error';

const config: Record<
  StatusDotVariant,
  { label: string; dot: string; text: string }
> = {
  active: { label: 'Ativa', dot: 'bg-success', text: 'text-ink' },
  paused: { label: 'Pausada', dot: 'bg-ink-subtle', text: 'text-ink-muted' },
  removed: { label: 'Removida', dot: 'bg-danger', text: 'text-ink-muted' },
  error: { label: 'Erro', dot: 'bg-warning', text: 'text-warning' },
};

interface StatusDotProps {
  status: StatusDotVariant;
  label?: string;
  className?: string;
}

export function StatusDot({ status, label, className }: StatusDotProps) {
  const c = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', c.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {label ?? c.label}
    </span>
  );
}

/**
 * Converte o status cru do backend (UPPERCASE) pro variant do StatusDot.
 * Se vier undefined (backend antigo), assume 'active' como fallback seguro.
 */
export function statusToVariant(status: CampaignStatus | undefined): StatusDotVariant {
  if (!status) return 'active';
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'PAUSED':
      return 'paused';
    case 'REMOVED':
      return 'removed';
    default:
      return 'active';
  }
}
