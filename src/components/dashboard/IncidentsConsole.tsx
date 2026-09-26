'use client';

import { useMemo } from 'react';
import { useConsoleData } from '@/lib/dashboard/useConsoleData';
import { toSnapshot } from '@/lib/agents/snapshot';
import { StoreHealth } from './StoreHealth';
import { DetectorsPanel } from './DetectorsPanel';
import { ActivityTable } from './ActivityTable';
import { EventFeed } from './EventFeed';

function Skeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-3">
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-card lg:col-span-6" />
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-card lg:col-span-3" />
    </div>
  );
}

export function IncidentsConsole({
  grokLive,
  wassistLive,
  tavilyLive,
}: {
  grokLive: boolean;
  wassistLive: boolean;
  tavilyLive: boolean;
}) {
  const { incidents, products, events, loading, fixFor, thumbFor, decide } = useConsoleData();

  const storeHealth = useMemo(() => {
    if (products.length === 0) return { healthy: 0, total: 0 };
    const healthy = products.filter((row) => {
      const s = toSnapshot(row);
      return s.size_info && s.materials && s.returns_policy && s.image_urls.length > 0;
    }).length;
    return { healthy, total: products.length };
  }, [products]);

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Incidents</h1>
      <p className="mt-1 text-sm text-ink-dim">Every leak Autopilot has found, fixed, or is still working on.</p>

      {loading ? (
        <Skeleton />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-3">
            <StoreHealth healthy={storeHealth.healthy} total={storeHealth.total} />
            <DetectorsPanel grokLive={grokLive} wassistLive={wassistLive} tavilyLive={tavilyLive} />
          </div>

          <div className="lg:col-span-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-faint">
              Incidents {incidents.length > 0 && `(${incidents.length})`}
            </h2>
            <ActivityTable
              incidents={incidents}
              fixFor={fixFor}
              thumbFor={thumbFor}
              onApprove={(id) => decide(id, 'approve')}
              onReject={(id) => decide(id, 'reject')}
            />
          </div>

          <div className="lg:col-span-3">
            <EventFeed events={events} />
          </div>
        </div>
      )}
    </section>
  );
}
