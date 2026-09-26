import { IncidentConsole } from '@/components/dashboard/IncidentConsole';
import { Logo } from '@/components/Logo';

export const metadata = { title: 'Autopilot — Incident Console' };

export default function DashboardPage() {
  const funnelUrl = process.env.NEXT_PUBLIC_POSTHOG_FUNNEL_URL;
  const live = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-ink">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden text-ink-faint sm:inline" aria-hidden="true">·</span>
            <p className="hidden text-sm text-ink-faint sm:inline">Incident response for revenue</p>
          </div>
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
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
              <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-ok' : 'bg-neutral-status'}`} />
              {live ? 'Live' : 'Offline'}
            </span>
          </div>
        </header>

        <IncidentConsole />
      </div>
    </main>
  );
}
