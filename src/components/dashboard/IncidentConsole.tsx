'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/dashboard/supabase';
import { revenueAtRisk, type EventRow, type FixRow, type IncidentRow } from '@/lib/dashboard/rows';
import { RevenueAtRisk } from './RevenueAtRisk';
import { IncidentCard } from './IncidentCard';
import { EventFeed } from './EventFeed';
import { StatsBar } from './StatsBar';

const MAX_EVENTS = 60;

interface ProductThumb {
  id: string;
  snapshot_json: { images?: { src?: string }[] } | null;
}

function ConsoleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[70px] flex-1 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-surface" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    </div>
  );
}

export function IncidentConsole() {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [fixes, setFixes] = useState<FixRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // NEXT_PUBLIC vars are inlined at build, so this is stable across render and hydration.
  const connected = useMemo(() => getSupabase() !== null, []);

  // Initial load, then keep everything in sync over realtime.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let live = true;

    (async () => {
      const [i, f, e, p] = await Promise.all([
        supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('fixes').select('*').order('id', { ascending: false }).limit(40),
        supabase.from('events').select('*').order('created_at', { ascending: false }).limit(MAX_EVENTS),
        supabase.from('products').select('id, snapshot_json'),
      ]);
      if (!live) return;
      setIncidents((i.data as IncidentRow[]) ?? []);
      setFixes((f.data as FixRow[]) ?? []);
      setEvents((e.data as EventRow[]) ?? []);

      const thumbMap: Record<string, string> = {};
      for (const row of (p.data as ProductThumb[]) ?? []) {
        const src = row.snapshot_json?.images?.[0]?.src;
        if (src) thumbMap[row.id] = src;
      }
      setThumbs(thumbMap);
      setLoading(false);
    })();

    const upsert = <T extends { id: string }>(rows: T[], row: T) => {
      const next = rows.filter((r) => r.id !== row.id);
      return [row, ...next];
    };

    const channel = supabase
      .channel('autopilot')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (p) =>
        setIncidents((rows) => upsert(rows, p.new as IncidentRow)),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixes' }, (p) =>
        setFixes((rows) => upsert(rows, p.new as FixRow)),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (p) =>
        setEvents((rows) => [p.new as EventRow, ...rows].slice(0, MAX_EVENTS)),
      )
      .subscribe();

    return () => {
      live = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const fixFor = useCallback(
    (incidentId: string) => fixes.find((f) => f.incident_id === incidentId),
    [fixes],
  );

  const decide = useCallback(async (incidentId: string, decision: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/incidents/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ incident_id: incidentId, decision, approved_by: 'dashboard' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: body?.error ?? `Server said ${res.status}` };
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not reach the server' };
    }
  }, []);

  const atRisk = useMemo(() => revenueAtRisk(incidents), [incidents]);
  const recovered = useMemo(
    () =>
      incidents
        .filter((i) => i.status === 'verified')
        .reduce((sum, i) => sum + (i.loss_per_day_gbp ?? 0), 0),
    [incidents],
  );

  const active = useMemo(
    () => incidents.filter((i) => i.status === 'open' || i.status === 'fixing'),
    [incidents],
  );
  const resolved = useMemo(
    () => incidents.filter((i) => i.status === 'verified' || i.status === 'rolled_back'),
    [incidents],
  );

  if (loading) return <ConsoleSkeleton />;

  return (
    <div className="space-y-6">
      {!connected && (
        <p className="rounded-xl border border-warn-ring bg-warn-bg px-4 py-3 text-sm text-warn">
          Supabase env vars are not set, so this console is not live.
        </p>
      )}

      <RevenueAtRisk amount={atRisk} />

      <StatsBar
        activeCount={active.length}
        recoveredPerDayGbp={recovered}
        shopperEventCount={events.length}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
              Needs attention {active.length > 0 && `(${active.length})`}
            </h2>
            {active.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-ok">
                <span className="text-lg" aria-hidden="true">✓</span>
                <span className="text-sm text-ink-dim">Nothing open. The store is healthy.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {active.map((i) => (
                  <IncidentCard
                    key={i.id}
                    incident={i}
                    fix={fixFor(i.id)}
                    thumbnail={thumbs[i.product_id]}
                    onApprove={(id) => decide(id, 'approve')}
                    onReject={(id) => decide(id, 'reject')}
                  />
                ))}
              </div>
            )}
          </section>

          {resolved.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
                Resolved ({resolved.length})
              </h2>
              <div className="space-y-4">
                {resolved.map((i) => (
                  <IncidentCard
                    key={i.id}
                    incident={i}
                    fix={fixFor(i.id)}
                    thumbnail={thumbs[i.product_id]}
                    onApprove={(id) => decide(id, 'approve')}
                    onReject={(id) => decide(id, 'reject')}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <EventFeed events={events} />
      </div>
    </div>
  );
}
