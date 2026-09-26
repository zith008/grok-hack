'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from './supabase';
import { type EventRow, type FixRow, type IncidentRow } from './rows';
import type { ProductRow } from '@/lib/agents/snapshot';

const MAX_EVENTS = 60;

/** Shared realtime data + actions for both the Overview and Incidents pages. */
export function useConsoleData() {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [fixes, setFixes] = useState<FixRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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

  return { incidents, fixes, events, products, loading, connected, fixFor, thumbFor, decide };
}
