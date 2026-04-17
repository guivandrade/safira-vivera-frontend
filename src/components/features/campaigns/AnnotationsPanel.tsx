'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAnnotations } from '@/stores/annotations-store';
import { MonthlyData } from '@/types/campaigns';
import { formatMonthShort } from '@/lib/formatters';

interface AnnotationsPanelProps {
  monthlyData: MonthlyData[];
}

export function AnnotationsPanel({ monthlyData }: AnnotationsPanelProps) {
  const { annotations, add, remove } = useAnnotations();
  const [adding, setAdding] = useState(false);
  const [month, setMonth] = useState(monthlyData[monthlyData.length - 1]?.month ?? '');
  const [label, setLabel] = useState('');

  const visible = useMemo(
    () =>
      [...annotations]
        .filter((a) => monthlyData.some((m) => m.month === a.month))
        .sort((a, b) => b.month.localeCompare(a.month)),
    [annotations, monthlyData],
  );

  const save = () => {
    if (!month || !label.trim()) return;
    add(month, label);
    setLabel('');
    setAdding(false);
  };

  if (!adding && visible.length === 0) {
    return (
      <Card padding="md">
        <CardHeader
          title="Anotações"
          description="Marque eventos nos gráficos (campanha pausada, promo, etc)"
          action={
            <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
              Adicionar
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card padding="md">
      <CardHeader
        title="Anotações"
        description={`${visible.length} anotação${visible.length === 1 ? '' : 'ões'} no período`}
        action={
          !adding && (
            <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
              Adicionar
            </Button>
          )
        }
      />

      {adding && (
        <div className="mb-3 rounded-md border border-line bg-surface-muted p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_auto]">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              {monthlyData.map((m) => (
                <option key={m.month} value={m.month}>
                  {formatMonthShort(m.month)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="Ex: Pausei campanha X"
              maxLength={60}
              className="rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setAdding(false); setLabel(''); }}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={save} disabled={!label.trim()}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {visible.length > 0 && (
        <ul className="space-y-1.5">
          {visible.map((a) => (
            <li
              key={a.id}
              className="group flex items-center justify-between gap-3 rounded-md border border-line bg-surface-muted px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-warning">
                  ★ {formatMonthShort(a.month)}
                </span>
                <span className="ml-2 text-sm text-ink">{a.label}</span>
              </div>
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label={`Remover anotação ${a.label}`}
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
    </Card>
  );
}
