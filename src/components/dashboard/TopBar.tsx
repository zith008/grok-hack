'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../Logo';

const PAGES = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/incidents', label: 'Incidents' },
];

export function TopBar({ live, funnelUrl }: { live: boolean; funnelUrl?: string }) {
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-2 pb-6 pt-2">
      <Logo />

      <nav className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
        {PAGES.map((p) => {
          const active = p.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(p.href);
          return (
            <Link
              key={p.href}
              href={p.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? 'bg-dark text-dark-ink' : 'text-ink-dim hover:text-ink'
              }`}
            >
              {p.label}
            </Link>
          );
        })}
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
