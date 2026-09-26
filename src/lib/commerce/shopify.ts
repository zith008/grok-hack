const SHOPIFY_API_VERSION = "2024-10";

function shopifyBaseUrl() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) {
    throw new Error("Missing SHOPIFY_STORE_DOMAIN env var");
  }
  return `https://${domain}/admin/api/${SHOPIFY_API_VERSION}`;
}

function shopifyHeaders() {
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  if (!token) {
    throw new Error("Missing SHOPIFY_ADMIN_TOKEN env var");
  }
  return {
    "X-Shopify-Access-Token": token,
    "Content-Type": "application/json",
  };
}

export type ShopifyProduct = {
  id: number;
  title: string;
  body_html: string;
  variants: { id: number; price: string; inventory_quantity: number }[];
  images: { src: string }[];
};

export async function listProducts(): Promise<ShopifyProduct[]> {
  const res = await fetch(`${shopifyBaseUrl()}/products.json?limit=250`, {
    headers: shopifyHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Shopify listProducts failed: ${res.status} ${await res.text()}`);
  }
  const { products } = (await res.json()) as { products: ShopifyProduct[] };
  return products;
}

export async function updateProduct(
  productId: number,
  fields: { title?: string; body_html?: string },
): Promise<ShopifyProduct> {
  const res = await fetch(`${shopifyBaseUrl()}/products/${productId}.json`, {
    method: "PUT",
    headers: shopifyHeaders(),
    body: JSON.stringify({ product: { id: productId, ...fields } }),
  });
  if (!res.ok) {
    throw new Error(`Shopify updateProduct failed: ${res.status} ${await res.text()}`);
  }
  const { product } = (await res.json()) as { product: ShopifyProduct };
  return product;
}

export async function updateVariantPrice(variantId: number, price: string): Promise<void> {
  const res = await fetch(`${shopifyBaseUrl()}/variants/${variantId}.json`, {
    method: "PUT",
    headers: shopifyHeaders(),
    body: JSON.stringify({ variant: { id: variantId, price } }),
  });
  if (!res.ok) {
    throw new Error(`Shopify updateVariantPrice failed: ${res.status} ${await res.text()}`);
  }
}
