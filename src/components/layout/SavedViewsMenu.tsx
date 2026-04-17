'use client';

import { useEffect, useRef, useState } from 'react';
import { useFiltersStore } from '@/stores/filters-store';
import { useSavedViews, SavedView } from '@/stores/saved-views-store';
import { useToast } from '@/providers/toast-provider';
import { cn } from '@/lib/cn';

export function SavedViewsMenu() {
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const period = useFiltersStore((s) => s.period);
  const platform = useFiltersStore((s) => s.platform);
  const setPeriod = useFiltersStore((s) => s.setPeriod);
  const setPlatform = useFiltersStore((s) => s.setPlatform);
  const { views, add, remove } = useSavedViews();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setNaming(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (naming) setTimeout(() => inputRef.current?.focus(), 20);
  }, [naming]);

  const apply = (v: SavedView) => {
    setPeriod(v.period);
    setPlatform(v.platform);
    setOpen(false);
    toast.success(`View "${v.name}" aplicada`);
  };

  const save = () => {
    if (!name.trim()) return;
    add({ name: name.trim(), period, platform });
    setName('');
    setNaming(false);
    toast.success(`View "${name.trim()}" salva`);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Views salvas"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink-muted hover:bg-surface-subtle hover:text-ink"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        Views
        {views.length > 0 && (
          <span className="rounded-full bg-surface-subtle px-1.5 text-[10px]">{views.length}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute left-0 z-30 mt-2 w-72 overflow-hidden rounded-lg border border-line bg-surface shadow-lg',
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              Views salvas
            </p>
            <button
              type="button"
              onClick={() => setNaming((v) => !v)}
              className="text-xs font-medium text-accent hover:underline"
            >
              {naming ? 'Cancelar' : 'Salvar atual'}
            </button>
          </div>

          {naming && (
            <div className="flex gap-2 border-b border-line px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                placeholder="Ex: Meta últimos 90d"
                maxLength={40}
                className="flex-1 rounded border border-line bg-surface-muted px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="button"
                onClick={save}
                disabled={!name.trim()}
                className="rounded bg-accent px-2.5 text-xs font-medium text-accent-fg disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          )}

          {views.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-ink-muted">
              Nenhuma view salva ainda. Configure filtros e clique em &ldquo;Salvar atual&rdquo;.
            </p>
          ) : (
            <ul className="max-h-[50vh] overflow-y-auto py-1">
              {views.map((v) => (
                <li key={v.id} className="group flex items-center justify-between gap-2 px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => apply(v)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-ink">{v.name}</p>
                    <p className="truncate text-[11px] text-ink-subtle">
                      {describeView(v)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(v.id)}
                    aria-label={`Remover ${v.name}`}
                    className="shrink-0 rounded p-1 text-ink-subtle opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function describeView(v: SavedView): string {
  const periodLabel: Record<string, string> = {
    'this-month': 'Este mês',
    'last-90d': 'Últimos 90d',
    'last-180d': 'Últimos 180d',
    'this-year': 'Este ano',
    custom: `${v.period.from} → ${v.period.to}`,
  };
  const platformLabel: Record<string, string> = {
    all: 'Todas plataformas',
    meta: 'Meta',
    google: 'Google',
  };
  return `${periodLabel[v.period.preset] ?? v.period.preset} · ${platformLabel[v.platform]}`;
}
