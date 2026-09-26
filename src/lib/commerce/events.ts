import type { PersonaDecision } from "../agents/types";
import { getSupabaseServerClient } from "./supabase";

/**
 * Best-effort dual-write to PostHog (architecture doc: "Send each shopper
 * event to both Supabase and PostHog... detection reads from Supabase for
 * real-time"). No-ops when NEXT_PUBLIC_POSTHOG_KEY is unset. Never throws —
 * PostHog being down must never break detection.
 */
async function capturePostHog(productId: string, decisions: PersonaDecision[]): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

  try {
    await fetch(`${host}/batch/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        batch: decisions.map((d) => ({
          event: "shopper_decision",
          distinct_id: d.persona,
          properties: {
            product_id: productId,
            action: d.action,
            reason: d.reason,
            blockers: d.blockers,
          },
        })),
      }),
    });
  } catch {
    // ignore — Supabase is the source of truth for detection
  }
}

/** Writes one persona run's decisions to `events` (and PostHog, best-effort). */
export async function recordDecisions(
  productId: string,
  decisions: PersonaDecision[],
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const rows = decisions.map((d) => ({
    product_id: productId,
    persona: d.persona,
    type: d.action,
    reason: d.reason,
  }));

  const { error } = await supabase.from("events").insert(rows);
  if (error) {
    throw new Error(`Supabase events insert failed: ${error.message}`);
  }

  await capturePostHog(productId, decisions);
}

export function conversionRate(decisions: { action: string }[]): number {
  if (decisions.length === 0) return 0;
  const carts = decisions.filter((d) => d.action === "add_to_cart").length;
  return carts / decisions.length;
}

/** Add-to-cart rate for a product over its most recent `sampleSize` events. */
export async function recentConversionRate(
  productId: string,
  sampleSize = 20,
): Promise<{ rate: number; sampleCount: number }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("type")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(sampleSize);

  if (error) {
    throw new Error(`Supabase events read failed: ${error.message}`);
  }

  const rows = data ?? [];
  return { rate: conversionRate(rows.map((r) => ({ action: r.type }))), sampleCount: rows.length };
}

/**
 * Average of every other product's most recent conversion rate — the
 * "store average" detector 1 compares a broken product against.
 */
export async function storeAverageConversion(
  excludeProductId: string,
  sampleSize = 20,
): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id")
    .neq("id", excludeProductId);

  if (error) {
    throw new Error(`Supabase products read failed: ${error.message}`);
  }

  const rates: number[] = [];
  for (const product of products ?? []) {
    const { rate, sampleCount } = await recentConversionRate(product.id, sampleSize);
    if (sampleCount > 0) rates.push(rate);
  }

  if (rates.length === 0) return 0;
  return rates.reduce((sum, r) => sum + r, 0) / rates.length;
}
