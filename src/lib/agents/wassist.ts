// WhatsApp alerts and approvals through Wassist.
//
// The exact endpoint is confirmed on the day in the #wassist Discord channel;
// only WASSIST_API_URL / WASSIST_API_KEY should need changing. If WhatsApp is
// not working by the Phase 1 cutoff, leave the env vars unset: notify() reports
// delivered:false and the dashboard's Approve / Reject buttons carry the demo.

import type { Diagnosis, FixProposal, ProductSnapshot } from './types';

export const WHATSAPP_ENABLED = Boolean(process.env.WASSIST_API_URL && process.env.WASSIST_API_KEY);

export function alertText(
  p: ProductSnapshot,
  d: Diagnosis,
  fix: FixProposal,
  lossPerDayGbp: number,
): string {
  const change =
    fix.type === 'price'
      ? `Drop price to ${p.currency}${Number(fix.after_json.price).toFixed(2)}`
      : `Rewrite the listing copy`;

  return [
    `⚠️ Autopilot: ${p.title}`,
    ``,
    `Losing about £${lossPerDayGbp.toFixed(0)}/day.`,
    `Cause: ${d.cause}`,
    ``,
    `Proposed fix: ${change}`,
    ``,
    `Reply APPROVE, REJECT, or WHY.`,
  ].join('\n');
}

export interface NotifyResult {
  delivered: boolean;
  error?: string;
}

export async function notify(to: string, body: string): Promise<NotifyResult> {
  if (!WHATSAPP_ENABLED) return { delivered: false, error: 'wassist not configured' };
  try {
    const res = await fetch(`${process.env.WASSIST_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.WASSIST_API_KEY}`,
      },
      body: JSON.stringify({ to, text: body }),
    });
    if (!res.ok) return { delivered: false, error: `wassist ${res.status}` };
    return { delivered: true };
  } catch (e) {
    return { delivered: false, error: String(e) };
  }
}

export type ApprovalIntent = 'approve' | 'reject' | 'why' | 'unknown';

/** Parses a free-text WhatsApp reply. Tolerant of case, emoji and stray words. */
export function parseReply(text: string): ApprovalIntent {
  const t = text.toLowerCase();
  if (/\b(approve|approved|yes|do it|go ahead|ok|okay|y)\b/.test(t)) return 'approve';
  if (/\b(reject|rejected|no|stop|cancel|n)\b/.test(t)) return 'reject';
  if (/\b(why|explain|details|how come)\b/.test(t)) return 'why';
  return 'unknown';
}
