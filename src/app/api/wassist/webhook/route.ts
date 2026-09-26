import { NextResponse } from 'next/server';
import { notifyConversation, parseReply, verifySignature } from '@/lib/agents/wassist';
import { pendingIncident, recordDecision } from '@/lib/dashboard/approvals';
import { applyApprovedFix } from '@/lib/commerce/fix-lifecycle';

/**
 * Inbound WhatsApp replies from Wassist. APPROVE / REJECT / WHY.
 *
 * Payload shape (docs.wassist.app/concepts/webhooks, message.received):
 *   { event, from, conversationId, message: { id, body, ... } }
 *
 * Wassist retries on 5xx and gives up on 4xx, so anything we cannot act on
 * returns 200 — a merchant typo must not queue three retries.
 */

/** Delivery ids already handled, so a retry does not approve the same fix twice. */
const seen = new Set<string>();

export async function POST(req: Request) {
  const raw = await req.text();

  if (!(await verifySignature(req.headers.get('x-wassist-signature'), raw))) {
    return NextResponse.json({ ok: false, error: 'bad signature' }, { status: 400 });
  }

  const delivery = req.headers.get('x-wassist-delivery');
  if (delivery) {
    if (seen.has(delivery)) return NextResponse.json({ ok: true, duplicate: true });
    seen.add(delivery);
  }

  const body = JSON.parse(raw || '{}');
  const text: string = String(body.message?.body ?? body.text ?? '');
  const conversationId: string | undefined = body.conversationId;

  const say = (msg: string) =>
    conversationId ? notifyConversation(conversationId, msg) : Promise.resolve({ delivered: false });

  const intent = parseReply(text);
  const pending = await pendingIncident();

  if (!pending) {
    await say('Nothing is waiting for approval right now.');
    return NextResponse.json({ ok: true, intent, handled: false });
  }

  // Supabase returns the joined row as an array or an object depending on the join.
  const inc = (Array.isArray(pending.incidents) ? pending.incidents[0] : pending.incidents) as
    | { product_title: string; diagnosis: string | null; loss_per_day_gbp: number }
    | undefined;

  if (intent === 'why') {
    await say(
      `${inc?.product_title ?? 'This product'}: ${inc?.diagnosis ?? 'diagnosis pending'}\n\nEstimated £${Math.round(inc?.loss_per_day_gbp ?? 0)}/day. Reply APPROVE or REJECT.`,
    );
    return NextResponse.json({ ok: true, intent, handled: true });
  }

  if (intent === 'approve' || intent === 'reject') {
    const from: string = String(body.from ?? 'whatsapp');
    const result = await recordDecision(pending.incident_id, intent, from);
    if (result.ok && intent === 'approve') {
      await applyApprovedFix(pending.incident_id);
    }
    await say(
      result.ok
        ? intent === 'approve'
          ? 'Approved. Applying the fix and re-testing now.'
          : 'Rejected. Rolling back and leaving the page as it was.'
        : `Could not record that: ${result.error}`,
    );
    return NextResponse.json({ ok: result.ok, intent, handled: true });
  }

  await say('Reply APPROVE, REJECT, or WHY.');
  return NextResponse.json({ ok: true, intent, handled: false });
}
