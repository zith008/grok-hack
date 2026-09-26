'use client';

const STEPS = [
  {
    title: 'Detect',
    body: '20 shopper personas test every product page and get compared against the store average.',
    icon: <path d="M12 9v4m0 4h.01M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  },
  {
    title: 'Diagnose',
    body: 'Grok reads the page and the shoppers’ own words, and explains the cause in one sentence.',
    icon: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 1.8-2.4 3.3M12 17h.01" /></>,
  },
  {
    title: 'Fix',
    body: 'Rewrites the copy or price. Applied automatically, or sent for approval on WhatsApp.',
    icon: <path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4L8.4 18.6 4 20l1.4-4.4Z" />,
  },
  {
    title: 'Verify',
    body: 'Re-runs the shoppers on the fixed page — confirms it worked, or rolls it back automatically.',
    icon: <path d="m4 12 5 5L20 6" />,
  },
];

export function HowItWorks() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {step.icon}
              </svg>
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Step {i + 1}
              </div>
              <div className="font-semibold text-ink">{step.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
