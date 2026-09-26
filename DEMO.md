# Demo script, 60-second version, judge Q&A

Person A drives the laptop. Person B presents and holds the phone.

## 3-minute demo

| Time | Screen | Say |
| --- | --- | --- |
| 0:00–0:20 | Dashboard, healthy, £0 at risk | "Small merchants lose money silently. A missing size guide costs hundreds before anyone notices. Autopilot is incident response for revenue." |
| 0:20–0:50 | Shopper feed streaming | "Twenty AI shoppers are reading our real Shopify store right now and deciding whether to buy. Each one is graded against a checklist of buying blockers we locked in a git commit this morning." |
| 0:50–1:30 | Press **Break**; feed turns red; incident fires with £/day | "I just made the mistake merchants make every day — I removed the size information. Autopilot caught it and costed it: missing carts × order value." |
| 1:30–2:10 | Diagnosis appears, phone buzzes, approve on WhatsApp, Shopify updates | "It says why, proposes the fix, and asks me. One tap on WhatsApp." |
| 2:10–2:45 | Shoppers re-run, conversion recovers, before/after diff, incident goes green, counter drops to £0 | "It doesn't just fix. It re-tests and proves the fix worked — or rolls it back. Here's exactly what it changed." |
| 2:45–3:00 | — | "Subscription, or a share of the revenue we verifiably recover. Marketplaces run it across every seller." |

**Rules for the run:** never say "as you can see". Point at the number. If something hangs, keep talking and cut to the backup video.

## 60 seconds, for the table visit

"Merchants lose money to broken product pages and never find out. We run AI shoppers against the real store, detect the drop, diagnose it, fix it in Shopify with one WhatsApp approval, then re-test and prove it worked or roll it back. Everyone else here is building the buyer's bot. We built the merchant's."

## Judge Q&A

| Question | Answer |
| --- | --- |
| **"Isn't this AI grading AI?"** | The scorecard was written and committed before the fix prompt existed — `git log lib/agents/blockers.ts`. The fixer never imports it and only sees the page, the diagnosis and the shoppers' own words. In production the verification is real PostHog traffic; the personas are the pre-flight test. |
| "Your break is staged." | We break it the way merchants actually do: remove the size info, or price 25% above market. Subtle enough that the owner wouldn't notice. That's the point. |
| "How is this different from Shopify Sidekick?" | Sidekick waits to be asked. Autopilot notices on its own, runs around the clock, and proves each fix or rolls it back. And it works for marketplace sellers, not just Shopify stores. |
| "Where does the £ come from?" | Missing carts per day × average order value × checkout rate. In production, real PostHog numbers. |
| "Do AI shoppers behave like real people?" | They don't need to. Like automated tests for code, they catch known blockers before real customers hit them. |
| "What if the agent makes a bad change?" | Autonomy levels per fix type, a hard margin floor the price fix is clamped to in code, every before/after stored, and automatic rollback when conversion doesn't improve. |
| "Who pays?" | Merchants monthly or on recovered revenue. Marketplaces licence it across all sellers — better listings, more commission. |
| "Why won't Shopify build it?" | They may, for their own stores. Our wedge is marketplaces and multi-channel sellers, plus a growing record of which fixes actually work. |
| "Why agents, not rules?" | Detection is rules, on purpose, because it has to be reliable. Working out *why* a page fails and writing the right fix needs reasoning across page, data and market. That's where the agent earns its place. |
| "What works right now?" | The full loop on a real Shopify dev store: detect, diagnose, WhatsApp approval, Shopify write, re-test, verified or rolled back. |

## Final check, 16:25

- [ ] Store reset to healthy, £0 on screen
- [ ] Phone charged, WhatsApp open, on the demo number
- [ ] Backup video ready to play
- [ ] Both of us can answer "isn't this AI grading AI?" without looking
