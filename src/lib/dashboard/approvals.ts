import { getSupabaseServerClient } from '@/lib/commerce/supabase';

export type Decision = 'approve' | 'reject';

/**
 * Records a decision on the fix that is waiting. Updating fixes.approved_by is
 * the trigger Person A's apply step watches.
 */
export async function recordDecision(
  incidentId: string,
  decision: Decision,
  approvedBy: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getSupabaseServerClient();

  const { data: fix, error: fixErr } = await db
    .from('fixes')
    .select('id')
    .eq('incident_id', incidentId)
    .is('applied_at', null)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fixErr) return { ok: false, error: fixErr.message };
  if (!fix) return { ok: false, error: 'no fix awaiting a decision' };

  if (decision === 'reject') {
    await db.from('fixes').update({ approved_by: `rejected:${approvedBy}` }).eq('id', fix.id);
    await db.from('incidents').update({ status: 'rolled_back' }).eq('id', incidentId);
    return { ok: true };
  }

  await db.from('fixes').update({ approved_by: approvedBy }).eq('id', fix.id);
  await db.from('incidents').update({ status: 'fixing' }).eq('id', incidentId);
  return { ok: true };
}

/** The incident whose fix is currently waiting on a human. */
export async function pendingIncident() {
  const db = getSupabaseServerClient();
  const { data } = await db
    .from('fixes')
    .select('incident_id, incidents(id, product_title, diagnosis, loss_per_day_gbp)')
    .is('applied_at', null)
    .is('approved_by', null)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
