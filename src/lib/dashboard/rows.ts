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
  autonomy: 'automatic' | 'needs_approval' | 'draft_only';
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
  open: { label: 'Detected', cls: 'bg-critical-bg text-critical ring-critical-ring' },
  fixing: { label: 'Fixing', cls: 'bg-warn-bg text-warn ring-warn-ring' },
  verified: { label: 'Verified fixed', cls: 'bg-ok-bg text-ok ring-ok-ring' },
  rolled_back: { label: 'Rolled back', cls: 'bg-neutral-status-bg text-neutral-status ring-neutral-status-ring' },
};

/** Money still leaking: only incidents that are not yet resolved. */
export function revenueAtRisk(incidents: IncidentRow[]): number {
  return incidents
    .filter((i) => i.status === 'open' || i.status === 'fixing')
    .reduce((sum, i) => sum + (i.loss_per_day_gbp ?? 0), 0);
}
