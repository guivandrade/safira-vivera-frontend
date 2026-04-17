'use client';

import { useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyStatePlaceholder } from '@/components/ui/EmptyStatePlaceholder';
import {
  mockWeekdayPerformance,
  timeOfDayLabels,
  weekdayLabels,
  WeekdaySlot,
} from '@/mocks/weekday-performance';
import { formatCurrency, formatNumber, safeDiv } from '@/lib/formatters';

type Metric = 'conversions' | 'cpa';

export function WeekdayHeatmap() {
  const slots = mockWeekdayPerformance;

  const { matrix, best, maxValue } = useMemo(() => {
    // matrix[weekday][timeOfDay] = slot
    const matrix: (WeekdaySlot | null)[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 4 }, () => null),
    );
    let best: WeekdaySlot = slots[0];
    let max = 0;

    for (const slot of slots) {
      matrix[slot.weekday][slot.timeOfDay] = slot;
      if (slot.conversions > max) {
        max = slot.conversions;
        best = slot;
      }
    }
    return { matrix, best, maxValue: max };
  }, [slots]);

  const metric: Metric = 'conversions';

  return (
    <Card padding="md">
      <CardHeader
        title="Melhores horários"
        description="Quando suas conversões acontecem — dia da semana × período"
      />

      <EmptyStatePlaceholder
        variant="sample-data"
        title="Dados de exemplo"
        description="Aguardando backend expor granularidade por hora — a UI já está pronta."
      />

      <div className="mt-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header: dias da semana */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5">
            <div />
            {weekdayLabels.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-medium text-ink-muted"
              >
                {day}
              </div>
            ))}

            {/* Linhas: períodos do dia */}
            {timeOfDayLabels.flatMap((period, pIdx) => [
              <div
                key={`label-${period}`}
                className="flex items-center justify-end pr-2 text-[11px] font-medium text-ink-muted"
              >
                {period}
              </div>,
              ...weekdayLabels.map((_, dIdx) => {
                const slot = matrix[dIdx]?.[pIdx];
                if (!slot) return <div key={`empty-${dIdx}-${pIdx}`} />;
                const intensity = maxValue > 0 ? slot.conversions / maxValue : 0;
                const isBest = slot === best;
                return (
                  <HeatCell
                    key={`${dIdx}-${pIdx}`}
                    slot={slot}
                    intensity={intensity}
                    metric={metric}
                    isBest={isBest}
                  />
                );
              }),
            ])}
          </div>
        </div>
      </div>

      {best && (
        <div className="mt-4 rounded-md border border-success/30 bg-success/5 p-3 text-xs">
          <p className="font-medium text-success">
            Pico: {weekdayLabels[best.weekday]} · {timeOfDayLabels[best.timeOfDay]}
          </p>
          <p className="mt-0.5 text-ink-muted">
            {formatNumber(best.conversions)} conversões · CPA{' '}
            {formatCurrency(safeDiv(best.spend, best.conversions), 0)}. Considere reforçar
            verba nesse slot.
          </p>
        </div>
      )}
    </Card>
  );
}

function HeatCell({
  slot,
  intensity,
  metric,
  isBest,
}: {
  slot: WeekdaySlot;
  intensity: number;
  metric: Metric;
  isBest: boolean;
}) {
  // Opacity da cor de fundo baseada na intensidade. Fundo = accent (indigo).
  const opacity = 0.08 + intensity * 0.62;
  const textColor = intensity > 0.5 ? 'var(--accent-fg)' : 'var(--ink)';

  return (
    <div
      className="group relative flex aspect-square items-center justify-center rounded text-[11px] font-semibold tabular-nums transition-transform hover:scale-105"
      style={{
        backgroundColor: `color-mix(in srgb, var(--accent) ${opacity * 100}%, transparent)`,
        color: textColor,
        outline: isBest ? '2px solid var(--success)' : 'none',
      }}
      title={`${slot.conversions} conversões · CPA ${formatCurrency(safeDiv(slot.spend, slot.conversions), 0)}`}
    >
      {metric === 'conversions'
        ? formatNumber(slot.conversions)
        : formatCurrency(safeDiv(slot.spend, slot.conversions), 0)}
    </div>
  );
}
