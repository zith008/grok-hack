/**
 * Phase 2, Person A: run the 20 shopper personas against one or every
 * product, write their decisions to `events`, and run detector 1.
 *
 * Usage:
 *   npm run shop -- --all                 # every product in the store
 *   npm run shop -- --product <shopify_id> # a single product, e.g. after Break
 */
import { runLoop } from "@/lib/commerce/run-loop";

async function main() {
  const args = process.argv.slice(2);
  const productIdx = args.indexOf("--product");
  const shopifyId = productIdx >= 0 ? args[productIdx + 1] : undefined;

  const summaries = await runLoop(shopifyId);

  if (summaries.length === 0) {
    console.log("No matching products — sync the store first with npm run sync:products.");
    return;
  }

  for (const s of summaries) {
    console.log(
      `${s.title}: ${(s.cartRate * 100).toFixed(0)}% added to cart [${s.model}]`,
    );
    if (s.incidentOpened) {
      console.log(
        `  -> incident opened (${s.incidentId}): £${s.lossPerDayGbp}/day` +
          (s.needsApproval
            ? ` — fix proposed, waiting on approval`
            : ` — fix applied automatically, verifying...`),
      );
    } else if (s.incidentId) {
      console.log(`  -> already has an open incident (${s.incidentId})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
