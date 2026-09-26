'use client';

import { useState } from 'react';
import { LogoMark } from '../Logo';

function RailIcon({
  label,
  onClick,
  href,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}) {
  const cls =
    'group relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-dim transition hover:bg-card hover:text-ink';

  const tooltip = (
    <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-dark px-2.5 py-1.5 text-xs font-medium text-dark-ink opacity-0 shadow-sm transition group-hover:opacity-100">
      {label}
    </span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} aria-label={label}>
        {children}
        {tooltip}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls} aria-label={label}>
      {children}
      {tooltip}
    </button>
  );
}

export function Sidebar({ shopifyAdminUrl }: { shopifyAdminUrl?: string }) {
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const runLoop = async () => {
    setRunning(true);
    setNote(null);
    try {
      const res = await fetch('/api/run-loop', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setNote(`Run failed: ${body?.error ?? res.status}`);
        return;
      }
      const opened = (body.summaries ?? []).filter((s: { incidentOpened: boolean }) => s.incidentOpened).length;
      setNote(opened > 0 ? `${opened} incident${opened === 1 ? '' : 's'} opened` : 'Store stayed healthy');
    } catch {
      setNote('Run failed: could not reach the server.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <nav className="flex w-16 shrink-0 flex-col items-center gap-1 rounded-2xl border border-border bg-shell-bg py-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center">
        <LogoMark className="h-8 w-8" />
      </div>
      <div className="mb-1 h-px w-6 bg-border-strong" />

      <RailIcon label={running ? 'Running…' : note ?? 'Run shoppers now'} onClick={runLoop}>
        {running ? (
          <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
          </svg>
        )}
      </RailIcon>

      {shopifyAdminUrl && (
        <RailIcon label="Open Shopify admin" href={shopifyAdminUrl}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M6 8h12l-1 12H7L6 8z" />
            <path d="M9 8a3 3 0 0 1 6 0" />
          </svg>
        </RailIcon>
      )}

      <RailIcon label="View source on GitHub" href="https://github.com/zith008/grok-hack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
        </svg>
      </RailIcon>
    </nav>
  );
}
