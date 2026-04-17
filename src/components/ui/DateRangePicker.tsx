'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { resolveRange } from '@/lib/period';

export type PresetKey = 'last-7d' | 'this-month' | 'last-90d' | 'last-180d' | 'this-year' | 'custom';

export interface DateRangeValue {
  preset: PresetKey;
  /** ISO YYYY-MM-DD — obrigatório apenas quando preset === 'custom' */
  from?: string;
  /** ISO YYYY-MM-DD — obrigatório apenas quando preset === 'custom' */
  to?: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
}

const presets: { key: PresetKey; label: string }[] = [
  { key: 'last-7d', label: 'Últimos 7 dias' },
  { key: 'this-month', label: 'Este mês' },
  { key: 'last-90d', label: 'Últimos 90 dias' },
  { key: 'last-180d', label: 'Últimos 180 dias' },
  { key: 'this-year', label: 'Este ano' },
];

function formatDayMonth(iso: string): string {
  const parts = iso.split('-');
  return `${parts[2]}/${parts[1]}`;
}

function formatDayMonthYear(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Label discreto com o range resolvido. Quando preset != custom, mostra
 * o range como sub-info pra Vera saber exatamente o que o preset significa
 * ("Este mês" pode ser 01/04–17/04 ou 01/04–30/04, depende do dia).
 */
function formatResolvedRange(value: DateRangeValue): string {
  const { from, to } = resolveRange(value);
  // Mesmo ano: elide repetido ("01/04 – 17/04/2026")
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  if (sameYear) {
    return `${formatDayMonth(from)} – ${formatDayMonthYear(to)}`;
  }
  return `${formatDayMonthYear(from)} – ${formatDayMonthYear(to)}`;
}

function parseIsoDateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(value.from ?? '');
  const [to, setTo] = useState(value.to ?? '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handlePreset = (preset: { key: PresetKey }) => {
    onChange({ preset: preset.key });
    setOpen(false);
  };

  const handleApplyCustom = () => {
    if (!from || !to) return;
    if (parseIsoDateLocal(from) > parseIsoDateLocal(to)) return;
    onChange({ preset: 'custom', from, to });
    setOpen(false);
  };

  // Label do botão custom: mostra o range RESOLVIDO (independe de preset).
  // Vera sabe exatamente qual janela está aplicada sem precisar abrir o modal.
  const resolvedRangeLabel = formatResolvedRange(value);

  return (
    <div className="inline-flex items-center gap-2">
      <div role="tablist" className="inline-flex items-center rounded-md border border-line bg-surface p-0.5">
        {presets.map((p) => {
          const active = value.preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handlePreset(p)}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                active ? 'bg-surface-subtle text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
              )}
            >
              {p.label}
            </button>
          );
        })}
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              value.preset === 'custom' ? 'bg-surface-subtle text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="tabular-nums">{resolvedRangeLabel}</span>
          </button>

          {open && (
            <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-line bg-surface p-4 shadow-lg">
              <p className="mb-3 text-xs font-medium text-ink">Período customizado</p>
              <label className="mb-2 block text-xs text-ink-muted">
                De
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <label className="mb-3 block text-xs text-ink-muted">
                Até
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-line px-3 py-1 text-xs text-ink-muted hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={!from || !to}
                  className="rounded bg-accent px-3 py-1 text-xs font-medium text-accent-fg disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
