import { IncidentConsole } from '@/components/dashboard/IncidentConsole';

export const metadata = { title: 'Autopilot — Incident Console' };

export default function DashboardPage() {
  const funnelUrl = process.env.NEXT_PUBLIC_POSTHOG_FUNNEL_URL;
  const live = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const grokLive = Boolean(process.env.GROK_API_KEY);
  const wassistLive = Boolean(process.env.WASSIST_API_URL && process.env.WASSIST_API_KEY);
  const tavilyLive = Boolean(process.env.TAVILY_API_KEY);
  const shopifyAdminUrl = process.env.SHOPIFY_STORE_DOMAIN
    ? `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin`
    : undefined;

  return (
    <main className="min-h-screen bg-page-bg p-3 sm:p-6">
      <div className="mx-auto flex max-w-[1440px] gap-3">
        <IncidentConsole
          live={live}
          funnelUrl={funnelUrl}
          grokLive={grokLive}
          wassistLive={wassistLive}
          tavilyLive={tavilyLive}
          shopifyAdminUrl={shopifyAdminUrl}
        />
      </div>
    </main>
  );
}
