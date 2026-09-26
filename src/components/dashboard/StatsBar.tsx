'use client';

import { gbp } from '@/lib/dashboard/format';

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'critical' }) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-surface px-5 py-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className={`mt-1 font-mono text-xl tabular-nums ${
          tone === 'ok' ? 'text-ok' : tone === 'critical' ? 'text-critical' : 'text-ink'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function StatsBar({
  activeCount,
  recoveredPerDayGbp,
  shopperEventCount,
}: {
  activeCount: number;
  recoveredPerDayGbp: number;
  shopperEventCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Stat
        label="Needs attention"
        value={String(activeCount)}
        tone={activeCount > 0 ? 'critical' : undefined}
      />
      <Stat label="Recovered" value={`${gbp(recoveredPerDayGbp)}/day`} tone="ok" />
      <Stat label="Shopper decisions" value={shopperEventCount.toLocaleString()} />
    </div>
  );
}
