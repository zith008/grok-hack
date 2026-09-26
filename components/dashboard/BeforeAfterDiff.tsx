'use client';

/** Shows exactly what the agent changed. Judges want to see the craft, not just the delta. */
export function BeforeAfterDiff({
  before,
  after,
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].filter(
    (k) => String(before?.[k] ?? '') !== String(after?.[k] ?? ''),
  );

  if (keys.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {keys.map((k) => (
        <div key={k} className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-red-300/70">
              {k} · before
            </div>
            <div className="whitespace-pre-wrap text-sm text-white/70">
              {String(before?.[k] ?? '—') || '—'}
            </div>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-emerald-300/70">
              {k} · after
            </div>
            <div className="whitespace-pre-wrap text-sm text-white/90">
              {String(after?.[k] ?? '—') || '—'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
