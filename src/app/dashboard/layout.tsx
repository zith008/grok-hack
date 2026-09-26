import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const funnelUrl = process.env.NEXT_PUBLIC_POSTHOG_FUNNEL_URL;
  const live = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const shopifyAdminUrl = process.env.SHOPIFY_STORE_DOMAIN
    ? `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin`
    : undefined;

  return (
    <main className="min-h-screen bg-page-bg p-3 sm:p-6">
      <div className="mx-auto flex max-w-[1440px] gap-3">
        <Sidebar shopifyAdminUrl={shopifyAdminUrl} />
        <div className="min-w-0 flex-1 rounded-2xl border border-border bg-shell-bg p-4 sm:p-6">
          <TopBar live={live} funnelUrl={funnelUrl} />
          {children}
        </div>
      </div>
    </main>
  );
}
