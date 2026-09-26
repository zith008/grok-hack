import { NextResponse } from 'next/server';
import { runLoop } from '@/lib/commerce/run-loop';

/** Triggered by the dashboard's "Run shoppers now" button. Runs the 20
 * personas across every product (or one, if a shopify_id is given). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const shopifyId: string | undefined = body?.shopify_id;

  try {
    const summaries = await runLoop(shopifyId);
    return NextResponse.json({ ok: true, summaries });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
