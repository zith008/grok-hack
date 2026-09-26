/**
 * Cached market comparables, used when TAVILY_API_KEY is not set.
 *
 * Detector 2 needs a reference price to call something "overpriced". Live
 * comps come from Tavily; these are the same numbers for our nine catalogue
 * items, captured once so the price path still works offline and on a venue
 * wifi that blocks outbound search. A live Tavily result always wins.
 */
const MARKET_COMPS: Record<string, number> = {
  'Canvas Weekend Bag': 68,
  'Cashmere Scarf': 45,
  'Classic White Oxford Shirt': 48,
  'Denim Trucker Jacket': 78,
  'Leather Chelsea Boots': 120,
  'Merino Wool Crew Jumper': 65,
  'Merino Wool Socks (3-Pack)': 18,
  'Organic Cotton T-Shirt': 22,
  'Slim Fit Chino Trousers': 52,
};

export function cachedMarketMedianPrice(productTitle: string): number | null {
  return MARKET_COMPS[productTitle] ?? null;
}
