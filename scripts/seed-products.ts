/**
 * Phase 1, Person A: seed the Shopify dev store with 8-10 healthy products
 * (good copy, size/material/returns info, price, stock) as the baseline
 * before the "Break" button starts removing info. Run with:
 *   npm run seed:products
 */
import { createProduct } from "@/lib/commerce/shopify";

type SeedProduct = {
  title: string;
  price: string;
  inventory: number;
  image_src: string;
  body_html: string;
};

function copy(material: string, sizes: string, extra = ""): string {
  return `
    <p>${extra}</p>
    <p><strong>Material:</strong> ${material}</p>
    <p><strong>Size guide:</strong> True to size, available in ${sizes}. See our size chart for exact measurements.</p>
    <p><strong>Returns:</strong> Free returns within 30 days, unworn with tags attached.</p>
  `.trim();
}

const PRODUCTS: SeedProduct[] = [
  {
    title: "Classic White Oxford Shirt",
    price: "48.00",
    inventory: 32,
    image_src: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800",
    body_html: copy(
      "100% long-staple cotton oxford weave",
      "XS-XXL",
      "A crisp, breathable oxford shirt built for every day. Button-down collar, mother-of-pearl buttons.",
    ),
  },
  {
    title: "Merino Wool Crew Jumper",
    price: "65.00",
    inventory: 24,
    image_src: "https://images.unsplash.com/photo-1638207061407-9020f3c17ab8?w=800",
    body_html: copy(
      "100% extra-fine merino wool",
      "S-XL",
      "Lightweight yet warm, machine washable merino crew neck for year-round layering.",
    ),
  },
  {
    title: "Slim Fit Chino Trousers",
    price: "52.00",
    inventory: 40,
    image_src: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
    body_html: copy(
      "98% cotton, 2% elastane for stretch",
      "28-38 waist, regular and long leg",
      "A tailored slim fit chino that moves with you, from desk to dinner.",
    ),
  },
  {
    title: "Organic Cotton T-Shirt",
    price: "22.00",
    inventory: 60,
    image_src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    body_html: copy(
      "100% GOTS-certified organic cotton, 180gsm",
      "XS-XXL",
      "Our best-selling essential tee, soft-washed for a broken-in feel from day one.",
    ),
  },
  {
    title: "Leather Chelsea Boots",
    price: "120.00",
    inventory: 18,
    image_src: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800",
    body_html: copy(
      "Full-grain leather upper, elastic side panel, leather sole",
      "UK 6-12, half sizes order up",
      "Hand-finished Chelsea boots built to be resoled and worn for years.",
    ),
  },
  {
    title: "Denim Trucker Jacket",
    price: "78.00",
    inventory: 22,
    image_src: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800",
    body_html: copy(
      "100% rigid cotton denim, 13oz",
      "XS-XXL",
      "A wardrobe staple that fades and softens beautifully with wear.",
    ),
  },
  {
    title: "Cashmere Scarf",
    price: "45.00",
    inventory: 35,
    image_src: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800",
    body_html: copy(
      "100% grade-A Mongolian cashmere",
      "One size, 30cm x 180cm",
      "Ultra-soft cashmere scarf, woven in a classic herringbone pattern.",
    ),
  },
  {
    title: "Canvas Weekend Bag",
    price: "68.00",
    inventory: 16,
    image_src: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    body_html: copy(
      "Waxed cotton canvas body, full-grain leather trim",
      "One size, 45L capacity",
      "Fits airline carry-on requirements. Reinforced stitching at every stress point.",
    ),
  },
  {
    title: "Merino Wool Socks (3-Pack)",
    price: "18.00",
    inventory: 50,
    image_src: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800",
    body_html: copy(
      "80% merino wool, 18% nylon, 2% elastane",
      "UK 6-8, 9-11, 12-14",
      "Temperature-regulating everyday socks, reinforced heel and toe.",
    ),
  },
];

async function main() {
  for (const seed of PRODUCTS) {
    const created = await createProduct({
      title: seed.title,
      body_html: seed.body_html,
      price: seed.price,
      inventory: seed.inventory,
      image_src: seed.image_src,
    });

    console.log(`Created "${seed.title}" (id ${created.id}) with ${seed.inventory} in stock`);
  }

  console.log(`\nSeeded ${PRODUCTS.length} products.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
