export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg border border-line bg-surface-subtle"
        />
      ))}
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-80 animate-pulse rounded-lg border border-line bg-surface-subtle" />
      <div className="h-80 animate-pulse rounded-lg border border-line bg-surface-subtle" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-10 animate-pulse rounded-lg border border-line bg-surface-subtle" />
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-lg border border-line bg-surface"
        />
      ))}
    </div>
  );
}

export function ConnectionStatusSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-lg border border-line bg-surface-subtle"
        />
      ))}
    </div>
  );
}

export function CampaignsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-subtle" />
        <div className="h-10 w-32 animate-pulse rounded bg-surface-subtle" />
      </div>
      <KpiCardsSkeleton />
      <ChartsSkeleton />
      <TableSkeleton />
    </div>
  );
}
