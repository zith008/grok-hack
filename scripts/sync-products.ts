/**
 * Phase 1, Person A: pull products from the Shopify dev store and upsert
 * them into Supabase `products`. Run with: npm run sync:products
 *
 * Required env vars (see .env.example):
 *   SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { listProducts, type ShopifyProduct } from "@/lib/commerce/shopify";
import { getSupabaseServerClient } from "@/lib/commerce/supabase";

function toRow(product: ShopifyProduct) {
  const variant = product.variants[0];
  return {
    shopify_id: String(product.id),
    title: product.title,
    price: Number(variant?.price ?? 0),
    inventory: variant?.inventory_quantity ?? 0,
    snapshot_json: product,
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  const products = await listProducts();

  if (products.length === 0) {
    console.log("No products returned from Shopify — seed the dev store first.");
    return;
  }

  const supabase = getSupabaseServerClient();
  const rows = products.map(toRow);
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "shopify_id" });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`Synced ${rows.length} products into Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
