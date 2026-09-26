export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.round(diffMs / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export const DETECTOR_LABEL: Record<string, string> = {
  views_no_carts: "Views, no carts",
  price_vs_comps: "Price above market",
  stock_out_risk: "Stock-out risk",
};

export function detectorLabel(detector: string): string {
  return DETECTOR_LABEL[detector] ?? detector.replace(/_/g, " ");
}

export function gbp(n: number): string {
  return `£${Math.round(n).toLocaleString()}`;
}
