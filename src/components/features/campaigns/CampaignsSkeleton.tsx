import { cn } from '@/lib/cn';

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-subtle', className)} />;
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-lg border border-line bg-surface p-4">
          <Pulse className="h-3 w-20" />
          <Pulse className="mt-3 h-6 w-24" />
          <Pulse className="mt-2 h-2.5 w-32" />
        </div>
      ))}
    </div>
  );
}

export function SingleChartSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <Pulse className="h-4 w-32" />
      <Pulse className="mt-1.5 h-3 w-48" />
      <div className="mt-5 flex h-[220px] items-end gap-2">
        {[...Array(6)].map((_, bi) => (
          <Pulse key={bi} className={`flex-1 h-[${50 + bi * 25}%]`} />
        ))}
      </div>
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-lg border border-line bg-surface p-5">
          <Pulse className="h-4 w-32" />
          <Pulse className="mt-1.5 h-3 w-48" />
          <div className="mt-5 flex h-[220px] items-end gap-2">
            {[...Array(6)].map((_, bi) => (
              <Pulse key={bi} className={`flex-1 h-[${50 + bi * 25}%]`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-4 py-2.5">
        <Pulse className="h-4 w-48" />
      </div>
      <div className="border-b border-line bg-surface-subtle px-4 py-2.5">
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Pulse key={i} className="h-3" />
          ))}
        </div>
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4 border-b border-line-subtle px-4 py-3">
          {[...Array(6)].map((_, c) => (
            <Pulse key={c} className="h-3" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ConnectionStatusSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-lg border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <Pulse className="h-9 w-9 rounded-md" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-2.5 w-40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CampaignsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-7 w-48" />
          <Pulse className="h-3 w-72" />
        </div>
        <Pulse className="h-9 w-28" />
      </div>
      <KpiCardsSkeleton />
      <ChartsSkeleton />
      <TableSkeleton />
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Pulse className="h-7 w-48" />
        <Pulse className="h-3 w-80" />
      </div>
      {/* Insights feed */}
      <div className="grid gap-3 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg border-l-4 border-line bg-surface p-4">
            <Pulse className="h-2.5 w-16" />
            <Pulse className="mt-2 h-3.5 w-48" />
            <Pulse className="mt-1.5 h-3 w-full" />
          </div>
        ))}
      </div>
      <KpiCardsSkeleton />
      <ChartsSkeleton />
    </div>
  );
}
