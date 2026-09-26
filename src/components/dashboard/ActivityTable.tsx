'use client';

import { Fragment, useState } from 'react';
import { BeforeAfterDiff } from './BeforeAfterDiff';
import { STATUS_STYLE, type FixRow, type IncidentRow } from '@/lib/dashboard/rows';
import { detectorLabel, gbp, relativeTime } from '@/lib/dashboard/format';

function pct(v: number | null) {
  return v == null ? '—' : `${Math.round(v * 100)}%`;
}

export function ActivityTable({
  incidents,
  fixFor,
  thumbFor,
  onApprove,
  onReject,
}: {
  incidents: IncidentRow[];
  fixFor: (incidentId: string) => FixRow | undefined;
  thumbFor: (productId: string) => string | undefined;
  onApprove: (incidentId: string) => Promise<{ ok: boolean; error?: string }>;
  onReject: (incidentId: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (
    incidentId: string,
    kind: 'approve' | 'reject',
    fn: (id: string) => Promise<{ ok: boolean; error?: string }>,
  ) => {
    setBusy(kind);
    setError(null);
    const result = await fn(incidentId);
    setBusy(null);
    if (!result.ok) setError(result.error ?? 'Something went wrong — try again.');
  };

  if (incidents.length === 0) {
    return (
      <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-center">
        <span className="text-2xl text-ok">✓</span>
        <p className="text-sm text-ink-dim">No incidents yet. The store is healthy.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-ink-faint">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Detector</th>
              <th className="px-3 py-3 font-medium">Loss/day</th>
              <th className="px-3 py-3 font-medium">Add to cart</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">When</th>
              <th className="w-8 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {incidents.map((i) => {
              const style = STATUS_STYLE[i.status];
              const fix = fixFor(i.id);
              const thumb = thumbFor(i.product_id);
              const open = openId === i.id;
              const awaiting = i.status === 'fixing' && fix && !fix.applied_at && fix.autonomy !== 'automatic';

              return (
                <Fragment key={i.id}>
                  <tr
                    onClick={() => setOpenId(open ? null : i.id)}
                    className="cursor-pointer border-b border-border transition hover:bg-card-muted last:border-0"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-9 w-9 rounded-lg border border-border object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-lg border border-border bg-card-muted" />
                        )}
                        <span className="font-medium text-ink">{i.product_title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink-dim">{detectorLabel(i.detector)}</td>
                    <td className="px-3 py-3 font-semibold tabular-nums text-ink">{gbp(i.loss_per_day_gbp)}</td>
                    <td className="px-3 py-3 tabular-nums">
                      <span className="text-critical">{pct(i.conversion_before)}</span>
                      <span className="mx-1.5 text-ink-faint">→</span>
                      <span className={i.conversion_after != null ? 'text-ok' : 'text-ink-faint'}>
                        {pct(i.conversion_after)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${style.cls}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-ink-faint">{relativeTime(i.created_at)}</td>
                    <td className="px-3 py-3 text-ink-faint">
                      <span className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-b border-border bg-card-muted/50 last:border-0">
                      <td colSpan={7} className="px-5 py-5">
                        {i.diagnosis && (
                          <p className="border-l-2 border-border-strong pl-3 text-sm leading-relaxed text-ink-dim">
                            {i.diagnosis}
                          </p>
                        )}
                        {fix && <BeforeAfterDiff before={fix.before_json} after={fix.after_json} />}

                        {awaiting && (
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              disabled={busy !== null}
                              onClick={(e) => { e.stopPropagation(); act(i.id, 'approve', onApprove); }}
                              className="rounded-lg bg-ok px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40"
                            >
                              {busy === 'approve' ? 'Applying…' : 'Approve'}
                            </button>
                            <button
                              disabled={busy !== null}
                              onClick={(e) => { e.stopPropagation(); act(i.id, 'reject', onReject); }}
                              className="rounded-lg border border-border-strong px-4 py-2 text-sm text-ink-dim transition hover:bg-card disabled:opacity-40"
                            >
                              {busy === 'reject' ? 'Rejecting…' : 'Reject'}
                            </button>
                            <span className="text-xs text-ink-faint">Also sent to WhatsApp</span>
                            {error && <span className="text-xs text-critical">{error}</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
