'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/dashboard/supabase';
import { revenueAtRisk, type EventRow, type FixRow, type IncidentRow } from '@/lib/dashboard/rows';
import { toSnapshot, type ProductRow } from '@/lib/agents/snapshot';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Hero } from './Hero';
import { StatsGrid } from './StatsGrid';
import { LossChart } from './LossChart';
import { StoreHealth } from './StoreHealth';
import { DetectorsPanel } from './DetectorsPanel';
import { ActivityTable } from './ActivityTable';
import { EventFeed } from './EventFeed';

const MAX_EVENTS = 60;

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function ConsoleSkeleton() {
  return (
    <div className="flex flex-1 gap-3">
      <div className="h-[80vh] w-16 shrink-0 animate-pulse rounded-2xl border border-border bg-shell-bg" />
      <div className="flex-1 space-y-4">
        <div className="h-14 animate-pulse rounded-2xl border border-border bg-shell-bg" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-shell-bg" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-shell-bg" />
      </div>
    </div>
  );
}

export function IncidentConsole({
  live,
  funnelUrl,
  grokLive,
  wassistLive,
  tavilyLive,
  shopifyAdminUrl,
}: {
  live: boolean;
  funnelUrl?: string;
  grokLive: boolean;
  wassistLive: boolean;
  tavilyLive: boolean;
  shopifyAdminUrl?: string;
}) {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [fixes, setFixes] = useState<FixRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRunNote, setLastRunNote] = useState<string | null>(null);

  const connected = useMemo(() => getSupabase() !== null, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let alive = true;

    (async () => {
      const [i, f, e, p] = await Promise.all([
        supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('fixes').select('*').order('id', { ascending: false }).limit(40),
        supabase.from('events').select('*').order('created_at', { ascending: false }).limit(MAX_EVENTS),
        supabase.from('products').select('id, shopify_id, title, price, cost, inventory, snapshot_json'),
      ]);
      if (!alive) return;
      setIncidents((i.data as IncidentRow[]) ?? []);
      setFixes((f.data as FixRow[]) ?? []);
      setEvents((e.data as EventRow[]) ?? []);

      const productRows = (p.data as ProductRow[]) ?? [];
      setProducts(productRows);

      const thumbMap: Record<string, string> = {};
      for (const row of productRows) {
        const src = (row.snapshot_json as { images?: { src?: string }[] })?.images?.[0]?.src;
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (p) =>
        setProducts((rows) => upsert(rows, p.new as ProductRow)),
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const fixFor = useCallback((incidentId: string) => fixes.find((f) => f.incident_id === incidentId), [fixes]);
  const thumbFor = useCallback((productId: string) => thumbs[productId], [thumbs]);

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

  const runLoop = useCallback(async () => {
    setRunning(true);
    setLastRunNote(null);
    try {
      const res = await fetch('/api/run-loop', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setLastRunNote(`Run failed: ${body?.error ?? res.status}`);
        return;
      }
      const opened = (body.summaries ?? []).filter((s: { incidentOpened: boolean }) => s.incidentOpened).length;
      const n = (body.summaries ?? []).length;
      setLastRunNote(
        opened > 0
          ? `Ran ${n} products — ${opened} incident${opened === 1 ? '' : 's'} opened.`
          : `Ran ${n} products — store stayed healthy.`,
      );
    } catch {
      setLastRunNote('Run failed: could not reach the server.');
    } finally {
      setRunning(false);
    }
  }, []);

  const atRisk = useMemo(() => revenueAtRisk(incidents), [incidents]);
  const recovered = useMemo(
    () => incidents.filter((i) => i.status === 'verified').reduce((sum, i) => sum + (i.loss_per_day_gbp ?? 0), 0),
    [incidents],
  );
  const storeHealth = useMemo(() => {
    if (products.length === 0) return { healthy: 0, total: 0, pct: 1 };
    const healthy = products.filter((row) => {
      const s = toSnapshot(row);
      return s.size_info && s.materials && s.returns_policy && s.image_urls.length > 0;
    }).length;
    return { healthy, total: products.length, pct: healthy / products.length };
  }, [products]);

  if (loading) return <ConsoleSkeleton />;

  return (
    <>
      <Sidebar onRunLoop={runLoop} running={running} shopifyAdminUrl={shopifyAdminUrl} />

      <div className="min-w-0 flex-1 rounded-2xl border border-border bg-shell-bg p-4 sm:p-6">
        <TopBar live={live} funnelUrl={funnelUrl} />

        {!connected && (
          <p className="mb-6 rounded-xl border border-warn-ring bg-warn-bg px-4 py-3 text-sm text-warn">
            Supabase env vars are not set, so this console is not live.
          </p>
        )}

        <section id="overview" className="scroll-mt-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{greeting()}</h1>
          <p className="mt-1 text-sm text-ink-dim">
            Watching {products.length} product{products.length === 1 ? '' : 's'} across your store.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Hero amount={atRisk} onRunLoop={runLoop} running={running} lastRunNote={lastRunNote} />
            <StatsGrid
              activeCount={incidents.filter((i) => i.status === 'open' || i.status === 'fixing').length}
              recoveredPerDayGbp={recovered}
              shopperEventCount={events.length}
              storeHealthPct={storeHealth.pct}
            />
            <LossChart incidents={incidents} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-3">
              <StoreHealth healthy={storeHealth.healthy} total={storeHealth.total} />
              <DetectorsPanel grokLive={grokLive} wassistLive={wassistLive} tavilyLive={tavilyLive} />
            </div>

            <div id="incidents" className="scroll-mt-6 lg:col-span-6">
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

            <div id="shoppers" className="scroll-mt-6 lg:col-span-3">
              <EventFeed events={events} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
