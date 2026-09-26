import { IncidentConsole } from '@/components/dashboard/IncidentConsole';

export const metadata = { title: 'Autopilot — Incident Console' };

export default function DashboardPage() {
  const funnelUrl = process.env.NEXT_PUBLIC_POSTHOG_FUNNEL_URL;

  return (
    <main className="min-h-screen bg-[#0a0b0d] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Autopilot</h1>
            <p className="mt-1 text-sm text-white/40">Incident response for revenue</p>
          </div>
          <div className="flex items-center gap-4">
            {funnelUrl && (
              <a
                href={funnelUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white/70"
              >
                View funnel in PostHog
              </a>
            )}
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">Live</p>
          </div>
        </header>

        <IncidentConsole />
      </div>
    </main>
  );
}
