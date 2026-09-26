// Detector 2: price vs market comps. Feeds ProductSnapshot.market_median_price;
// pageBlockers() and the shopper mock already treat an inflated price as a
// blocker once this is set, so the existing detect/diagnose/fix/verify loop
// (detector 1) picks it up without any separate detection code.
//
// No TAVILY_API_KEY -> falls back to the cached comps in comps.ts, so the
// price path still works without a search key.

import { cachedMarketMedianPrice } from "./comps";

interface TavilyResult {
  title?: string;
  content?: string;
}

/**
 * Two queries pooled rather than one. A single search for "Cashmere Scarf
 * price" leans designer and returned a £585 median against a high street that
 * actually sits near £119; pairing a high-street query with a plain buying
 * query gives enough samples for the median to land on the real market.
 */
const QUERIES = [
  (t: string) => `mens ${t} UK price high street`,
  (t: string) => `buy ${t} UK price`,
];

/** Sterling only — mixing $ and € into one median compares nothing to nothing. */
const PRICE_RE = /£\s?(\d{1,4}(?:\.\d{2})?)/g;
/** Search snippets are littered with delivery thresholds and discount amounts. */
const MIN_PRICE = 5;
const MAX_PRICE = 1500;
/** Under this many samples the median is noise, so keep the cached comp. */
const MIN_SAMPLES = 12;
/**
 * Repeat calls for the same product come back £60, £75, £79 — search results
 * move, and a comp that wanders 30% turns a healthy page into a price
 * incident on one run and back on the next. A live reading is therefore taken
 * as corroboration, not as gospel: inside this much of the captured median it
 * wins, outside it the captured median stands.
 */
const MAX_DRIFT = 0.25;

function extractPrices(text: string): number[] {
  return [...text.matchAll(PRICE_RE)]
    .map((m) => Number(m[1]))
    .filter((n) => n >= MIN_PRICE && n <= MAX_PRICE);
}

/** Drops the top and bottom quartile so one outlier listing cannot move the median. */
function trimOutliers(nums: number[]): number[] {
  if (nums.length < 4) return nums;
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted.slice(Math.floor(sorted.length * 0.25), Math.ceil(sorted.length * 0.75));
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Number(value.toFixed(2));
}

async function search(apiKey: string, query: string): Promise<string> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: "basic", max_results: 15 }),
  });
  if (!res.ok) return "";
  const data = (await res.json()) as { results?: TavilyResult[] };
  return (data.results ?? []).map((r) => `${r.title ?? ""} ${r.content ?? ""}`).join(" ");
}

export async function fetchMarketMedianPrice(productTitle: string): Promise<number | null> {
  const apiKey = process.env.TAVILY_API_KEY;
  const cached = cachedMarketMedianPrice(productTitle);
  if (!apiKey) return cached;

  try {
    const pages = await Promise.all(QUERIES.map((q) => search(apiKey, q(productTitle))));
    const prices = pages.flatMap(extractPrices);
    if (prices.length < MIN_SAMPLES) return cached;

    const live = median(trimOutliers(prices));
    if (live == null) return cached;
    if (cached == null) return live;
    return Math.abs(live - cached) / cached <= MAX_DRIFT ? live : cached;
  } catch {
    return cached;
  }
}
