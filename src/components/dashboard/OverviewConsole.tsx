'use client';

import { useConsoleData } from '@/lib/dashboard/useConsoleData';
import { ProblemSolution } from './ProblemSolution';
import { HowItWorks } from './HowItWorks';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function OverviewConsole() {
  const { products, connected } = useConsoleData();

  return (
    <section>
      {!connected && (
        <p className="mb-6 rounded-xl border border-warn-ring bg-warn-bg px-4 py-3 text-sm text-warn">
          Supabase env vars are not set, so this console is not live.
        </p>
      )}

      <h1 className="text-3xl font-extrabold tracking-tight text-ink">{greeting()}</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-dim">
        Autopilot watches {products.length} product{products.length === 1 ? '' : 's'} on your Shopify store, finds
        where you&apos;re quietly losing revenue, fixes it, and proves the fix worked — or rolls it back.
      </p>

      <div className="mt-5">
        <ProblemSolution />
      </div>

      <div className="mt-4">
        <HowItWorks />
      </div>
    </section>
  );
}
