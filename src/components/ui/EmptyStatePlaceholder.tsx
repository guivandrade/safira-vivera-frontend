import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import {
  ComingSoonIllustration,
  DisconnectedIllustration,
  NoDataIllustration,
} from './illustrations';

type Variant = 'coming-soon' | 'sample-data' | 'no-data' | 'disconnected';

interface EmptyStatePlaceholderProps {
  variant?: Variant;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyStatePlaceholder({
  variant = 'coming-soon',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStatePlaceholderProps) {
  if (variant === 'sample-data') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs dark:border-amber-500/30 dark:bg-amber-500/10',
          className,
        )}
      >
        <span aria-hidden className="mt-0.5 text-amber-600 dark:text-amber-400">●</span>
        <div>
          <p className="font-medium text-amber-900 dark:text-amber-200">{title}</p>
          {description && (
            <p className="mt-0.5 text-amber-800/80 dark:text-amber-300/80">{description}</p>
          )}
        </div>
      </div>
    );
  }

  const illustration = icon ?? defaultIllustration(variant);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-muted px-6 py-10 text-center',
        className,
      )}
    >
      {illustration && <div className="mb-4 w-32 text-ink-subtle">{illustration}</div>}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function defaultIllustration(variant: Variant): ReactNode | null {
  switch (variant) {
    case 'no-data':
      return <NoDataIllustration className="w-full" />;
    case 'disconnected':
      return <DisconnectedIllustration className="w-full" />;
    case 'coming-soon':
      return <ComingSoonIllustration className="w-full" />;
    default:
      return null;
  }
}
