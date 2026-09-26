'use client';

function Icon({ path }: { path: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {path}
    </svg>
  );
}

function Tile({
  label,
  value,
  trend,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-2xl p-5 ${
        highlight ? 'bg-accent text-accent-ink' : 'border border-border bg-card text-ink'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${highlight ? 'text-accent-ink/80' : 'text-ink-faint'}`}>{label}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            highlight ? 'bg-white/20' : 'bg-card-muted text-ink-dim'
          }`}
        >
          {icon}
        </span>
      </div>
      <div>
        <div className="mt-3 text-2xl font-bold tabular-nums">{value}</div>
        {trend && (
          <div className={`mt-1 text-xs font-medium ${highlight ? 'text-accent-ink/70' : 'text-ink-faint'}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatsGrid({
  activeCount,
  recoveredPerDayGbp,
  shopperEventCount,
  storeHealthPct,
}: {
  activeCount: number;
  recoveredPerDayGbp: number;
  shopperEventCount: number;
  storeHealthPct: number;
}) {
  return (
    <div className="grid h-full grid-cols-2 gap-4">
      <Tile
        label="Needs attention"
        value={String(activeCount)}
        trend={activeCount === 0 ? 'All clear' : 'Open now'}
        icon={<Icon path={<path d="M12 9v4m0 4h.01M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />} />}
      />
      <Tile
        label="Recovered"
        value={`£${Math.round(recoveredPerDayGbp).toLocaleString()}`}
        trend="per day, verified"
        highlight
        icon={<Icon path={<path d="m5 13 4 4L19 7" />} />}
      />
      <Tile
        label="Shopper decisions"
        value={shopperEventCount.toLocaleString()}
        trend="recent runs"
        icon={<Icon path={<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5M14.5 15.3c2.6.3 4.5 2 4.5 4.7" /></>} />}
      />
      <Tile
        label="Store health"
        value={`${Math.round(storeHealthPct * 100)}%`}
        trend="listings complete"
        icon={<Icon path={<path d="M3 12a9 9 0 1 0 9-9M3 12h6l2-4 3 8 2-4h4" />} />}
      />
    </div>
  );
}
