'use client';

import { useState } from 'react';
import { BeforeAfterDiff } from './BeforeAfterDiff';
import { STATUS_STYLE, type FixRow, type IncidentRow } from '@/lib/dashboard/rows';
import { detectorLabel, gbp, relativeTime } from '@/lib/dashboard/format';

function pct(v: number | null) {
  return v == null ? '—' : `${Math.round(v * 100)}%`;
}

const STATUS_ICON: Record<IncidentRow['status'], string> = {
  open: '●',
  fixing: '◐',
  verified: '✓',
  rolled_back: '↺',
};

export function IncidentCard({
  incident,
  fix,
  thumbnail,
  onApprove,
  onReject,
}: {
  incident: IncidentRow;
  fix?: FixRow;
  thumbnail?: string;
  onApprove: (incidentId: string) => Promise<{ ok: boolean; error?: string }>;
  onReject: (incidentId: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const style = STATUS_STYLE[incident.status];
  const awaiting = incident.status === 'fixing' && fix && !fix.applied_at && fix.autonomy !== 'automatic';
  const resolved = incident.status === 'verified' || incident.status === 'rolled_back';

  const act = async (kind: 'approve' | 'reject', fn: (id: string) => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(kind);
    setError(null);
    const result = await fn(incident.id);
    setBusy(null);
    if (!result.ok) setError(result.error ?? 'Something went wrong — try again.');
  };

  return (
    <article
      className={`rounded-2xl border bg-surface p-6 transition-colors ${
        incident.status === 'open' ? 'border-critical-ring/60' : 'border-border'
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-ink-faint">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
                <path d="M4 8l8 4 8-4M12 12v8" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-medium text-ink">{incident.product_title}</h3>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-faint">
              <span className="font-mono uppercase tracking-wider">{detectorLabel(incident.detector)}</span>
              <span aria-hidden="true">·</span>
              <span>{relativeTime(incident.created_at)}</span>
            </p>
          </div>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${style.cls}`}>
          <span aria-hidden="true">{STATUS_ICON[incident.status]}</span>
          {style.label}
        </span>
      </header>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">
            {resolved ? 'Was losing' : 'Losing'}
          </div>
          <div className={`font-mono text-2xl tabular-nums ${resolved ? 'text-ink-dim' : 'text-critical'}`}>
            {gbp(incident.loss_per_day_gbp)}
            <span className="text-sm text-ink-faint">/day</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">Add to cart</div>
          <div className="font-mono text-2xl tabular-nums">
            <span className="text-critical">{pct(incident.conversion_before)}</span>
            <span className="mx-2 text-ink-faint">→</span>
            <span className={incident.conversion_after != null ? 'text-ok' : 'text-ink-faint'}>
              {pct(incident.conversion_after)}
            </span>
          </div>
        </div>
      </div>

      {incident.diagnosis && (
        <p className="mt-4 border-l-2 border-border-strong pl-3 text-[15px] leading-relaxed text-ink-dim">
          {incident.diagnosis}
        </p>
      )}

      {fix && <BeforeAfterDiff before={fix.before_json} after={fix.after_json} />}

      {awaiting && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            disabled={busy !== null}
            onClick={() => act('approve', onApprove)}
            className="rounded-lg bg-ok px-4 py-2 text-sm font-medium text-[#08130e] transition hover:brightness-110 disabled:opacity-40"
          >
            {busy === 'approve' ? 'Applying…' : 'Approve'}
          </button>
          <button
            disabled={busy !== null}
            onClick={() => act('reject', onReject)}
            className="rounded-lg border border-border-strong px-4 py-2 text-sm text-ink-dim transition hover:bg-surface-2 disabled:opacity-40"
          >
            {busy === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
          <span className="text-xs text-ink-faint">Also sent to WhatsApp</span>
          {error && <span className="text-xs text-critical">{error}</span>}
        </div>
      )}
    </article>
  );
}
