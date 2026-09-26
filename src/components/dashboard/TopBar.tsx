'use client';

import { useEffect, useState } from 'react';
import { Logo } from '../Logo';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'shoppers', label: 'Shoppers' },
];

export function TopBar({ live, funnelUrl }: { live: boolean; funnelUrl?: string }) {
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-2 pb-6 pt-2">
      <Logo />

      <nav className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === s.id ? 'bg-dark text-dark-ink' : 'text-ink-dim hover:text-ink'
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {funnelUrl && (
          <a
            href={funnelUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-ink-faint underline decoration-border-strong underline-offset-4 transition hover:text-ink-dim"
          >
            View funnel in PostHog
          </a>
        )}
        <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-dim">
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-ok' : 'bg-neutral-status'}`} />
          {live ? 'Live' : 'Offline'}
        </span>
      </div>
    </header>
  );
}
