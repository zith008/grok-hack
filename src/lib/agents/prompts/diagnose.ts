import type { PersonaDecision, ProductSnapshot } from '../types';

export const DIAGNOSE_SYSTEM = `You are a retail analyst. Shoppers looked at one product page and most did not buy. Work out the single biggest reason.

Pick exactly one blocker id from: size_guide, materials, returns, price_vs_comps, lead_image.
Write one sentence a shop owner would understand. No preamble, no advice.

Return JSON only: {"cause": "...", "blocker": "..."}`;

export function diagnoseUser(p: ProductSnapshot, decisions: PersonaDecision[]): string {
  const left = decisions.filter((d) => d.action !== 'add_to_cart');
  const rate = decisions.length
    ? Math.round((decisions.filter((d) => d.action === 'add_to_cart').length / decisions.length) * 100)
    : 0;

  return `Product: ${p.title} — ${p.currency}${p.price.toFixed(2)}
Add-to-cart rate: ${rate}% of ${decisions.length} shoppers.

What the page shows:
- Size information: ${p.size_info || 'NOT SHOWN'}
- Materials: ${p.materials || 'NOT SHOWN'}
- Returns: ${p.returns_policy || 'NOT SHOWN'}
- Images: ${p.image_urls.length}
${p.market_median_price != null ? `- Comparable items sell around ${p.currency}${p.market_median_price.toFixed(2)}` : ''}

What the shoppers who did not buy said:
${left.map((d) => `- ${d.persona}: "${d.reason}"`).join('\n') || '- (nobody left)'}`;
}
