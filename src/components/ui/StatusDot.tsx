import { cn } from '@/lib/cn';

export type CampaignStatus = 'active' | 'paused' | 'removed' | 'error';

const config: Record<
  CampaignStatus,
  { label: string; dot: string; text: string }
> = {
  active: { label: 'Ativa', dot: 'bg-success', text: 'text-ink' },
  paused: { label: 'Pausada', dot: 'bg-ink-subtle', text: 'text-ink-muted' },
  removed: { label: 'Removida', dot: 'bg-danger', text: 'text-ink-muted' },
  error: { label: 'Erro', dot: 'bg-warning', text: 'text-warning' },
};

interface StatusDotProps {
  status: CampaignStatus;
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
