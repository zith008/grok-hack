'use client';

import { useMemo } from 'react';
import { useConsoleData } from '@/lib/dashboard/useConsoleData';
import { revenueAtRisk } from '@/lib/dashboard/rows';
import { toSnapshot } from '@/lib/agents/snapshot';
import { HowItWorks } from './HowItWorks';
import { Hero } from './Hero';
import { StatsGrid } from './StatsGrid';
import { LossChart } from './LossChart';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Skeleton() {
  return (
    <div className="mt-6 space-y-4">
      <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}

export function OverviewConsole() {
  const { incidents, products, events, loading, connected } = useConsoleData();

  const atRisk = useMemo(() => revenueAtRisk(incidents), [incidents]);
  const recovered = useMemo(
    () => incidents.filter((i) => i.status === 'verified').reduce((sum, i) => sum + (i.loss_per_day_gbp ?? 0), 0),
    [incidents],
  );
  const storeHealth = useMemo(() => {
    if (products.length === 0) return 1;
    const healthy = products.filter((row) => {
      const s = toSnapshot(row);
      return s.size_info && s.materials && s.returns_policy && s.image_urls.length > 0;
    }).length;
    return healthy / products.length;
  }, [products]);

  return (
    <section>
      {!connected && (
        <p className="mb-6 rounded-xl border border-warn-ring bg-warn-bg px-4 py-3 text-sm text-warn">
          Supabase env vars are not set, so this console is not live.
        </p>
      )}

      <h1 className="text-3xl font-extrabold tracking-tight text-ink">{greeting()}</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-dim">
        Autopilot watches {products.length} product{products.length === 1 ? '' : 's'} on your Shopify store, finds
        where you&apos;re quietly losing revenue, fixes it, and proves the fix worked — or rolls it back.
      </p>

      <div className="mt-5">
        <HowItWorks />
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Hero amount={atRisk} />
          <StatsGrid
            activeCount={incidents.filter((i) => i.status === 'open' || i.status === 'fixing').length}
            recoveredPerDayGbp={recovered}
            shopperEventCount={events.length}
            storeHealthPct={storeHealth}
          />
          <LossChart incidents={incidents} />
        </div>
      )}
    </section>
  );
}
