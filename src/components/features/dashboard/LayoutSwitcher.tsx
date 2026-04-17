'use client';

import { useEffect, useRef, useState } from 'react';
import { LAYOUTS, useDashboardLayout } from '@/stores/dashboard-layout-store';
import { cn } from '@/lib/cn';

export function LayoutSwitcher() {
  const { layout, setLayout } = useDashboardLayout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Layout do dashboard"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink-muted hover:bg-surface-subtle hover:text-ink"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        {LAYOUTS[layout].label}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
        >
          <div className="border-b border-line px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              Layout do dashboard
            </p>
          </div>
          {(Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]).map((key) => {
            const cfg = LAYOUTS[key];
            const active = key === layout;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setLayout(key);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-surface-subtle',
                  active && 'bg-accent/5',
                )}
              >
                <span className="flex w-full items-center justify-between text-sm">
                  <span className={cn('font-medium', active ? 'text-ink' : 'text-ink')}>
                    {cfg.label}
                  </span>
                  {active && <span className="text-[10px] text-accent">● atual</span>}
                </span>
                <span className="text-[11px] text-ink-subtle">{cfg.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
