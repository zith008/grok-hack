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

## Open items for the merge

1. **Detector threshold.** Blocker coverage is 5–7 personas out of 20, so breaking one attribute takes conversion to roughly 65% of the store average. Detector 1 fires under 30% of average, so **it will not fire.** Raise the threshold to ~70% of store average, or tell B and B will deepen the dealbreakers.
2. **`src/` or not.** B wrote to `app/`, `lib/`, `components/` at the repo root. If A scaffolds with `--src-dir`, `git mv` them into `src/` at merge.
3. **Dependencies.** B's code needs `@supabase/supabase-js`. Everything else is stdlib `fetch`.
4. **Mock mode.** With no `GROK_API_KEY` the shopper, diagnosis and fix all fall back to deterministic rules, so the loop runs end to end today. With a key they go live. Same interfaces either way.
5. **WhatsApp fallback.** With no Wassist env vars, `notify()` returns `delivered:false` and the dashboard's Approve / Reject buttons carry the demo. Nothing blocks.
