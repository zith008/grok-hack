/**
 * Phase 4 (stretch), Person A: stock-out risk detector. Run this after
 * `npm run shop -- --all` so recent conversion data exists to estimate
 * daily sales from.
 *
 * Usage: npm run detect:stock
 */
import { runDetector3 } from "@/lib/commerce/detector3";

async function main() {
  const results = await runDetector3();

  if (results.length === 0) {
    console.log("No top sellers under the stock-out threshold.");
    return;
  }

  for (const r of results) {
    console.log(
      `${r.title}: ${r.daysOfStock.toFixed(1)} days of stock left, £${r.dailyRevenueGbp.toFixed(0)}/day at risk` +
        (r.incidentId ? ` -> incident ${r.incidentId}` : ""),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
