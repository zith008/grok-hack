import type { PersonaDecision } from "../agents/types";
import { getSupabaseServerClient } from "./supabase";

/** Writes one persona run's decisions to `events`. */
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
