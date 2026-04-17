import { cn } from '@/lib/cn';
import { Card } from './Card';

export interface TutorialStep {
  done?: boolean;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

interface TutorialStepsProps {
  title?: string;
  description?: string;
  steps: TutorialStep[];
  className?: string;
}

export function TutorialSteps({ title, description, steps, className }: TutorialStepsProps) {
  return (
    <Card padding="md" className={cn('bg-surface', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
          {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
        </div>
      )}
      <ol className="space-y-3">
        {steps.map((step, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                step.done
                  ? 'bg-success text-white'
                  : 'bg-surface-subtle text-ink-muted',
              )}
            >
              {step.done ? '✓' : idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', step.done ? 'text-ink-subtle line-through' : 'text-ink')}>
                {step.title}
              </p>
              {step.description && (
                <p className="mt-0.5 text-xs text-ink-muted">{step.description}</p>
              )}
              {step.action && !step.done && (
                <ActionLink action={step.action} />
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function ActionLink({ action }: { action: NonNullable<TutorialStep['action']> }) {
  const className =
    'mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline';
  const inner = (
    <>
      {action.label}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </>
  );
  if (action.href) {
    return (
      <a href={action.href} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {inner}
    </button>
  );
}
