// Shared by the CLI (scripts/run-shoppers.ts) and the dashboard's "Run
// shoppers now" button (src/app/api/run-loop/route.ts) — one place that
// runs personas against a product, records events, detects and fixes.
import { detectAndDiagnose } from "./detector";
import { recordDecisions } from "./events";
import { proposeAndApply } from "./fix-lifecycle";
import { getSupabaseServerClient } from "./supabase";
import { fetchMarketMedianPrice } from "./tavily";
import { PERSONAS } from "../agents/personas";
import { runShopper } from "../agents/shopper";
import { LAST_MODEL_USED, limitedMap } from "../agents/grok";
import { toSnapshot, type ProductRow } from "../agents/snapshot";

export async function loadProducts(shopifyId?: string): Promise<ProductRow[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("products")
    .select("id, shopify_id, title, price, cost, inventory, snapshot_json");

  if (shopifyId) query = query.eq("shopify_id", shopifyId);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase products read failed: ${error.message}`);
  return (data ?? []) as ProductRow[];
}

export interface ProductRunSummary {
  productId: string;
  title: string;
  cartRate: number;
  model: string;
  incidentOpened: boolean;
  incidentId?: string;
  lossPerDayGbp?: number;
  fixApplied?: boolean;
  needsApproval?: boolean;
}

export async function runOnProduct(row: ProductRow): Promise<ProductRunSummary> {
  const marketMedianPrice = await fetchMarketMedianPrice(row.title);
  const snapshot = toSnapshot(row, { market_median_price: marketMedianPrice });
  // Free model pools reject 20-at-once; pace the run instead.
  const concurrency = Number(process.env.SHOPPER_CONCURRENCY ?? 4);
  const decisions = await limitedMap(PERSONAS, concurrency, (p) => runShopper(p, snapshot));

  await recordDecisions(row.id, decisions);

  const carts = decisions.filter((d) => d.action === "add_to_cart").length;
  const cartRate = carts / PERSONAS.length;

  const result = await detectAndDiagnose(
    { id: row.id, shopify_id: row.shopify_id, title: row.title, price: Number(row.price) },
    snapshot,
    decisions,
  );

  const summary: ProductRunSummary = {
    productId: row.id,
    title: row.title,
    cartRate,
    model: LAST_MODEL_USED ?? "mock",
    incidentOpened: false,
  };

  if (result.opened && result.incidentId && result.diagnosis) {
    const outcome = await proposeAndApply(
      result.incidentId,
      {
        id: row.id,
        shopify_id: row.shopify_id,
        title: row.title,
        price: Number(row.price),
        cost: row.cost != null ? Number(row.cost) : null,
      },
      snapshot,
      result.diagnosis,
      decisions,
      result.lossPerDayGbp ?? 0,
    );

    summary.incidentOpened = true;
    summary.incidentId = result.incidentId;
    summary.lossPerDayGbp = result.lossPerDayGbp;
    summary.fixApplied = outcome.applied;
    summary.needsApproval = outcome.needsApproval;
  } else if (result.incidentId) {
    summary.incidentId = result.incidentId;
  }

  return summary;
}

export async function runLoop(shopifyId?: string): Promise<ProductRunSummary[]> {
  const products = await loadProducts(shopifyId);
  const summaries: ProductRunSummary[] = [];
  for (const row of products) {
    summaries.push(await runOnProduct(row));
  }
  return summaries;
}
