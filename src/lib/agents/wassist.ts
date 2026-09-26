// WhatsApp alerts and approvals through Wassist.
//
// Verified against the live API on the day (26 Sep 2026):
//   base        https://backend.wassist.app/api/v1
//   auth        X-API-Key: <key>
//   send        POST /conversations/{id}/messages/  {type:'text', text:{body}}
//   start       POST /conversations/  {toNumber, fromNumber, agentId}
//
// A conversation must be `active` (inside WhatsApp's 24-hour window) before a
// plain text message is allowed, which is why the merchant sends /connect once
// at the start of the demo.
//
// If any of this is unset or fails, notify() reports delivered:false and the
// dashboard's Approve / Reject buttons carry the demo unchanged.

import type { Diagnosis, FixProposal, ProductSnapshot } from './types';

const BASE = process.env.WASSIST_API_URL ?? 'https://backend.wassist.app/api/v1';
const KEY = process.env.WASSIST_API_KEY;
const AGENT_ID = process.env.WASSIST_AGENT_ID;
/** The Wassist sandbox number the agent answers on. */
const FROM = process.env.WASSIST_FROM_NUMBER;

export const WHATSAPP_ENABLED = Boolean(KEY && AGENT_ID);

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

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-api-key': KEY as string,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`wassist ${res.status} ${path}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

interface Conversation {
  id: string;
  active?: boolean;
  contact?: { number?: string };
}

/**
 * The conversation the merchant opened with /connect. Cached for the process —
 * the demo only ever talks to one person.
 */
let cached: string | null = process.env.WASSIST_CONVERSATION_ID ?? null;

export async function conversationFor(toNumber: string): Promise<string> {
  if (cached) return cached;

  const digits = toNumber.replace(/\D/g, '');
  const list = await api<{ results?: Conversation[] } | Conversation[]>('/conversations/');
  const all = Array.isArray(list) ? list : (list.results ?? []);
  const found = all.find((c) => (c.contact?.number ?? '').replace(/\D/g, '').endsWith(digits));
  if (found) return (cached = found.id);

  const created = await api<Conversation>('/conversations/', {
    method: 'POST',
    body: JSON.stringify({ toNumber: digits, fromNumber: FROM, agentId: AGENT_ID }),
  });
  return (cached = created.id);
}

export interface NotifyResult {
  delivered: boolean;
  error?: string;
}

/** Send into a conversation we already know the id of (the webhook gives us one). */
export async function notifyConversation(
  conversationId: string,
  body: string,
): Promise<NotifyResult> {
  if (!WHATSAPP_ENABLED) return { delivered: false, error: 'wassist not configured' };
  try {
    await api(`/conversations/${conversationId}/messages/`, {
      method: 'POST',
      body: JSON.stringify({ type: 'text', text: { body } }),
    });
    return { delivered: true };
  } catch (e) {
    return { delivered: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function notify(to: string, body: string): Promise<NotifyResult> {
  if (!WHATSAPP_ENABLED) return { delivered: false, error: 'wassist not configured' };
  try {
    return await notifyConversation(await conversationFor(to), body);
  } catch (e) {
    return { delivered: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Stripe-style HMAC check: `t=<unix>,v1=<hex sha256 of "<t>.<raw body>">`.
 * Returns true when no secret is configured, so the demo still works if the
 * dashboard webhook is created without one.
 */
export async function verifySignature(header: string | null, raw: string): Promise<boolean> {
  const secret = process.env.WASSIST_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;

  const { createHmac, timingSafeEqual } = await import('node:crypto');
  const expected = createHmac('sha256', secret).update(`${parts.t}.${raw}`).digest('hex');
  const a = Buffer.from(parts.v1, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
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
