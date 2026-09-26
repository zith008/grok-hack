/**
 * Reset the dev store to a known-healthy baseline, then re-sync Supabase.
 *
 *   npm run reset:store
 *
 * Run this before every rehearsal and once more before the judges arrive.
 * Break, fix and rollback all mutate live product copy, so after a few loops
 * the store drifts: some products end up with no size line at all, which
 * quietly ruins the healthy baseline the detector compares against.
 *
 * Every size guide here carries real measurements. The seed copy used to say
 * "See our size chart for exact measurements" and then show none, which the
 * shopper personas correctly flagged as a missing size guide — healthy pages
 * converted at 50% and there was nowhere left to fall when we pressed Break.
 */
import { listProducts, updateProduct, updateVariantPrice } from "@/lib/commerce/shopify";
import { syncAllProducts } from "@/lib/commerce/sync";

interface Baseline {
  price: string;
  description: string;
  size_info: string;
  materials: string;
  returns_policy: string;
}

const RETURNS = "Free returns within 30 days, unworn with tags attached.";

/** Keyed by product title so a re-seed with new Shopify ids still matches. */
const BASELINE: Record<string, Baseline> = {
  "Denim Trucker Jacket": {
    price: "78.00",
    description: "A wardrobe staple that fades and softens beautifully with wear.",
    size_info:
      "XS-XXL. Medium measures 54cm chest pit-to-pit, 66cm back length, 63cm sleeve. Model is 183cm wearing M.",
    materials: "100% rigid cotton denim, 13oz.",
    returns_policy: RETURNS,
  },
  "Classic White Oxford Shirt": {
    price: "48.00",
    description: "A crisp button-down that works under a jumper or on its own.",
    size_info:
      "XS-XXL. Medium measures 108cm chest, 76cm back length, 64cm sleeve. Model is 183cm wearing M.",
    materials: "100% organic cotton oxford weave, 140gsm.",
    returns_policy: RETURNS,
  },
  "Slim Fit Chino Trousers": {
    price: "52.00",
    description: "A tailored slim fit chino that moves with you.",
    size_info: "W28-W38. Inside leg 81cm on all waists. Leg opening 16cm. Model is 183cm wearing W32.",
    materials: "97% cotton twill, 3% elastane.",
    returns_policy: RETURNS,
  },
  "Merino Wool Crew Jumper": {
    price: "65.00",
    description: "A fine-gauge crew neck that layers without bulk.",
    size_info:
      "S-XL. Medium measures 52cm chest pit-to-pit, 68cm body length, 62cm sleeve. Model is 183cm wearing M.",
    materials: "100% extra-fine merino wool, 19.5 micron.",
    returns_policy: RETURNS,
  },
  "Organic Cotton T-Shirt": {
    price: "22.00",
    description: "A heavyweight tee that holds its shape after washing.",
    size_info:
      "XS-XXL. Medium measures 50cm chest pit-to-pit, 70cm body length. Model is 183cm wearing M.",
    materials: "100% GOTS-certified organic cotton, 220gsm.",
    returns_policy: RETURNS,
  },
  "Leather Chelsea Boots": {
    price: "120.00",
    description: "Hand-finished Chelsea boots built to be resoled.",
    size_info: "UK 6-12 including half sizes. True to size; go up half a size for thick socks. Shaft height 12cm.",
    materials: "Full-grain calf leather upper, leather lining, Goodyear-welted rubber sole.",
    returns_policy: RETURNS,
  },
  "Cashmere Scarf": {
    price: "45.00",
    description: "A lightweight scarf that packs down to nothing.",
    size_info: "One size, 30cm x 180cm, 90g.",
    materials: "100% grade-A Mongolian cashmere, 2-ply.",
    returns_policy: RETURNS,
  },
  "Merino Wool Socks (3-Pack)": {
    price: "18.00",
    description: "Three pairs of everyday socks that do not sag.",
    size_info: "UK 6-8, 9-11 and 12-14. Crew height, 18cm cuff.",
    materials: "68% merino wool, 29% nylon, 3% elastane.",
    returns_policy: RETURNS,
  },
  "Canvas Weekend Bag": {
    price: "68.00",
    description: "A cabin-sized holdall that survives being thrown in a boot.",
    size_info: "50cm wide x 28cm tall x 25cm deep, 35 litres. Fits most cabin allowances. Strap drop 55cm.",
    materials: "18oz waxed cotton canvas with full-grain leather trim and a brass zip.",
    returns_policy: RETURNS,
  },
};

function toBody(b: Baseline): string {
  return [
    `<p>${b.description}</p>`,
    `<p><strong>Material:</strong> ${b.materials}</p>`,
    `<p><strong>Size guide:</strong> ${b.size_info}</p>`,
    `<p><strong>Returns:</strong> ${b.returns_policy}</p>`,
  ].join("\n");
}

async function main() {
  const products = await listProducts();
  let reset = 0;
  const unknown: string[] = [];

  for (const product of products) {
    const baseline = BASELINE[product.title];
    if (!baseline) {
      unknown.push(product.title);
      continue;
    }

    await updateProduct(product.id, { body_html: toBody(baseline) });

    const variant = product.variants[0];
    if (variant && Number(variant.price) !== Number(baseline.price)) {
      await updateVariantPrice(variant.id, baseline.price);
      console.log(`  ${product.title}: price £${variant.price} -> £${baseline.price}`);
    }

    reset += 1;
    console.log(`Reset ${product.title}`);
  }

  if (unknown.length > 0) {
    console.log(`\nNo baseline for: ${unknown.join(", ")} — left untouched.`);
  }

  const count = await syncAllProducts();
  console.log(`\nReset ${reset} products; re-synced ${count} into Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
