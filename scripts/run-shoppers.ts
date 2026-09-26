/**
 * Phase 2, Person A: run the 20 shopper personas against one or every
 * product, write their decisions to `events`, and run detector 1.
 *
 * Usage:
 *   npm run shop -- --all                 # every product in the store
 *   npm run shop -- --product <shopify_id> # a single product, e.g. after Break
 */
import { detectAndDiagnose } from "@/lib/commerce/detector";
import { recordDecisions } from "@/lib/commerce/events";
import { proposeAndApply } from "@/lib/commerce/fix-lifecycle";
import { getSupabaseServerClient } from "@/lib/commerce/supabase";
import { PERSONAS } from "@/lib/agents/personas";
import { runShopper } from "@/lib/agents/shopper";
import { toSnapshot, type ProductRow } from "@/lib/agents/snapshot";

async function loadProducts(shopifyId?: string): Promise<ProductRow[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("products")
    .select("id, shopify_id, title, price, cost, inventory, snapshot_json");

  if (shopifyId) query = query.eq("shopify_id", shopifyId);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase products read failed: ${error.message}`);
  return (data ?? []) as ProductRow[];
}

async function runOnProduct(row: ProductRow) {
  const snapshot = toSnapshot(row);
  const decisions = await Promise.all(PERSONAS.map((p) => runShopper(p, snapshot)));

  await recordDecisions(row.id, decisions);

  const carts = decisions.filter((d) => d.action === "add_to_cart").length;
  console.log(
    `${row.title}: ${carts}/${PERSONAS.length} added to cart (${((carts / PERSONAS.length) * 100).toFixed(0)}%)`,
  );

  const result = await detectAndDiagnose(
    { id: row.id, shopify_id: row.shopify_id, title: row.title, price: Number(row.price) },
    snapshot,
    decisions,
  );

  if (result.opened && result.incidentId && result.diagnosis) {
    console.log(
      `  -> incident opened (${result.incidentId}): £${result.lossPerDayGbp}/day, rate ${(result.rate * 100).toFixed(0)}% vs store avg ${(result.storeAvg * 100).toFixed(0)}%`,
    );

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

    if (outcome.needsApproval) {
      console.log(
        `  -> fix proposed (${outcome.type}), waiting on approval${outcome.notifyDelivered === false ? " (WhatsApp not configured — approve from the dashboard)" : ""}`,
      );
    } else {
      console.log(`  -> fix applied automatically (${outcome.type}), verifying...`);
    }
  } else if (result.incidentId) {
    console.log(`  -> already has an open incident (${result.incidentId})`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const productIdx = args.indexOf("--product");
  const shopifyId = productIdx >= 0 ? args[productIdx + 1] : undefined;

  const products = await loadProducts(shopifyId);
  if (products.length === 0) {
    console.log("No matching products — sync the store first with npm run sync:products.");
    return;
  }

  for (const row of products) {
    await runOnProduct(row);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
