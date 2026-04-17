'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

interface PreviewItem {
  label: string;
  value: string;
}

interface ShortcutCardProps {
  href: string;
  title: string;
  description: string;
  preview?: PreviewItem[];
}

export function ShortcutCard({ href, title, description, preview }: ShortcutCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <Card className="group transition-colors hover:border-accent/40 hover:bg-surface-subtle" padding="md">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">{title}</p>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-ink" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
        <p className="mt-1 text-xs text-ink-muted">{description}</p>

        {preview && preview.length > 0 && (
          <div
            className={cn(
              'mt-3 space-y-1 overflow-hidden transition-all duration-200',
              hovered ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
              Prévia
            </p>
            {preview.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 text-[11px]"
              >
                <span className="truncate text-ink-muted">{item.label}</span>
                <span className="shrink-0 tabular-nums font-medium text-ink">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}
