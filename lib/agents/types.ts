// Shared interfaces between Person A (commerce backbone) and Person B (agents).
// Agreed at Phase 1. Do not change without telling the other person.

/** One of the five locked buying blockers. See blockers.ts. */
export type BlockerId =
  | 'size_guide'
  | 'materials'
  | 'returns'
  | 'price_vs_comps'
  | 'lead_image';

export type ShopperAction = 'view' | 'add_to_cart' | 'leave';

/** Written by B's persona runner, read by A's detectors. -> events table */
export interface PersonaDecision {
  persona: string;
  action: ShopperAction;
  /** One short sentence, in the persona's own voice. */
  reason: string;
  /** Empty when nothing blocked the purchase. */
  blockers: BlockerId[];
}

/** Written by B's diagnosis prompt, read by A and the dashboard. */
export interface Diagnosis {
  incident_id: string;
  /** Exactly one sentence. */
  cause: string;
  blocker: BlockerId;
}

export type FixType = 'copy' | 'price' | 'reorder';

/** Written by B's fix prompt, applied by A through the Shopify Admin API. */
export interface FixProposal {
  incident_id: string;
  type: FixType;
  /** Partial product shape: title/description for copy, price for price. */
  after_json: Record<string, unknown>;
  needs_approval: boolean;
}

export type IncidentStatus = 'open' | 'fixing' | 'verified' | 'rolled_back';
