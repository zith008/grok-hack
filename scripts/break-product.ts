/**
 * Phase 2, Person A: the "Break" button. Makes a realistic merchant mistake
 * on one live product via the Shopify Admin API, then re-syncs Supabase so
 * the next shopper run reads the broken page.
 *
 * Usage:
 *   npm run break -- --product <shopify_id> --mode size
 *   npm run break -- --product <shopify_id> --mode materials
 *   npm run break -- --product <shopify_id> --mode returns
 *   npm run break -- --product <shopify_id> --mode price
 */
import { getProduct, updateProduct, updateVariantPrice } from "@/lib/commerce/shopify";
import { syncAllProducts } from "@/lib/commerce/sync";
import { parseDescription, toBodyHtml } from "@/lib/agents/snapshot";

type Mode = "size" | "materials" | "returns" | "price";

const FIELD_BY_MODE: Record<Exclude<Mode, "price">, "size_info" | "materials" | "returns_policy"> = {
  size: "size_info",
  materials: "materials",
  returns: "returns_policy",
};

async function breakCopy(productId: number, mode: Exclude<Mode, "price">) {
  const product = await getProduct(productId);
  const parsed = parseDescription(product.body_html);
  const field = FIELD_BY_MODE[mode];

  if (!parsed[field]) {
    console.log(`"${product.title}" already has no ${field} — nothing to remove.`);
    return;
  }

  const removed = parsed[field];
  parsed[field] = "";

  const newBodyHtml = toBodyHtml(parsed.description, {
    size_info: parsed.size_info,
    materials: parsed.materials,
    returns_policy: parsed.returns_policy,
  });

  await updateProduct(productId, { body_html: newBodyHtml });
  console.log(`Broke "${product.title}": removed ${field} ("${removed}")`);
}

async function breakPrice(productId: number) {
  const product = await getProduct(productId);
  const variant = product.variants[0];
  if (!variant) throw new Error("Product has no variant to reprice.");

  const before = Number(variant.price);
  // +40%, not +25%: the shelf price already sits 10% under the market median,
  // so a smaller bump lands level with comparables and reads as merely average.
  const after = Number((before * 1.4).toFixed(2));
  await updateVariantPrice(variant.id, String(after));
  console.log(`Broke "${product.title}": price £${before} -> £${after} (+40%)`);
}

async function main() {
  const args = process.argv.slice(2);
  const productIdx = args.indexOf("--product");
  const modeIdx = args.indexOf("--mode");

  const shopifyId = productIdx >= 0 ? args[productIdx + 1] : undefined;
  const mode = (modeIdx >= 0 ? args[modeIdx + 1] : "size") as Mode;

  if (!shopifyId) {
    throw new Error("Usage: npm run break -- --product <shopify_id> --mode size|materials|returns|price");
  }

  const productId = Number(shopifyId);

  if (mode === "price") {
    await breakPrice(productId);
  } else if (mode === "size" || mode === "materials" || mode === "returns") {
    await breakCopy(productId, mode);
  } else {
    throw new Error(`Unknown mode "${mode}". Use size, materials, returns, or price.`);
  }

  const count = await syncAllProducts();
  console.log(`Re-synced ${count} products into Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
