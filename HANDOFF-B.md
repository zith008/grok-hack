# Person B → Person A

Everything B owns is on the `person-b` branch and does not touch A's files.

## What A must provide

| Thing | Shape | Used by |
| --- | --- | --- |
| `ProductSnapshot` | `lib/agents/types.ts` — includes `size_info`, `materials`, `returns_policy`, `image_urls`, `market_median_price` as separate fields, not buried in the description | every prompt |
| `events` rows | `persona`, `type`, `reason`, `product_id`, `created_at` | shopper feed |
| `incidents` rows | plus `product_title`, `blocker`, `conversion_before`, `conversion_after` — three columns beyond the brief's schema, needed by the console | incident cards |
| `fixes` rows | `type`, `before_json`, `after_json`, `autonomy`, `approved_by`, `applied_at` | before/after diff |
| Realtime | enabled on `incidents`, `fixes`, `events` | the whole console |
| Env | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | dashboard + routes |

## What A calls

```ts
import { PERSONAS } from '@/lib/agents/personas';
import { runShopper } from '@/lib/agents/shopper';
import { diagnose } from '@/lib/agents/diagnose';
import { proposeFix } from '@/lib/agents/fix';
import { alertText, notify } from '@/lib/agents/wassist';

const decisions = await Promise.all(PERSONAS.map((p) => runShopper(p, snapshot)));
const d = await diagnose(incidentId, snapshot, decisions);
const fix = await proposeFix(incidentId, snapshot, d, decisions);
if (fix.needs_approval) await notify(MERCHANT_PHONE, alertText(snapshot, d, fix, lossPerDay));
else applyFix(fix);
```

Approval lands as `fixes.approved_by` being set — that is A's trigger to apply.

## Merge status — resolved

- B's code now lives under `src/` and uses the `@/*` alias. Builds clean.
- Autonomy vocabulary aligned to A's schema: `automatic` / `needs_approval` / `draft_only`.
- `settings.margin_floor_pct` is read as whole percent (20 = 20%), matching the seed row.
- B's duplicate server Supabase client deleted; everything uses `getSupabaseServerClient`.
- `supabase/migrations/0002_dashboard_columns.sql` adds `incidents.product_title`,
  `incidents.blocker`, `incidents.conversion_before/after`, `fixes.type`, enables
  realtime on the three tables, and grants anon select (realtime respects RLS).
- `src/lib/agents/snapshot.ts` converts a `products` row into a `ProductSnapshot`,
  parsing `Size:` / `Materials:` / `Returns:` lines out of the Shopify description.

## Still open

1. **Run migration 0002** against the Supabase project before testing the console.
2. **Seed listings must use the labelled format** the parser expects:
   `<p><strong>Size:</strong> chest 54cm pit to pit, length 71cm</p>` and the same
   for `Materials:` and `Returns:`. The Break button removes one of those lines.
3. **Detector 1 threshold.** Blocker coverage is 5-7 personas of 20, so breaking one
   attribute takes conversion to roughly 65% of store average. A threshold of
   "under 30% of store average" will not fire. Use ~70%.
4. **Incident writes.** Whoever opens the incident must populate `product_title`,
   `blocker` and `conversion_before`, and set `conversion_after` on verify.
5. **Copy fixes must round-trip through `toBodyHtml`**, or applying a fix will wipe
   the labelled Size / Materials / Returns lines.
