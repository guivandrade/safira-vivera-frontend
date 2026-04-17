'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { formatNumber, formatPercent, safeDiv } from '@/lib/formatters';

interface FunnelStage {
  key: string;
  label: string;
  value: number;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  title?: string;
  description?: string;
  accentClass?: string;
  compact?: boolean;
}

export function FunnelChart({
  stages,
  title,
  description,
  accentClass = 'bg-accent',
  compact = false,
}: FunnelChartProps) {
  const max = stages[0]?.value || 1;

  const content = (
    <div className={cn('space-y-2', compact && 'space-y-1.5')}>
      {stages.map((stage, idx) => {
        const width = Math.max(4, (stage.value / max) * 100);
        const prev = idx > 0 ? stages[idx - 1].value : null;
        const rate = prev !== null ? safeDiv(stage.value, prev) * 100 : null;

        return (
          <div key={stage.key}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-ink">{stage.label}</span>
              <span className="tabular-nums text-ink">{formatNumber(stage.value)}</span>
            </div>
            <div className={cn('mt-1 h-2 w-full rounded bg-surface-subtle', compact && 'h-1.5')}>
              <div
                className={cn('h-full rounded transition-all', accentClass)}
                style={{ width: `${width}%` }}
                aria-label={`${stage.label}: ${stage.value}`}
              />
            </div>
            {rate !== null && !compact && (
              <p className="mt-0.5 text-[10px] text-ink-muted">
                {formatPercent(rate, 2)} do passo anterior
              </p>
            )}
          </div>
        );
      })}
    </div>
  );

  if (!title) return content;

  return (
    <Card padding={compact ? 'sm' : 'md'}>
      <CardHeader title={title} description={description} />
      {content}
    </Card>
  );
}
