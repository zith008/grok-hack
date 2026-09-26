/**
 * The mark reads left to right like the product works: a flat healthy line,
 * a drop (the leak), a sharp recovery (the fix), settling flat again — with
 * a dot on the resolved end, echoing the "live" indicators used everywhere
 * else in the console.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M6 17.5H10.5L13 23L18 8.5L20.5 14.5H26"
        stroke="var(--accent-ink)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="14.5" r="2.1" fill="var(--accent)" />
      <circle cx="26" cy="14.5" r="1.4" fill="var(--accent-ink)" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="text-[17px] font-bold tracking-tight text-ink">
        Autopilot
      </span>
    </div>
  );
}
