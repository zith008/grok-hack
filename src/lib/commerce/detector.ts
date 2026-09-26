// Detector 1: views, no carts. See HANDOFF-B.md — with 5-7 dealbreaker
// personas out of 20, one missing attribute drops conversion to roughly 65%
// of store average, so "under 30%" never fires. Use 70%.
import { diagnose } from "../agents/diagnose";
import type { Diagnosis, PersonaDecision, ProductSnapshot } from "../agents/types";
import { conversionRate, recentConversionRate, recordDecisions, storeAverageConversion } from "./events";
import { getSupabaseServerClient } from "./supabase";

export const DETECTOR_1_THRESHOLD_PCT = 0.7;
/** Share of add-to-carts that go on to complete checkout. Fixed assumption — no real checkout funnel at a hackathon. */
export const CHECKOUT_RATE = 0.7;
const SAMPLE_SIZE = 20;

export interface ProductRow {
  id: string;
  shopify_id: string;
  title: string;
  price: number;
}

export interface DetectorResult {
  opened: boolean;
  incidentId?: string;
  rate: number;
  storeAvg: number;
  lossPerDayGbp?: number;
  diagnosis?: Diagnosis;
}

/** (expected carts − actual) × avg order value × checkout rate, scaled to the sample. */
export function estimateLossPerDayGbp(
  rate: number,
  storeAvg: number,
  price: number,
  sampleSize = SAMPLE_SIZE,
): number {
  const expectedCarts = storeAvg * sampleSize;
  const actualCarts = rate * sampleSize;
  const missingCarts = Math.max(expectedCarts - actualCarts, 0);
  return Number((missingCarts * price * CHECKOUT_RATE).toFixed(2));
}

/**
 * Runs after a fresh batch of persona decisions has been written to `events`.
 * Compares the product's conversion against the rest of the store; if it has
 * dropped far enough and there isn't already an open incident for it, opens
 * one and immediately diagnoses it (Grok, or the deterministic mock).
 */
export async function detectAndDiagnose(
  product: ProductRow,
  snapshot: ProductSnapshot,
  decisions: PersonaDecision[],
): Promise<DetectorResult> {
  const supabase = getSupabaseServerClient();

  const rate = conversionRate(decisions);
  const storeAvg = await storeAverageConversion(product.id, SAMPLE_SIZE);

  if (storeAvg === 0 || rate >= storeAvg * DETECTOR_1_THRESHOLD_PCT) {
    return { opened: false, rate, storeAvg };
  }

  const { data: existing } = await supabase
    .from("incidents")
    .select("id")
    .eq("product_id", product.id)
    .eq("detector", "views_no_carts")
    .in("status", ["open", "fixing"])
    .maybeSingle();

  if (existing) {
    return { opened: false, rate, storeAvg, incidentId: existing.id };
  }

  const lossPerDayGbp = estimateLossPerDayGbp(rate, storeAvg, product.price);

  const { data: incident, error } = await supabase
    .from("incidents")
    .insert({
      product_id: product.id,
      product_title: product.title,
      detector: "views_no_carts",
      loss_per_day_gbp: lossPerDayGbp,
      conversion_before: rate,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !incident) {
    throw new Error(`Supabase incident insert failed: ${error?.message}`);
  }

  const diagnosis = await diagnose(incident.id, snapshot, decisions);

  await supabase
    .from("incidents")
    .update({ diagnosis: diagnosis.cause, blocker: diagnosis.blocker })
    .eq("id", incident.id);

  return { opened: true, incidentId: incident.id, rate, storeAvg, lossPerDayGbp, diagnosis };
}

/** Convenience: recompute a product's own latest rate without a fresh run. */
export async function currentConversionRate(productId: string) {
  return recentConversionRate(productId, SAMPLE_SIZE);
}

export { recordDecisions };
