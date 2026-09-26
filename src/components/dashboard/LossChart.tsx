'use client';

import type { IncidentRow } from '@/lib/dashboard/rows';

const STATUS_COLOR: Record<IncidentRow['status'], string> = {
  open: 'var(--critical)',
  fixing: 'var(--warn)',
  verified: 'var(--ok)',
  rolled_back: 'var(--neutral-status)',
};

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Bar per incident, most recent first, drawn to a real £ scale. */
export function LossChart({ incidents }: { incidents: IncidentRow[] }) {
  const bars = incidents.slice(0, 7).reverse();
  const max = Math.max(1, ...bars.map((b) => b.loss_per_day_gbp));
  const niceMax = Math.ceil(max / 100) * 100 || 100;

  const W = 460;
  const H = 200;
  const padL = 40;
  const padB = 28;
  const padT = 10;
  const chartW = W - padL - 12;
  const chartH = H - padB - padT;
  const barGap = 14;
  const barW = bars.length > 0 ? (chartW - barGap * (bars.length - 1)) / bars.length : 0;
  const ticks = [0, 0.5, 1].map((f) => Math.round(niceMax * f));

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
      <div className="mb-1 text-sm font-semibold text-ink">Loss vs. recovered</div>
      <div className="mb-4 text-xs text-ink-faint">£/day estimated per incident, most recent first</div>

      {bars.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
          No incidents yet — run the shoppers to populate this.
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1" role="img" aria-label="Loss per day by incident">
          {ticks.map((t) => {
            const y = padT + chartH - (t / niceMax) * chartH;
            return (
              <g key={t}>
                <line x1={padL} x2={W - 8} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
                <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--ink-faint)">
                  £{t}
                </text>
              </g>
            );
          })}

          {bars.map((b, i) => {
            const h = (b.loss_per_day_gbp / niceMax) * chartH;
            const x = padL + i * (barW + barGap);
            const y = padT + chartH - h;
            return (
              <g key={b.id}>
                <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx={5} fill={STATUS_COLOR[b.status]} />
                <text
                  x={x + barW / 2}
                  y={H - padB + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--ink-faint)"
                >
                  {truncate(b.product_title, 10)}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-critical" />Open</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ok" />Verified</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-neutral-status" />Rolled back</span>
      </div>
    </div>
  );
}
