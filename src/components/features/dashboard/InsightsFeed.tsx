'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { CampaignInsightsResponse } from '@/types/campaigns';
import { generateInsights, Insight, InsightSeverity } from '@/lib/insights';

interface InsightsFeedProps {
  data: CampaignInsightsResponse;
}

export function InsightsFeed({ data }: InsightsFeedProps) {
  const insights = useMemo(() => generateInsights(data), [data]);

  if (insights.length === 0) return null;

  return (
    <section aria-label="Insights">
      <CardHeader
        title="Insights"
        description="Descobertas automáticas baseadas nos dados do período"
      />
      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  );
}

const severityStyles: Record<
  InsightSeverity,
  { accent: string; dot: string; label: string }
> = {
  critical: {
    accent: 'border-l-danger',
    dot: 'bg-danger',
    label: 'Atenção',
  },
  warning: {
    accent: 'border-l-warning',
    dot: 'bg-warning',
    label: 'Aviso',
  },
  info: {
    accent: 'border-l-accent',
    dot: 'bg-accent',
    label: 'Informação',
  },
  positive: {
    accent: 'border-l-success',
    dot: 'bg-success',
    label: 'Boa notícia',
  },
};

function InsightCard({ insight }: { insight: Insight }) {
  const s = severityStyles[insight.severity];

  return (
    <Card padding="md" className={cn('border-l-4', s.accent)}>
      <div className="flex items-center gap-1.5">
        <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
          {s.label}
        </span>
      </div>
      <p className="mt-1.5 break-words text-sm font-semibold text-ink">{insight.title}</p>
      <p className="mt-1 break-words text-xs text-ink-muted">{insight.description}</p>
      {insight.action && (
        <Link
          href={insight.action.href}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          {insight.action.label}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3 w-3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      )}
    </Card>
  );
}
