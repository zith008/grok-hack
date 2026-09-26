// Turns a synced products row into the ProductSnapshot every prompt expects.
//
// Shopify has no first-class size / materials / returns fields, so the seed
// listings carry them as labelled lines in the description:
//
//   <p><strong>Size:</strong> chest 54cm pit to pit, length 71cm</p>
//   <p><strong>Materials:</strong> 100% cotton</p>
//   <p><strong>Returns:</strong> 30 days, we cover return postage</p>
//
// The Break button removes one of those lines, which is exactly the mistake a
// real merchant makes. Everything left over is the shopper-facing description.

import type { ProductSnapshot } from './types';

export interface ShopifyProductJson {
  id: number;
  title: string;
  body_html: string;
  variants: { id: number; price: string; inventory_quantity: number }[];
  images: { src: string }[];
}

export interface ProductRow {
  id: string;
  shopify_id: string;
  title: string;
  price: number | string;
  cost: number | string | null;
  inventory: number;
  snapshot_json: ShopifyProductJson | Record<string, unknown>;
}

const LABELS: Record<'size_info' | 'materials' | 'returns_policy', RegExp> = {
  size_info: /\b(size|sizing|measurements?|fit)\b/i,
  materials: /\b(materials?|fabric|composition|made of)\b/i,
  returns_policy: /\b(returns?|refunds?|exchange)\b/i,
};

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"');
}

export interface ParsedDescription {
  description: string;
  size_info: string;
  materials: string;
  returns_policy: string;
}

/** Splits labelled lines out of a description. Absent label means empty string. */
export function parseDescription(bodyHtml: string): ParsedDescription {
  const lines = stripTags(bodyHtml ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const out: ParsedDescription = {
    description: '',
    size_info: '',
    materials: '',
    returns_policy: '',
  };
  const rest: string[] = [];

  for (const line of lines) {
    const split = line.indexOf(':');
    const label = split > 0 && split <= 24 ? line.slice(0, split) : '';
    const value = split > 0 ? line.slice(split + 1).trim() : '';

    const key = label
      ? (Object.keys(LABELS) as (keyof typeof LABELS)[]).find((k) => LABELS[k].test(label))
      : undefined;

    if (key && value && !out[key]) out[key] = value;
    else rest.push(line);
  }

  out.description = rest.join('\n');
  return out;
}

export function toSnapshot(
  row: ProductRow,
  opts: { currency?: string; market_median_price?: number | null } = {},
): ProductSnapshot {
  const raw = (row.snapshot_json ?? {}) as Partial<ShopifyProductJson>;
  const parsed = parseDescription(raw.body_html ?? '');

  return {
    shopify_id: row.shopify_id,
    title: row.title,
    description: parsed.description,
    price: Number(row.price),
    currency: opts.currency ?? '£',
    size_info: parsed.size_info,
    materials: parsed.materials,
    returns_policy: parsed.returns_policy,
    image_urls: (raw.images ?? []).map((i) => i.src).filter(Boolean),
    inventory: row.inventory,
    market_median_price: opts.market_median_price ?? null,
  };
}

/** Rebuilds a Shopify body_html from a snapshot, for applying a copy fix. */
export function toBodyHtml(description: string, parts: Omit<ParsedDescription, 'description'>): string {
  const blocks = [
    ...description.split('\n').filter(Boolean).map((l) => `<p>${l}</p>`),
    parts.size_info ? `<p><strong>Size:</strong> ${parts.size_info}</p>` : '',
    parts.materials ? `<p><strong>Materials:</strong> ${parts.materials}</p>` : '',
    parts.returns_policy ? `<p><strong>Returns:</strong> ${parts.returns_policy}</p>` : '',
  ].filter(Boolean);
  return blocks.join('\n');
}
