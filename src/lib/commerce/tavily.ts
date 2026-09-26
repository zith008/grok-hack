// Detector 2: price vs market comps. Feeds ProductSnapshot.market_median_price;
// pageBlockers() and the shopper mock already treat an inflated price as a
// blocker once this is set, so the existing detect/diagnose/fix/verify loop
// (detector 1) picks it up without any separate detection code.
//
// No TAVILY_API_KEY -> returns null and the price blocker just never fires.
// That's the same "unset env var = feature quietly off" pattern as Grok/Wassist.

interface TavilyResult {
  title?: string;
  content?: string;
}

function extractPrices(text: string): number[] {
  const matches = text.matchAll(/[£$€]\s?(\d{1,4}(?:\.\d{2})?)/g);
  return [...matches].map((m) => Number(m[1])).filter((n) => n > 0 && n < 100000);
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function fetchMarketMedianPrice(productTitle: string): Promise<number | null> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${productTitle} price buy online`,
        search_depth: "basic",
        max_results: 8,
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { results?: TavilyResult[] };
    const prices = (data.results ?? []).flatMap((r) => extractPrices(`${r.title ?? ""} ${r.content ?? ""}`));

    return median(prices);
  } catch {
    return null;
  }
}
