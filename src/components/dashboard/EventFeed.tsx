'use client';

import type { EventRow } from '@/lib/dashboard/rows';

const DOT: Record<string, string> = {
  add_to_cart: 'bg-emerald-400',
  view: 'bg-amber-400',
  leave: 'bg-red-400',
};

/** Live stream of shopper decisions. This is what makes the room believe it is real. */
export function EventFeed({ events }: { events: EventRow[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <h2 className="text-sm uppercase tracking-[0.2em] text-white/40">Shoppers</h2>
      </div>

      <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        {events.length === 0 && (
          <li className="py-8 text-center text-sm text-white/30">Waiting for shoppers…</li>
        )}
        {events.map((e) => (
          <li key={e.id} className="flex gap-3 rounded-lg px-2 py-2 text-sm hover:bg-white/[0.03]">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.type] ?? 'bg-white/30'}`} />
            <div className="min-w-0">
              <div className="text-white/80">{e.persona}</div>
              {e.reason && <div className="truncate text-white/45">{e.reason}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
