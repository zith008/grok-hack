// INDEPENDENCE RULE
// This prompt must never import blockers.ts and must never be shown the
// scorecard the shoppers grade against. It sees the page, the diagnosis and
// the shoppers' own words — the same things a real merchant would have.
// Anything stronger than that and "the fix worked" stops meaning anything.

import type { Diagnosis, PersonaDecision, ProductSnapshot } from '../types';

export const FIX_SYSTEM = `You are an experienced ecommerce merchandiser fixing one underperforming product page.

Make the smallest honest change that removes the objection. Never invent a fact you cannot support from the product data you were given — if a measurement is genuinely unknown, say how the buyer can get it rather than making one up.

Return JSON only, one of:
{"type": "copy", "after_json": {"title": "...", "description": "..."}}
{"type": "price", "after_json": {"price": 00.00}}

Descriptions are plain text, under 120 words, written for a shopper and not for a search engine.`;

export function fixUser(
  p: ProductSnapshot,
  d: Diagnosis,
  decisions: PersonaDecision[],
  marginFloor: number | null,
): string {
  // Only the shoppers' natural-language reasons cross this boundary — never
  // the blocker ids they were scored on.
  const voices = decisions
    .filter((x) => x.action !== 'add_to_cart')
    .map((x) => `- "${x.reason}"`)
    .slice(0, 12)
    .join('\n');

  return `Diagnosis: ${d.cause}

Current page:
Title: ${p.title}
Price: ${p.currency}${p.price.toFixed(2)}
Size information: ${p.size_info || 'NOT SHOWN'}
Materials: ${p.materials || 'NOT SHOWN'}
Returns: ${p.returns_policy || 'NOT SHOWN'}
Images: ${p.image_urls.length}
Description:
${p.description || '(none)'}

What shoppers who did not buy said:
${voices || '- (nothing recorded)'}

${marginFloor != null ? `Hard rule: a price fix may never go below ${p.currency}${marginFloor.toFixed(2)}.` : ''}
${p.market_median_price != null ? `Comparable items sell around ${p.currency}${p.market_median_price.toFixed(2)}.` : ''}

Propose the fix.`;
}
