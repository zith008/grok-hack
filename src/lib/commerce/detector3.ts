// Detector 3 (stretch): stock-out risk. Unlike detector 1, this isn't a
// conversion-drop signal — it's inventory running out on a product that's
// actually selling. The fix is a drafted supplier reorder message, sent to
// WhatsApp, that the merchant sends themselves (never auto-applied).
import { CHECKOUT_RATE } from "./detector";
import { recentConversionRate } from "./events";
import { getSupabaseServerClient } from "./supabase";
import { notify } from "../agents/wassist";

const SAMPLE_SIZE = 20;
/** How many days of stock counts as "at risk" for a top seller. */
const DAYS_OF_STOCK_THRESHOLD = 3;
/** How many of the best-selling products we watch for stock-out risk. */
const TOP_N = 5;

export interface StockRiskResult {
  productId: string;
  title: string;
  daysOfStock: number;
  dailyRevenueGbp: number;
  incidentId?: string;
}

function draftReorderMessage(title: string, inventory: number, dailyUnits: number, daysOfStock: number): string {
  return [
    `📦 Autopilot: low stock on ${title}`,
    ``,
    `${inventory} units left, selling ~${dailyUnits.toFixed(1)}/day.`,
    `Projected to sell out in ${daysOfStock.toFixed(1)} days.`,
    ``,
    `Draft reorder: order enough stock for at least 2 weeks of sales (~${Math.ceil(dailyUnits * 14)} units). Reply to your supplier to confirm — Autopilot does not place this order for you.`,
  ].join("\n");
}

/**
 * Ranks products by estimated daily revenue and opens a stock-out incident
 * for any top-5 product with under `DAYS_OF_STOCK_THRESHOLD` days of stock
 * left. Requires `npm run shop` to have been run recently so events exist.
 */
export async function runDetector3(): Promise<StockRiskResult[]> {
  const supabase = getSupabaseServerClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, title, price, inventory");

  if (error) throw new Error(`Supabase products read failed: ${error.message}`);

  const withEstimates = await Promise.all(
    (products ?? []).map(async (p) => {
      const { rate, sampleCount } = await recentConversionRate(p.id, SAMPLE_SIZE);
      const dailyUnits = sampleCount > 0 ? rate * CHECKOUT_RATE * SAMPLE_SIZE : 0;
      const dailyRevenueGbp = dailyUnits * Number(p.price);
      const daysOfStock = dailyUnits > 0 ? p.inventory / dailyUnits : Infinity;
      return { ...p, dailyUnits, dailyRevenueGbp, daysOfStock };
    }),
  );

  const topSellers = withEstimates
    .filter((p) => p.dailyUnits > 0)
    .sort((a, b) => b.dailyRevenueGbp - a.dailyRevenueGbp)
    .slice(0, TOP_N);

  const results: StockRiskResult[] = [];

  for (const p of topSellers) {
    if (p.daysOfStock >= DAYS_OF_STOCK_THRESHOLD) continue;

    const { data: existing } = await supabase
      .from("incidents")
      .select("id")
      .eq("product_id", p.id)
      .eq("detector", "stock_out_risk")
      .in("status", ["open", "fixing"])
      .maybeSingle();

    if (existing) {
      results.push({ productId: p.id, title: p.title, daysOfStock: p.daysOfStock, dailyRevenueGbp: p.dailyRevenueGbp, incidentId: existing.id });
      continue;
    }

    const { data: incident, error: incErr } = await supabase
      .from("incidents")
      .insert({
        product_id: p.id,
        product_title: p.title,
        detector: "stock_out_risk",
        loss_per_day_gbp: Number(p.dailyRevenueGbp.toFixed(2)),
        diagnosis: `Only ${p.inventory} left, selling ~${p.dailyUnits.toFixed(1)}/day — projected to sell out in ${p.daysOfStock.toFixed(1)} days.`,
        status: "open",
      })
      .select("id")
      .single();

    if (incErr || !incident) {
      throw new Error(`Supabase incident insert failed: ${incErr?.message}`);
    }

    const message = draftReorderMessage(p.title, p.inventory, p.dailyUnits, p.daysOfStock);

    await supabase.from("fixes").insert({
      incident_id: incident.id,
      type: "reorder",
      before_json: { inventory: p.inventory },
      after_json: { supplier_message: message },
      autonomy: "draft_only",
    });

    const to = process.env.MERCHANT_WHATSAPP_NUMBER;
    if (to) await notify(to, message);

    results.push({
      productId: p.id,
      title: p.title,
      daysOfStock: p.daysOfStock,
      dailyRevenueGbp: p.dailyRevenueGbp,
      incidentId: incident.id,
    });
  }

  return results;
}
