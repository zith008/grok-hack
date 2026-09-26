'use client';

import { useState } from 'react';
import { BeforeAfterDiff } from './BeforeAfterDiff';
import { STATUS_STYLE, type FixRow, type IncidentRow } from '@/lib/dashboard/rows';

function pct(v: number | null) {
  return v == null ? '—' : `${Math.round(v * 100)}%`;
}

export function IncidentCard({
  incident,
  fix,
  onApprove,
  onReject,
}: {
  incident: IncidentRow;
  fix?: FixRow;
  onApprove: (incidentId: string) => void;
  onReject: (incidentId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const style = STATUS_STYLE[incident.status];
  const awaiting = incident.status === 'fixing' && fix && !fix.applied_at && fix.autonomy !== 'automatic';

  const act = (fn: (id: string) => void) => {
    setBusy(true);
    fn(incident.id);
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-medium text-white">{incident.product_title}</h3>
          <p className="mt-0.5 text-xs uppercase tracking-wider text-white/35">
            {incident.detector}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${style.cls}`}>
          {style.label}
        </span>
      </header>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/35">Loss</div>
          <div className="font-mono text-2xl text-red-300 tabular-nums">
            £{Math.round(incident.loss_per_day_gbp)}
            <span className="text-sm text-white/30">/day</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/35">Add to cart</div>
          <div className="font-mono text-2xl tabular-nums">
            <span className="text-red-300">{pct(incident.conversion_before)}</span>
            <span className="mx-2 text-white/25">→</span>
            <span className={incident.conversion_after != null ? 'text-emerald-300' : 'text-white/25'}>
              {pct(incident.conversion_after)}
            </span>
          </div>
        </div>
      </div>

      {incident.diagnosis && (
        <p className="mt-4 border-l-2 border-white/15 pl-3 text-[15px] leading-relaxed text-white/75">
          {incident.diagnosis}
        </p>
      )}

      {fix && <BeforeAfterDiff before={fix.before_json} after={fix.after_json} />}

      {awaiting && (
        <div className="mt-5 flex items-center gap-3">
          <button
            disabled={busy}
            onClick={() => act(onApprove)}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:opacity-40"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => act(onReject)}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-40"
          >
            Reject
          </button>
          <span className="text-xs text-white/35">Also sent to WhatsApp</span>
        </div>
      )}
    </article>
  );
}
