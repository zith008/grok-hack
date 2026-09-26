'use client';

// body_html is carried in before_json only so a rollback can restore the
// exact original — it duplicates whatever the parsed fields below already
// show, so it's never rendered.
const EXCLUDE_KEYS = new Set(['body_html']);

const FIELD_LABEL: Record<string, string> = {
  size_info: 'size guide',
  materials: 'materials',
  returns_policy: 'returns',
  description: 'description',
  title: 'title',
  price: 'price',
  supplier_message: 'supplier message',
};

/** Shows exactly what the agent changed. Judges want to see the craft, not just the delta. */
export function BeforeAfterDiff({
  before,
  after,
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].filter(
    (k) => !EXCLUDE_KEYS.has(k) && String(before?.[k] ?? '') !== String(after?.[k] ?? ''),
  );

  if (keys.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {keys.map((k) => (
        <div key={k} className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-critical-ring/50 bg-critical-bg p-3">
            <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-critical/80">
              {FIELD_LABEL[k] ?? k} · before
            </div>
            <div className="whitespace-pre-wrap text-sm text-ink-dim">
              {String(before?.[k] ?? '') || 'Not shown'}
            </div>
          </div>
          <div className="rounded-lg border border-ok-ring/50 bg-ok-bg p-3">
            <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ok/80">
              {FIELD_LABEL[k] ?? k} · after
            </div>
            <div className="whitespace-pre-wrap text-sm text-ink">
              {String(after?.[k] ?? '') || 'Not shown'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
