// Phase 3, Person A: fix apply, verify, rollback.
// Person B's proposeFix() decides *what* to change; everything here is the
// Shopify write, the autonomy gate, and proving the change actually worked.

import { proposeFix, type Autonomy } from "../agents/fix";
import type { Diagnosis, FixType, PersonaDecision, ProductSnapshot } from "../agents/types";
import { alertText, notify } from "../agents/wassist";
import { PERSONAS } from "../agents/personas";
import { runShopper } from "../agents/shopper";
import { parseDescription, toBodyHtml, toSnapshot, type ProductRow } from "../agents/snapshot";
import { DETECTOR_1_THRESHOLD_PCT } from "./detector";
import { conversionRate, recordDecisions, storeAverageConversion } from "./events";
import { getAutonomySettings } from "./settings";
import { getProduct, updateProduct, updateVariantPrice } from "./shopify";
import { getSupabaseServerClient } from "./supabase";
import { syncAllProducts } from "./sync";

/**
 * `body_html` is kept only so a rollback can restore the exact original —
 * it's excluded from the dashboard diff (see BeforeAfterDiff's EXCLUDE_KEYS).
 * Everything else here is the parsed, human-readable shape, so before and
 * after always compare like with like.
 */
async function snapshotBeforeJson(type: FixType, shopifyId: number): Promise<Record<string, unknown>> {
  if (type === "reorder") return {};
  const product = await getProduct(shopifyId);
  if (type === "price") {
    return { price: product.variants[0]?.price ?? null };
  }
  const parsed = parseDescription(product.body_html);
  return { title: product.title, body_html: product.body_html, ...parsed };
}

/** Rebuilds body_html from the fix's new description plus whatever labelled lines are still intact. */
async function applyCopyFix(shopifyId: number, after_json: Record<string, unknown>) {
  const product = await getProduct(shopifyId);
  const parsed = parseDescription(product.body_html);
  const newDescription = typeof after_json.description === "string" ? after_json.description : parsed.description;

  const newBodyHtml = toBodyHtml(newDescription, {
    size_info: parsed.size_info,
    materials: parsed.materials,
    returns_policy: parsed.returns_policy,
  });

  await updateProduct(shopifyId, {
    title: typeof after_json.title === "string" ? after_json.title : product.title,
    body_html: newBodyHtml,
  });
}

/** Re-reads the live product after a copy fix so the stored after_json reflects what actually landed. */
async function readBackCopyState(shopifyId: number, fallbackTitle: string): Promise<Record<string, unknown>> {
  const product = await getProduct(shopifyId);
  const parsed = parseDescription(product.body_html);
  return { title: product.title ?? fallbackTitle, ...parsed };
}

async function applyToShopify(type: FixType, shopifyId: number, after_json: Record<string, unknown>) {
  if (type === "reorder") return; // draft only — the merchant sends this one themselves
  if (type === "price") {
    const product = await getProduct(shopifyId);
    const variant = product.variants[0];
    if (!variant) throw new Error("Product has no variant to reprice");
    await updateVariantPrice(variant.id, String(after_json.price));
    return;
  }
  await applyCopyFix(shopifyId, after_json);
}

async function restoreToShopify(type: FixType, shopifyId: number, before_json: Record<string, unknown>) {
  if (type === "reorder") return;
  if (type === "price") {
    if (before_json.price == null) return;
    const product = await getProduct(shopifyId);
    const variant = product.variants[0];
    if (!variant) return;
    await updateVariantPrice(variant.id, String(before_json.price));
    return;
  }
  await updateProduct(shopifyId, {
    title: typeof before_json.title === "string" ? before_json.title : undefined,
    body_html: typeof before_json.body_html === "string" ? before_json.body_html : undefined,
  });
}

export interface VerifyResult {
  recovered: boolean;
  rate: number;
  storeAvg: number;
}

/** Re-runs the 20 personas on the (now changed) product and verifies or rolls back. */
export async function verifyIncident(
  incidentId: string,
  productId: string,
  shopifyId: number,
  fixType: FixType,
  beforeJson: Record<string, unknown>,
): Promise<VerifyResult> {
  const supabase = getSupabaseServerClient();

  await syncAllProducts();

  const { data: row, error } = await supabase
    .from("products")
    .select("id, shopify_id, title, price, cost, inventory, snapshot_json")
    .eq("id", productId)
    .single();

  if (error || !row) {
    throw new Error(`Could not reload product for verify: ${error?.message}`);
  }

  const snapshot = toSnapshot(row as ProductRow);
  const decisions = await Promise.all(PERSONAS.map((p) => runShopper(p, snapshot)));
  await recordDecisions(productId, decisions);

  const rate = conversionRate(decisions);
  const storeAvg = await storeAverageConversion(productId);
  const recovered = storeAvg === 0 || rate >= storeAvg * DETECTOR_1_THRESHOLD_PCT;

  await supabase.from("incidents").update({ conversion_after: rate }).eq("id", incidentId);

  if (recovered) {
    await supabase.from("incidents").update({ status: "verified" }).eq("id", incidentId);
  } else {
    await restoreToShopify(fixType, shopifyId, beforeJson);
    await syncAllProducts();
    await supabase.from("incidents").update({ status: "rolled_back" }).eq("id", incidentId);
  }

  return { recovered, rate, storeAvg };
}

export interface ProcessResult {
  fixId: string;
  type: FixType;
  autonomy: Autonomy;
  applied: boolean;
  needsApproval: boolean;
  notifyDelivered?: boolean;
}

export interface FixProductRow {
  id: string;
  shopify_id: string;
  title: string;
  price: number;
  cost?: number | null;
}

/**
 * Runs right after an incident is opened and diagnosed. Proposes a fix, then
 * either applies it immediately (automatic) or stores it pending and alerts
 * the merchant on WhatsApp (needs_approval). Reorder fixes are drafted only.
 */
export async function proposeAndApply(
  incidentId: string,
  product: FixProductRow,
  snapshot: ProductSnapshot,
  diagnosis: Diagnosis,
  decisions: PersonaDecision[],
  lossPerDayGbp: number,
): Promise<ProcessResult> {
  const supabase = getSupabaseServerClient();
  const settings = await getAutonomySettings(product.cost ?? null);

  const fix = await proposeFix(incidentId, snapshot, diagnosis, decisions, settings);
  const shopifyId = Number(product.shopify_id);
  const before_json = await snapshotBeforeJson(fix.type, shopifyId);
  const autonomy: Autonomy =
    fix.type === "price" ? settings.price : fix.type === "reorder" ? "draft_only" : settings.copy;

  const { data: fixRow, error } = await supabase
    .from("fixes")
    .insert({
      incident_id: incidentId,
      type: fix.type,
      before_json,
      after_json: fix.after_json,
      autonomy,
      approved_by: autonomy === "automatic" ? "auto" : null,
      applied_at: autonomy === "automatic" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !fixRow) {
    throw new Error(`Supabase fixes insert failed: ${error?.message}`);
  }

  if (autonomy !== "automatic") {
    // Status moves to "fixing" as soon as a fix is pending — that's what the
    // dashboard's Approve/Reject buttons key off (see IncidentCard.tsx).
    await supabase.from("incidents").update({ status: "fixing" }).eq("id", incidentId);

    const to = process.env.MERCHANT_WHATSAPP_NUMBER;
    const notifyDelivered = to
      ? (await notify(to, alertText(snapshot, diagnosis, fix, lossPerDayGbp))).delivered
      : undefined;

    return { fixId: fixRow.id, type: fix.type, autonomy, applied: false, needsApproval: true, notifyDelivered };
  }

  await supabase.from("incidents").update({ status: "fixing" }).eq("id", incidentId);
  await applyToShopify(fix.type, shopifyId, fix.after_json);

  if (fix.type === "copy") {
    const after_json = await readBackCopyState(shopifyId, product.title);
    await supabase.from("fixes").update({ after_json }).eq("id", fixRow.id);
  }

  await verifyIncident(incidentId, product.id, shopifyId, fix.type, before_json);

  return { fixId: fixRow.id, type: fix.type, autonomy, applied: true, needsApproval: false };
}

/**
 * Called once `fixes.approved_by` has been set (dashboard button or WhatsApp
 * reply). Applies the pending fix to Shopify, then verifies it.
 */
export async function applyApprovedFix(incidentId: string) {
  const supabase = getSupabaseServerClient();

  const { data: fixRow, error } = await supabase
    .from("fixes")
    .select("id, type, before_json, after_json")
    .eq("incident_id", incidentId)
    .not("approved_by", "is", null)
    .is("applied_at", null)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Supabase fixes read failed: ${error.message}`);
  if (!fixRow) return { applied: false, reason: "no approved fix pending" };

  const { data: incident, error: incErr } = await supabase
    .from("incidents")
    .select("id, product_id, products(shopify_id)")
    .eq("id", incidentId)
    .single();

  if (incErr || !incident) throw new Error(`Supabase incident read failed: ${incErr?.message}`);

  const product = (Array.isArray(incident.products) ? incident.products[0] : incident.products) as
    | { shopify_id: string }
    | undefined;
  if (!product) throw new Error("Incident has no linked product");

  const shopifyId = Number(product.shopify_id);
  const type = fixRow.type as FixType;
  const before_json = fixRow.before_json as Record<string, unknown>;
  let after_json = fixRow.after_json as Record<string, unknown>;

  await applyToShopify(type, shopifyId, after_json);

  if (type === "copy") {
    after_json = await readBackCopyState(shopifyId, String(before_json.title ?? ""));
  }

  await supabase.from("fixes").update({ after_json, applied_at: new Date().toISOString() }).eq("id", fixRow.id);

  const result = await verifyIncident(incidentId, incident.product_id, shopifyId, type, before_json);
  return { applied: true, ...result };
}
