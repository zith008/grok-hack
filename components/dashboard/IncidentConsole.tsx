'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/dashboard/supabase';
import { revenueAtRisk, type EventRow, type FixRow, type IncidentRow } from '@/lib/dashboard/rows';
import { RevenueAtRisk } from './RevenueAtRisk';
import { IncidentCard } from './IncidentCard';
import { EventFeed } from './EventFeed';

const MAX_EVENTS = 60;

export function IncidentConsole() {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [fixes, setFixes] = useState<FixRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  // Initial load, then keep everything in sync over realtime.
  useEffect(() => {
    let live = true;

    (async () => {
      const [i, f, e] = await Promise.all([
        supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('fixes').select('*').order('id', { ascending: false }).limit(40),
        supabase.from('events').select('*').order('created_at', { ascending: false }).limit(MAX_EVENTS),
      ]);
      if (!live) return;
      setIncidents((i.data as IncidentRow[]) ?? []);
      setFixes((f.data as FixRow[]) ?? []);
      setEvents((e.data as EventRow[]) ?? []);
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
    await fetch('/api/incidents/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ incident_id: incidentId, decision, approved_by: 'dashboard' }),
    });
  }, []);

  const atRisk = useMemo(() => revenueAtRisk(incidents), [incidents]);

  return (
    <div className="space-y-6">
      <RevenueAtRisk amount={atRisk} />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {incidents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/35">
              No incidents. The store is healthy.
            </div>
          ) : (
            incidents.map((i) => (
              <IncidentCard
                key={i.id}
                incident={i}
                fix={fixFor(i.id)}
                onApprove={(id) => decide(id, 'approve')}
                onReject={(id) => decide(id, 'reject')}
              />
            ))
          )}
        </div>

        <EventFeed events={events} />
      </div>
    </div>
  );
}
