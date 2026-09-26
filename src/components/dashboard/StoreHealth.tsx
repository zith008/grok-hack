'use client';

export function StoreHealth({ healthy, total }: { healthy: number; total: number }) {
  const pct = total > 0 ? (healthy / total) * 100 : 100;
  const complete = healthy === total && total > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-ink">Store health</h3>
        <span className="text-xs text-ink-faint">{healthy} of {total} listings complete</span>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-card-muted">
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-ok' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        {complete
          ? 'Every product has size, materials, returns and a lead image.'
          : `${total - healthy} product${total - healthy === 1 ? '' : 's'} missing size, materials, returns or a lead image.`}
      </p>
    </div>
  );
}
