import { callJson } from './grok';
import type { Diagnosis, FixProposal, FixType, PersonaDecision, ProductSnapshot } from './types';
import { FIX_SYSTEM, fixUser } from './prompts/fix';

/** Matches the autonomy vocabulary in supabase/migrations/0001_init.sql. */
export type Autonomy = 'automatic' | 'needs_approval' | 'draft_only';

export interface AutonomySettings {
  copy: Autonomy;
  price: Autonomy;
  /** Whole percent, as stored in settings.margin_floor_pct. 20 means 20%. */
  margin_floor_pct: number;
  /** Unit cost from the products table, when known. */
  cost?: number | null;
}

export const DEFAULT_AUTONOMY: AutonomySettings = {
  copy: 'automatic',
  price: 'needs_approval',
  margin_floor_pct: 20,
};

function marginFloor(p: ProductSnapshot, s: AutonomySettings): number | null {
  if (s.cost == null) return null;
  const pct = Math.min(Math.max(s.margin_floor_pct, 0), 95) / 100;
  return s.cost / (1 - pct);
}

/**
 * Rule-based fallback used only when there is no Grok key. It switches on the
 * diagnosis, not on the shoppers' scorecard. On stage the live Grok path runs.
 */
function mockFix(p: ProductSnapshot, d: Diagnosis, floor: number | null) {
  if (d.blocker === 'price_vs_comps' && p.market_median_price != null) {
    const target = Math.max(p.market_median_price, floor ?? 0);
    return { type: 'price' as FixType, after_json: { price: Number(target.toFixed(2)) } };
  }
  const addition: Record<string, string> = {
    size_guide:
      'Measurements: chest 54cm pit to pit, length 71cm, sleeve 62cm — measured flat. Compare against a garment you already own.',
    materials: 'Materials: see the care label in the final image; message us and we will confirm the exact composition before you buy.',
    returns: 'Returns: 30 days, unworn, we cover return postage on anything that arrives not as described.',
    lead_image: 'Full photo set available on request — message us and we will send more angles today.',
    price_vs_comps: 'Priced to move. Message us if you are buying more than one.',
  };
  return {
    type: 'copy' as FixType,
    after_json: {
      title: p.title,
      description: `${p.description}\n\n${addition[d.blocker]}`.trim(),
    },
  };
}

/** Clamps a proposed price to the margin floor so the agent can never sell at a loss. */
function clampPrice(after: Record<string, unknown>, floor: number | null) {
  if (floor == null || typeof after.price !== 'number') return after;
  return { ...after, price: Number(Math.max(after.price, floor).toFixed(2)) };
}

export async function proposeFix(
  incidentId: string,
  p: ProductSnapshot,
  d: Diagnosis,
  decisions: PersonaDecision[],
  settings: AutonomySettings = DEFAULT_AUTONOMY,
): Promise<FixProposal> {
  const floor = marginFloor(p, settings);

  const out = await callJson<{ type: string; after_json: Record<string, unknown> }>({
    system: FIX_SYSTEM,
    user: fixUser(p, d, decisions, floor),
    temperature: 0.3,
    mock: () => mockFix(p, d, floor),
  });

  const type: FixType = out.type === 'price' ? 'price' : out.type === 'reorder' ? 'reorder' : 'copy';
  const after_json = type === 'price' ? clampPrice(out.after_json ?? {}, floor) : (out.after_json ?? {});

  return {
    incident_id: incidentId,
    type,
    after_json,
    needs_approval:
      (type === 'price' ? settings.price : settings.copy) !== 'automatic',
  };
}
