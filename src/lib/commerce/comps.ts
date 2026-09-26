/**
 * Cached market comparables, used when TAVILY_API_KEY is not set.
 *
 * Detector 2 needs a reference price to call something "overpriced". These are
 * the live Tavily medians for our nine catalogue items, captured on 26 Sep 2026
 * so the price path still works offline and on venue wifi that blocks outbound
 * search. Each is the median of three live samples — one call swings as much
 * as £40 on the same product. A live Tavily result always wins. The catalogue's own shelf prices
 * are set to these same numbers, so "overpriced" means overpriced against the
 * real UK high street rather than against a made-up baseline.
 */
const MARKET_COMPS: Record<string, number> = {
  'Canvas Weekend Bag': 70,
  'Cashmere Scarf': 89.95,
  'Classic White Oxford Shirt': 52.98,
  'Denim Trucker Jacket': 75,
  'Leather Chelsea Boots': 95,
  'Merino Wool Crew Jumper': 65,
  'Merino Wool Socks (3-Pack)': 17.49,
  'Organic Cotton T-Shirt': 30,
  'Slim Fit Chino Trousers': 26.99,
};

export function cachedMarketMedianPrice(productTitle: string): number | null {
  return MARKET_COMPS[productTitle] ?? null;
}
