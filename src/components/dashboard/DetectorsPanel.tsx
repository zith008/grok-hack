'use client';

function Row({ label, detail, live }: { label: string; detail: string; live: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-3 last:border-0">
      <div>
        <div className="text-sm font-medium text-dark-ink">{label}</div>
        <div className="text-xs text-dark-ink/50">{detail}</div>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
          live ? 'bg-ok/20 text-ok' : 'bg-white/10 text-dark-ink/60'
        }`}
      >
        {live ? 'Live' : 'Mock'}
      </span>
    </div>
  );
}

export function DetectorsPanel({
  grokLive,
  wassistLive,
  tavilyLive,
}: {
  grokLive: boolean;
  wassistLive: boolean;
  tavilyLive: boolean;
}) {
  return (
    <div className="rounded-2xl bg-dark p-6 text-dark-ink">
      <h3 className="text-sm font-semibold">Detectors &amp; agents</h3>
      <div className="mt-2">
        <Row label="Views, no carts" detail="Shopper personas vs. store average" live={grokLive} />
        <Row label="Price vs. market" detail="Tavily comps feed the same loop" live={tavilyLive} />
        <Row label="WhatsApp approvals" detail="Wassist send/receive" live={wassistLive} />
      </div>
    </div>
  );
}
