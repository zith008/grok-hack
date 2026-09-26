'use client';

import { useEffect, useRef, useState } from 'react';

type Integration = { name: string; use: string; logo: string; bg: string };

const SHOPIFY: Integration = { name: 'Shopify', use: 'Reads the real product page', logo: '/logos/shopify.svg', bg: '#F2F9EC' };
const SHOPIFY_WRITE: Integration = { ...SHOPIFY, use: 'Writes the new copy or price live' };
const GROK: Integration = { name: 'Grok (xAI)', use: 'Explains the cause in one sentence', logo: '/logos/grok.png', bg: '#F1F0EE' };
const GROK_VERIFY: Integration = { ...GROK, use: 'Re-runs the 20 shoppers on the fix' };
const TAVILY: Integration = { name: 'Tavily', use: 'Market price comps when price is the issue', logo: '/logos/tavily.png', bg: '#EEF1F5' };
const WASSIST: Integration = { name: 'Wassist', use: 'Sends the fix on WhatsApp for approval', logo: '/logos/wassist.png', bg: '#EFF3F8' };
const SUPABASE: Integration = { name: 'Supabase', use: 'Realtime — the console updates instantly', logo: '/logos/supabase.svg', bg: '#E9FBF4' };

const STEPS: { title: string; body: string; icon: React.ReactNode; integrations: Integration[] }[] = [
  {
    title: 'Detect',
    body: '20 shopper personas test every product page and get compared against the store average.',
    icon: <path d="M12 9v4m0 4h.01M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
    integrations: [SHOPIFY],
  },
  {
    title: 'Diagnose',
    body: 'Grok reads the page and the shoppers’ own words, and explains the cause in one sentence.',
    icon: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 1.8-2.4 3.3M12 17h.01" /></>,
    integrations: [GROK, TAVILY],
  },
  {
    title: 'Fix',
    body: 'Rewrites the copy or price. Applied automatically, or sent for approval on WhatsApp.',
    icon: <path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4L8.4 18.6 4 20l1.4-4.4Z" />,
    integrations: [SHOPIFY_WRITE, WASSIST],
  },
  {
    title: 'Verify',
    body: 'Re-runs the shoppers on the fixed page — confirms it worked, or rolls it back automatically.',
    icon: <path d="m4 12 5 5L20 6" />,
    integrations: [GROK_VERIFY, SUPABASE],
  },
];

function IntegrationBadge({ integration }: { integration: Integration }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2" style={{ backgroundColor: integration.bg }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={integration.logo} alt="" className="h-5 w-5 rounded object-contain" />
      <div className="min-w-0">
        <div className="text-xs font-semibold text-ink">{integration.name}</div>
        <div className="text-[11px] leading-snug text-ink-dim">{integration.use}</div>
      </div>
    </div>
  );
}

function Step({ step, index, isLast }: { step: (typeof STEPS)[number]; index: number; isLast: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative flex gap-5 transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${index * 90}ms`,
      }}
    >
      <div className="flex flex-col items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {step.icon}
          </svg>
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-border-strong" />}
      </div>

      <div className="min-w-0 flex-1 pb-8">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Step {index + 1}</div>
        <div className="text-lg font-semibold text-ink">{step.title}</div>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">{step.body}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {step.integrations.map((integration) => (
            <IntegrationBadge key={integration.name + integration.use} integration={integration} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-ink-faint">How it works</h2>
      <div>
        {STEPS.map((step, i) => (
          <Step key={step.title} step={step} index={i} isLast={i === STEPS.length - 1} />
        ))}
      </div>
    </div>
  );
}
