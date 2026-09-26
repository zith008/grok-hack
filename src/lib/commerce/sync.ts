import { listProducts, type ShopifyProduct } from "./shopify";
import { getSupabaseServerClient } from "./supabase";

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

/** Pulls every product from Shopify and upserts it into Supabase `products`. */
export async function syncAllProducts(): Promise<number> {
  const products = await listProducts();
  if (products.length === 0) return 0;

  const supabase = getSupabaseServerClient();
  const rows = products.map(toRow);
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "shopify_id" });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  return rows.length;
}
