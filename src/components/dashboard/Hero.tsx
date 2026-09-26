'use client';

import { useEffect, useState } from 'react';

export function Hero({
  amount,
  onRunLoop,
  running,
  lastRunNote,
}: {
  amount: number;
  onRunLoop: () => void;
  running: boolean;
  lastRunNote: string | null;
}) {
  const [shown, setShown] = useState(amount);

  useEffect(() => {
    const start = shown;
    const delta = amount - start;
    if (delta === 0) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 700);
      setShown(start + delta * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const clear = amount <= 0;

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-border bg-card p-7">
      <div>
        <div className="text-sm font-medium uppercase tracking-wider text-ink-faint">Revenue at risk</div>
        <div
          className={`mt-2 text-5xl font-extrabold tabular-nums tracking-tight transition-colors ${
            clear ? 'text-ok' : 'text-critical'
          }`}
        >
          £{Math.max(0, Math.round(shown)).toLocaleString()}
          <span className="ml-1 align-middle text-lg font-semibold text-ink-faint">/day</span>
        </div>
        <div className="mt-2 text-sm text-ink-dim">
          {clear ? 'All known leaks closed.' : 'Estimated from missing carts × order value.'}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRunLoop}
            disabled={running}
            className="flex items-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-semibold text-dark-ink transition hover:brightness-125 disabled:opacity-50"
          >
            {running ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 3 20 12 6 21" />
              </svg>
            )}
            {running ? 'Running shoppers…' : 'Run shoppers now'}
          </button>
          <a
            href="#incidents"
            className="rounded-xl border border-border-strong px-5 py-3 text-sm font-semibold text-ink-dim transition hover:bg-card-muted"
          >
            View incidents
          </a>
        </div>
        {lastRunNote && <p className="mt-3 text-xs text-ink-faint">{lastRunNote}</p>}
      </div>
    </div>
  );
}
