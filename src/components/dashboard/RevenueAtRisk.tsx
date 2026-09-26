'use client';

import { useEffect, useState } from 'react';

/** The number the room watches. Counts down to £0 when incidents are verified. */
export function RevenueAtRisk({ amount }: { amount: number }) {
  const [shown, setShown] = useState(amount);

  // Animate towards the new value so a drop to £0 is visible from the back.
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
      <div className="text-sm uppercase tracking-[0.2em] text-white/40">Revenue at risk</div>
      <div
        className={`mt-2 font-mono text-7xl font-semibold tabular-nums transition-colors ${
          clear ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        £{Math.max(0, Math.round(shown)).toLocaleString()}
        <span className="ml-2 align-middle text-2xl text-white/30">/day</span>
      </div>
      <div className="mt-2 text-sm text-white/40">
        {clear ? 'All known leaks closed.' : 'Estimated from missing carts × order value.'}
      </div>
    </div>
  );
}
