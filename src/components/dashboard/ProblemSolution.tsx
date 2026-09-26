const STATS: { value: string; label: string }[] = [
  { value: '66%', label: 'of shoppers have abandoned a purchase because product info was missing or inaccurate' },
  { value: '45%', label: 'leave over missing or low-quality product images' },
  { value: '42%', label: 'leave over incomplete or poorly written descriptions' },
  { value: '51%', label: 'of returns trace back to unclear sizing or photos that didn’t match the product' },
];

export function ProblemSolution() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-ink-faint">
          Why this exists
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-base font-semibold text-ink">The problem</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              Shoppers don&apos;t complain when a product page is missing its size guide, materials, returns policy,
              or a real photo &mdash; or when the price is out of line with the market. They just leave. Every one
              of those silent exits is revenue a store never sees and rarely investigates.
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">What Autopilot does</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              20 AI shopper personas test every product page and flag where they&apos;d bail. Grok diagnoses the
              exact cause in one sentence, a fix is written and applied &mdash; automatically, or sent for approval
              on WhatsApp &mdash; and the shoppers re-run on the result to confirm it worked, or roll it back.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card-muted p-4 text-center">
              <div className="text-2xl font-bold tabular-nums text-critical">{stat.value}</div>
              <div className="mt-1 text-xs leading-snug text-ink-dim">{stat.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-ink-faint">
          Source: Syndigo, &ldquo;How Incomplete Product Data Hurts Sales and Increases Returns&rdquo;, 2026 &mdash;
          returns alone cost the industry $369B last year.
        </p>
      </div>
    </div>
  );
}
