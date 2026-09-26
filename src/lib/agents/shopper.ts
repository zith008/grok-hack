import { BLOCKER_IDS } from './blockers';
import { callJson } from './grok';
import type { Persona } from './personas';
import type { BlockerId, PersonaDecision, ProductSnapshot, ShopperAction } from './types';
import { SHOPPER_SYSTEM, shopperUser } from './prompts/shopper';

/** Blockers that are objectively present on the page, ignoring who is looking. */
export function pageBlockers(p: ProductSnapshot): BlockerId[] {
  const hit: BlockerId[] = [];
  if (!p.size_info.trim()) hit.push('size_guide');
  if (!p.materials.trim()) hit.push('materials');
  if (!p.returns_policy.trim()) hit.push('returns');
  if (p.image_urls.length === 0) hit.push('lead_image');
  if (p.market_median_price != null && p.price > p.market_median_price * 1.2) {
    hit.push('price_vs_comps');
  }
  return hit;
}

/** Deterministic stand-in used when there is no Grok key. */
function mockDecision(persona: Persona, p: ProductSnapshot): Omit<PersonaDecision, 'persona'> {
  const present = pageBlockers(p);
  const tooDear =
    p.market_median_price != null && p.price > p.market_median_price * persona.price_tolerance;
  const blockers = tooDear && !present.includes('price_vs_comps')
    ? [...present, 'price_vs_comps' as BlockerId]
    : present;

  const fatal = blockers.filter((b) => persona.dealbreakers.includes(b));
  if (fatal.length > 0) {
    return { action: 'leave', reason: `I could not get past: ${fatal.join(', ')}.`, blockers };
  }
  if (blockers.length > 0) {
    return { action: 'view', reason: 'Interested, but the page left gaps.', blockers };
  }
  return { action: 'add_to_cart', reason: 'The page answered everything I needed.', blockers: [] };
}

/** Runs one persona against one product page. Never throws — a failed shopper is a 'view'. */
export async function runShopper(persona: Persona, p: ProductSnapshot): Promise<PersonaDecision> {
  try {
    const out = await callJson<{ action: string; reason: string; blockers: string[] }>({
      system: SHOPPER_SYSTEM,
      user: shopperUser(persona, p),
      temperature: 0.1,
      mock: () => mockDecision(persona, p),
    });

    const action: ShopperAction = (['view', 'add_to_cart', 'leave'] as const).includes(
      out.action as ShopperAction,
    )
      ? (out.action as ShopperAction)
      : 'view';

    return {
      persona: persona.name,
      action,
      reason: String(out.reason ?? '').slice(0, 160),
      blockers: (out.blockers ?? []).filter((b): b is BlockerId =>
        (BLOCKER_IDS as string[]).includes(b),
      ),
    };
  } catch {
    return { persona: persona.name, action: 'view', reason: 'Shopper timed out.', blockers: [] };
  }
}
