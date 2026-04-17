'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGoals } from '@/stores/goals-store';
import { CampaignInsightsResponse } from '@/types/campaigns';
import { formatCurrency, formatNumber, safeDiv } from '@/lib/formatters';
import { cn } from '@/lib/cn';

interface GoalsCardProps {
  data: CampaignInsightsResponse;
}

export function GoalsCard({ data }: GoalsCardProps) {
  const { goals, setGoals } = useGoals();
  const [editing, setEditing] = useState(false);

  const current = useMemo(() => {
    const lastMonth = data.monthlyData[data.monthlyData.length - 1];
    if (!lastMonth) return { conversions: 0, spend: 0, cpa: 0 };
    return {
      conversions: lastMonth.totalConversions,
      spend: lastMonth.totalSpend,
      cpa: safeDiv(lastMonth.totalSpend, lastMonth.totalConversions),
    };
  }, [data]);

  const anyGoalSet = goals.monthlyConversions > 0 || goals.maxCpa > 0 || goals.monthlyBudget > 0;

  if (!anyGoalSet && !editing) {
    return (
      <Card padding="md">
        <CardHeader
          title="Metas"
          description="Defina metas pra acompanhar progresso e ser alertada quando algo escapar"
        />
        <Button size="sm" variant="primary" onClick={() => setEditing(true)}>
          Definir metas
        </Button>
      </Card>
    );
  }

  if (editing) {
    return <EditGoals goals={goals} onSave={(g) => { setGoals(g); setEditing(false); }} onCancel={() => setEditing(false)} />;
  }

  return (
    <Card padding="md">
      <CardHeader
        title="Metas do mês"
        description="Progresso do mês corrente"
        action={
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Editar
          </Button>
        }
      />

      <div className="space-y-3">
        {goals.monthlyConversions > 0 && (
          <GoalRow
            label="Conversões"
            current={current.conversions}
            target={goals.monthlyConversions}
            format={formatNumber}
            higherIsBetter
          />
        )}
        {goals.monthlyBudget > 0 && (
          <GoalRow
            label="Investimento"
            current={current.spend}
            target={goals.monthlyBudget}
            format={(v) => formatCurrency(v, 0)}
            higherIsBetter={false}
            ceilingGoal
          />
        )}
        {goals.maxCpa > 0 && (
          <GoalRow
            label="CPA"
            current={current.cpa}
            target={goals.maxCpa}
            format={(v) => formatCurrency(v, 0)}
            higherIsBetter={false}
            ceilingGoal
          />
        )}
      </div>
    </Card>
  );
}

function GoalRow({
  label,
  current,
  target,
  format,
  higherIsBetter,
  ceilingGoal = false,
}: {
  label: string;
  current: number;
  target: number;
  format: (v: number) => string;
  higherIsBetter: boolean;
  ceilingGoal?: boolean;
}) {
  const pct = Math.max(0, Math.min(200, (current / target) * 100));
  const display = Math.min(100, pct);

  // ceilingGoal: objetivo é ficar ABAIXO do target (budget, CPA máximo)
  const onTrack = ceilingGoal ? pct <= 100 : higherIsBetter ? pct >= 100 : pct <= 100;
  const barColor = onTrack ? 'bg-success' : 'bg-danger';
  const status = ceilingGoal
    ? pct > 100
      ? `Excedeu em ${(pct - 100).toFixed(0)}%`
      : `${pct.toFixed(0)}% do teto`
    : `${pct.toFixed(0)}% da meta`;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium text-ink">{label}</span>
        <span className="tabular-nums text-ink-muted">
          <span className="font-semibold text-ink">{format(current)}</span>
          {' / '}
          {format(target)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${display}%` }}
          aria-label={`${label}: ${status}`}
        />
      </div>
      <p className={cn('mt-0.5 text-[10px]', onTrack ? 'text-success' : 'text-danger')}>{status}</p>
    </div>
  );
}

function EditGoals({
  goals,
  onSave,
  onCancel,
}: {
  goals: { monthlyConversions: number; maxCpa: number; monthlyBudget: number };
  onSave: (g: { monthlyConversions: number; maxCpa: number; monthlyBudget: number }) => void;
  onCancel: () => void;
}) {
  const [conv, setConv] = useState(String(goals.monthlyConversions || ''));
  const [cpa, setCpa] = useState(String(goals.maxCpa || ''));
  const [budget, setBudget] = useState(String(goals.monthlyBudget || ''));

  return (
    <Card padding="md">
      <CardHeader title="Definir metas" description="Deixe em branco pra desativar uma meta" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GoalInput label="Conversões/mês" value={conv} onChange={setConv} placeholder="200" prefix="" />
        <GoalInput label="CPA máximo" value={cpa} onChange={setCpa} placeholder="50" prefix="R$" />
        <GoalInput label="Teto de investimento/mês" value={budget} onChange={setBudget} placeholder="10000" prefix="R$" />
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() =>
            onSave({
              monthlyConversions: Number(conv) || 0,
              maxCpa: Number(cpa) || 0,
              monthlyBudget: Number(budget) || 0,
            })
          }
        >
          Salvar metas
        </Button>
      </div>
    </Card>
  );
}

function GoalInput({
  label,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{label}</span>
      <div className="mt-1 flex items-center rounded border border-line bg-surface-muted focus-within:ring-2 focus-within:ring-accent/40">
        {prefix && <span className="pl-2 text-xs text-ink-subtle">{prefix}</span>}
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={0}
          className="w-full bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
        />
      </div>
    </label>
  );
}
