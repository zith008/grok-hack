import { NextResponse } from 'next/server';
import { notify, parseReply } from '@/lib/agents/wassist';
import { pendingIncident, recordDecision } from '@/lib/dashboard/approvals';

/** Inbound WhatsApp replies from Wassist. APPROVE / REJECT / WHY. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text: string = body.text ?? body.message ?? '';
  const from: string = body.from ?? body.sender ?? 'whatsapp';

  const intent = parseReply(text);
  const pending = await pendingIncident();

  if (!pending) {
    await notify(from, 'Nothing is waiting for approval right now.');
    return NextResponse.json({ ok: true, intent, handled: false });
  }

  // Supabase returns the joined row as an array or an object depending on the join.
  const inc = (Array.isArray(pending.incidents) ? pending.incidents[0] : pending.incidents) as
    | { product_title: string; diagnosis: string | null; loss_per_day_gbp: number }
    | undefined;

  if (intent === 'why') {
    await notify(
      from,
      `${inc?.product_title ?? 'This product'}: ${inc?.diagnosis ?? 'diagnosis pending'}\n\nEstimated £${Math.round(inc?.loss_per_day_gbp ?? 0)}/day. Reply APPROVE or REJECT.`,
    );
    return NextResponse.json({ ok: true, intent, handled: true });
  }

  if (intent === 'approve' || intent === 'reject') {
    const result = await recordDecision(pending.incident_id, intent, from);
    await notify(
      from,
      result.ok
        ? intent === 'approve'
          ? 'Approved. Applying the fix and re-testing now.'
          : 'Rejected. Rolling back and leaving the page as it was.'
        : `Could not record that: ${result.error}`,
    );
    return NextResponse.json({ ok: result.ok, intent, handled: true });
  }

  await notify(from, 'Reply APPROVE, REJECT, or WHY.');
  return NextResponse.json({ ok: true, intent, handled: false });
}
