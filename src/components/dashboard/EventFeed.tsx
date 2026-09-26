'use client';

import type { EventRow } from '@/lib/dashboard/rows';
import { relativeTime } from '@/lib/dashboard/format';

const DOT: Record<string, string> = {
  add_to_cart: 'bg-ok',
  view: 'bg-warn',
  leave: 'bg-critical',
};

const ACTION_LABEL: Record<string, string> = {
  add_to_cart: 'added to cart',
  view: 'is browsing',
  leave: 'left',
};

/** Live stream of shopper decisions. This is what makes the room believe it is real. */
export function EventFeed({ events }: { events: EventRow[] }) {
  const carts = events.filter((e) => e.type === 'add_to_cart').length;
  const rate = events.length > 0 ? Math.round((carts / events.length) * 100) : null;

  return (
    <div className="flex max-h-[36rem] flex-col rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
          </span>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">Shoppers</h2>
        </div>
        {rate != null && (
          <span className="font-mono text-xs tabular-nums text-ink-faint">{rate}% converting</span>
        )}
      </div>

      <ul className="thin-scroll min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {events.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-faint">Waiting for shoppers…</li>
        )}
        {events.map((e) => (
          <li key={e.id} className="flex gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface-2">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.type] ?? 'bg-ink-faint'}`} />
            <div className="min-w-0 flex-1">
              <div className="text-ink-dim">
                <span className="text-ink">{e.persona}</span> {ACTION_LABEL[e.type] ?? e.type}
              </div>
              {e.reason && <div className="truncate text-ink-faint">{e.reason}</div>}
            </div>
            <span className="shrink-0 font-mono text-[11px] text-ink-faint">{relativeTime(e.created_at)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
