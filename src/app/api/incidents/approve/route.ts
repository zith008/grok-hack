import { NextResponse } from 'next/server';
import { recordDecision, type Decision } from '@/lib/dashboard/approvals';
import { applyApprovedFix } from '@/lib/commerce/fix-lifecycle';

export async function POST(req: Request) {
  const { incident_id, decision, approved_by } = await req.json();

  if (!incident_id || (decision !== 'approve' && decision !== 'reject')) {
    return NextResponse.json({ error: 'incident_id and decision required' }, { status: 400 });
  }

  const result = await recordDecision(incident_id, decision as Decision, approved_by ?? 'dashboard');

  // fixes.approved_by being set is A's trigger to apply — see HANDOFF-B.md.
  if (result.ok && decision === 'approve') {
    await applyApprovedFix(incident_id);
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
