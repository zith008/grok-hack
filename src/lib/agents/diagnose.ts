import { callJson } from './grok';
import { pageBlockers } from './shopper';
import type { BlockerId, Diagnosis, PersonaDecision, ProductSnapshot } from './types';
import { DIAGNOSE_SYSTEM, diagnoseUser } from './prompts/diagnose';
import { BLOCKER_IDS } from './blockers';

const LABEL: Record<BlockerId, string> = {
  size_guide: 'The page has no size or measurement information, so shoppers cannot tell if it fits.',
  materials: 'The page does not say what the item is made of, so shoppers cannot judge quality.',
  returns: 'The returns policy is not stated, so buying feels risky.',
  price_vs_comps: 'The price is well above what comparable items sell for.',
  lead_image: 'There is no usable lead image, so shoppers cannot see what they are buying.',
};

/** Most-cited blocker among shoppers who did not buy, falling back to the page audit. */
function topBlocker(p: ProductSnapshot, decisions: PersonaDecision[]): BlockerId {
  const tally = new Map<BlockerId, number>();
  for (const d of decisions) {
    if (d.action === 'add_to_cart') continue;
    for (const b of d.blockers) tally.set(b, (tally.get(b) ?? 0) + 1);
  }
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? pageBlockers(p)[0] ?? 'lead_image';
}

export async function diagnose(
  incidentId: string,
  p: ProductSnapshot,
  decisions: PersonaDecision[],
): Promise<Diagnosis> {
  const fallback = topBlocker(p, decisions);

  const out = await callJson<{ cause: string; blocker: string }>({
    system: DIAGNOSE_SYSTEM,
    user: diagnoseUser(p, decisions),
    temperature: 0.1,
    mock: () => ({ cause: LABEL[fallback], blocker: fallback }),
  });

  const blocker = (BLOCKER_IDS as string[]).includes(out.blocker)
    ? (out.blocker as BlockerId)
    : fallback;

  return {
    incident_id: incidentId,
    cause: String(out.cause ?? LABEL[blocker]).slice(0, 200),
    blocker,
  };
}
