// Read models over A's tables. Keep in step with the schema in the brief.

import type { BlockerId, FixType, IncidentStatus, ShopperAction } from '../agents/types';

export interface IncidentRow {
  id: string;
  product_id: string;
  product_title: string;
  detector: string;
  loss_per_day_gbp: number;
  diagnosis: string | null;
  blocker: BlockerId | null;
  status: IncidentStatus;
  /** Add-to-cart rate when the incident opened, 0-1. */
  conversion_before: number | null;
  /** Add-to-cart rate after the fix was verified, 0-1. */
  conversion_after: number | null;
  created_at: string;
}

export interface FixRow {
  id: string;
  incident_id: string;
  type: FixType;
  before_json: Record<string, unknown>;
  after_json: Record<string, unknown>;
  autonomy: 'auto' | 'approval';
  approved_by: string | null;
  applied_at: string | null;
}

export interface EventRow {
  id: string;
  product_id: string;
  persona: string;
  type: ShopperAction;
  reason: string | null;
  created_at: string;
}

export const STATUS_STYLE: Record<IncidentStatus, { label: string; cls: string }> = {
  open: { label: 'Detected', cls: 'bg-red-500/15 text-red-300 ring-red-500/30' },
  fixing: { label: 'Fixing', cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  verified: { label: 'Verified fixed', cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  rolled_back: { label: 'Rolled back', cls: 'bg-slate-500/15 text-slate-300 ring-slate-500/30' },
};

/** Money still leaking: only incidents that are not yet resolved. */
export function revenueAtRisk(incidents: IncidentRow[]): number {
  return incidents
    .filter((i) => i.status === 'open' || i.status === 'fixing')
    .reduce((sum, i) => sum + (i.loss_per_day_gbp ?? 0), 0);
}
