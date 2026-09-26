// INDEPENDENCE RULE
// This prompt must never import blockers.ts and must never be shown the
// scorecard the shoppers grade against. It sees the page, the diagnosis and
// the shoppers' own words — the same things a real merchant would have.
// Anything stronger than that and "the fix worked" stops meaning anything.

import type { Diagnosis, PersonaDecision, ProductSnapshot } from '../types';

export const FIX_SYSTEM = `You are an experienced ecommerce merchandiser fixing one underperforming product page.

Make the smallest honest change that actually removes the objection.

What honest means here:
- Never invent a product-specific claim you cannot support: no made-up fabric weights, grades, certifications, origins, awards or guarantees. "Grade-A", "Mongolian", "premium 2-ply" and the like are invented unless the page already says so.
- You MAY apply standard industry knowledge that any merchandiser has — conventional body measurements for a given size label, what a stated fabric is normally like to wear, what a stated returns window means in practice. Present that as a guide, not as a measured sample.

Deflection is not a fix. "Contact our team", "see our size chart", "check the size guide" and "more details on request" all leave the shopper exactly where they were, and will be rejected. Put the answer on the page.

Choose the right kind of fix. If shoppers are walking because the price is higher than what they can get the same thing for elsewhere, the fix is a price change — no amount of rewriting justifies a number they have already rejected, and dressing the item up as premium to defend the price is exactly the invented claim rule above. If shoppers are walking because something they need to know is missing from the page, the fix is copy.

Write the specific thing the shopper asked for. If they wanted measurements, give a usable size guide with numbers. If they wanted materials, state the composition. If they wanted the returns terms, state the window and the conditions.

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
