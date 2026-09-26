/**
 * Phase 1, Person A: pull products from the Shopify dev store and upsert
 * them into Supabase `products`. Run with: npm run sync:products
 *
 * Required env vars (see .env.example):
 *   SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { syncAllProducts } from "@/lib/commerce/sync";

async function main() {
  const count = await syncAllProducts();
  if (count === 0) {
    console.log("No products returned from Shopify — seed the dev store first.");
    return;
  }
  console.log(`Synced ${count} products into Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
