'use client';

import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';
import { MonthlyData } from '@/types/campaigns';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatMonthShort, formatNumber } from '@/lib/formatters';
import { useAnnotations } from '@/stores/annotations-store';

interface ConversionsChartProps {
  data: MonthlyData[];
  platformFilter?: 'all' | 'meta' | 'google';
  onBarClick?: (monthIso: string) => void;
  showComparison?: boolean;
}

const META_COLOR = '#1877F2';
const GOOGLE_COLOR = '#EA4335';
const TOTAL_COLOR = '#6366f1';
const COMPARISON_COLOR = 'rgba(99, 102, 241, 0.35)';

interface Row {
  month: string;
  monthIso: string;
  Total: number;
  Meta: number;
  Google: number;
  'Período anterior'?: number;
}

function getValue(item: MonthlyData, platform: 'all' | 'meta' | 'google'): number {
  if (platform === 'meta') return item.meta.conversions;
  if (platform === 'google') return item.google.conversions;
  return item.totalConversions;
}

export function ConversionsChart({ data, platformFilter = 'all', onBarClick, showComparison = false }: ConversionsChartProps) {
  const { annotations } = useAnnotations();
  const chartData: Row[] = data.map((item, idx) => {
    const half = Math.floor(data.length / 2);
    const prevCounterpart = idx >= half ? data[idx - half] : null;
    return {
      month: formatMonthShort(item.month),
      monthIso: item.month,
      Meta: item.meta.conversions,
      Google: item.google.conversions,
      Total: getValue(item, platformFilter),
      'Período anterior': showComparison && prevCounterpart ? getValue(prevCounterpart, platformFilter) : undefined,
    };
  });

  const color =
    platformFilter === 'meta' ? META_COLOR : platformFilter === 'google' ? GOOGLE_COLOR : TOTAL_COLOR;

  const description = buildDescription(platformFilter, showComparison, !!onBarClick);

  const handleBarClick = (payload: any) => {
    if (onBarClick && payload?.monthIso) onBarClick(payload.monthIso);
  };

  return (
    <Card padding="md">
      <CardHeader title="Conversões" description={description} />
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--line)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-subtle)' }}
            content={<BreakdownTooltip platformFilter={platformFilter} showComparison={showComparison} />}
          />
          <Bar
            dataKey="Total"
            fill={color}
            radius={[3, 3, 0, 0]}
            onClick={onBarClick ? handleBarClick : undefined}
            cursor={onBarClick ? 'pointer' : 'default'}
          />
          {showComparison && (
            <Line
              type="monotone"
              dataKey="Período anterior"
              stroke={COMPARISON_COLOR}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          )}
          {annotations
            .filter((a) => chartData.some((row) => row.monthIso === a.month))
            .map((a) => (
              <ReferenceLine
                key={a.id}
                x={formatMonthShort(a.month)}
                stroke="var(--warning)"
                strokeDasharray="3 2"
                label={{
                  value: `★ ${truncate(a.label, 18)}`,
                  fill: 'var(--warning)',
                  fontSize: 10,
                  position: 'insideTop',
                }}
              />
            ))}
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

function buildDescription(platform: string, showComparison: boolean, clickable: boolean): string {
  const base = platform === 'all'
    ? 'Mês a mês — soma Meta + Google'
    : `Mês a mês — ${platform === 'meta' ? 'Meta Ads' : 'Google Ads'}`;
  const parts = [base];
  if (showComparison) parts.push('linha = período anterior');
  if (clickable) parts.push('clique pra filtrar');
  return parts.join(' · ');
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

interface BreakdownTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Row }>;
  label?: string;
  platformFilter: 'all' | 'meta' | 'google';
  showComparison: boolean;
}

function BreakdownTooltip({ active, payload, label, platformFilter, showComparison }: BreakdownTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const prev = row['Período anterior'];

  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-ink">{label}</p>
      {platformFilter === 'all' ? (
        <>
          <TooltipRow dotColor={META_COLOR} label="Meta" value={formatNumber(row.Meta)} />
          <TooltipRow dotColor={GOOGLE_COLOR} label="Google" value={formatNumber(row.Google)} />
          <div className="mt-1.5 border-t border-line-subtle pt-1.5">
            <TooltipRow label="Total" value={formatNumber(row.Total)} bold />
          </div>
        </>
      ) : (
        <TooltipRow
          dotColor={platformFilter === 'meta' ? META_COLOR : GOOGLE_COLOR}
          label={platformFilter === 'meta' ? 'Meta' : 'Google'}
          value={formatNumber(row.Total)}
          bold
        />
      )}
      {showComparison && prev !== undefined && (
        <div className="mt-1.5 border-t border-line-subtle pt-1.5">
          <TooltipRow label="Período anterior" value={formatNumber(prev)} muted />
        </div>
      )}
    </div>
  );
}

function TooltipRow({
  dotColor,
  label,
  value,
  bold,
  muted,
}: {
  dotColor?: string;
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-0.5">
      <span className={`flex items-center gap-1.5 ${muted ? 'text-ink-subtle' : 'text-ink-muted'}`}>
        {dotColor && <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} />}
        {label}
      </span>
      <span className={`tabular-nums ${bold ? 'font-semibold text-ink' : muted ? 'text-ink-subtle' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}
