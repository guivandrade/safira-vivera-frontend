'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyData } from '@/types/campaigns';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatCurrency, formatMonthShort } from '@/lib/formatters';

interface SpendChartProps {
  data: MonthlyData[];
  platformFilter?: 'all' | 'meta' | 'google';
}

const META_COLOR = '#1877F2';
const GOOGLE_COLOR = '#EA4335';
const TOTAL_COLOR = '#6366f1';

interface Row {
  month: string;
  Total: number;
  Meta: number;
  Google: number;
}

export function SpendChart({ data, platformFilter = 'all' }: SpendChartProps) {
  const chartData: Row[] = data.map((item) => ({
    month: formatMonthShort(item.month),
    Meta: item.meta.spend,
    Google: item.google.spend,
    Total:
      platformFilter === 'meta'
        ? item.meta.spend
        : platformFilter === 'google'
          ? item.google.spend
          : item.totalSpend,
  }));

  const color =
    platformFilter === 'meta' ? META_COLOR : platformFilter === 'google' ? GOOGLE_COLOR : TOTAL_COLOR;

  const description =
    platformFilter === 'all'
      ? 'Mês a mês — soma Meta + Google'
      : `Mês a mês — ${platformFilter === 'meta' ? 'Meta Ads' : 'Google Ads'}`;

  return (
    <Card padding="md">
      <CardHeader title="Investimento" description={description} />
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--line)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v)}
            tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-subtle)' }}
            content={<BreakdownTooltip platformFilter={platformFilter} format={formatCurrency} />}
          />
          <Bar dataKey="Total" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface BreakdownTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Row }>;
  label?: string;
  platformFilter: 'all' | 'meta' | 'google';
  format: (value: number) => string;
}

function BreakdownTooltip({ active, payload, label, platformFilter, format }: BreakdownTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-ink">{label}</p>
      {platformFilter === 'all' ? (
        <>
          <Line dotColor={META_COLOR} label="Meta" value={format(row.Meta)} />
          <Line dotColor={GOOGLE_COLOR} label="Google" value={format(row.Google)} />
          <div className="mt-1.5 border-t border-line-subtle pt-1.5">
            <Line label="Total" value={format(row.Total)} bold />
          </div>
        </>
      ) : (
        <Line
          dotColor={platformFilter === 'meta' ? META_COLOR : GOOGLE_COLOR}
          label={platformFilter === 'meta' ? 'Meta' : 'Google'}
          value={format(row.Total)}
          bold
        />
      )}
    </div>
  );
}

function Line({
  dotColor,
  label,
  value,
  bold,
}: {
  dotColor?: string;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-0.5">
      <span className="flex items-center gap-1.5 text-ink-muted">
        {dotColor && <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} />}
        {label}
      </span>
      <span className={`tabular-nums ${bold ? 'font-semibold text-ink' : 'text-ink'}`}>{value}</span>
    </div>
  );
}
