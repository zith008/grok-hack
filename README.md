# Autopilot

**Sentry for revenue.** A store loses money the moment a product page breaks, and nobody notices for weeks. Autopilot notices in about sixty seconds, fixes it on the live store, proves the fix worked — and rolls itself back when it didn't.

Built at the Grok Bot Commerce Hackathon, London, 26 September 2026.

```
detect  →  diagnose  →  fix  →  verify  →  roll back
```

---

## The problem

A merchant edits a listing and drops the sizing line. Add-to-cart quietly falls off a cliff. Nothing alerts, because no system anywhere knows what that page is *supposed* to convert at. Weeks later someone notices the number, and every day in between is revenue that was never recoverable.

Analytics can tell you conversion fell. It cannot tell you *why*, and it cannot fix it.

## How Autopilot works

**Twenty AI shoppers read the real product page.** Each is a distinct person — a student comparing prices, someone between sizes who has been burned by a bad fit, a gift buyer who needs it returnable. Each decides view, add to cart, or leave, and says why in their own words.

**A detector opens an incident** when add-to-cart falls below 70% of the store average, with an estimated £/day loss attached.

**A diagnosis reads their reasons** and names the single cause in one sentence.

**A fix agent writes the change and pushes it to Shopify.** Missing measurements get real measurements. An uncompetitive price gets repriced against live market comps.

**The same twenty shoppers re-read the page.** Recovered, the incident is marked verified. Not recovered, the change is reverted and the incident is marked rolled back. No human in that loop.

### Autonomy has a ceiling

| Fix type | Behaviour |
| --- | --- |
| Copy | Applied automatically |
| Price | Stops and asks the merchant on WhatsApp — never below the margin floor |
| Reorder | Drafted only; the merchant sends it themselves |

Price touches margin, and no merchant hands that to an agent unsupervised. So the agent texts you, you reply `APPROVE` from your phone, and it proceeds. That boundary is the product, not a limitation of it.

---

## Isn't this AI grading AI?

It caught itself being wrong, on the record.

Asked to fix a page with no sizing information, the fix agent wrote *"Sizing: please contact our customer service team to request a detailed size chart."* The shoppers refused it for exactly the same reason as before, conversion stayed flat, and the system reverted its own change and marked the incident `rolled_back`.

Three things make the verdict mean something:

- **The verifier never sees the fix agent's reasoning.** Only the changed page.
- **The fix agent never sees the scorecard.** It is given the diagnosis and the shoppers' own sentences — the same things a real merchant would have. It has no access to the blocker list it is graded against.
- **The blocker checklist was frozen before any fix prompt existed** (`src/lib/agents/blockers.ts`, committed `f4bc31b`).

## Prices come from the real market

Detector 2 needs to know what an item actually sells for. Tavily searches the live web, and three defences turn noisy search results into a usable number:

- **Two queries pooled, sterling only, quartiles trimmed.** One search for "cashmere scarf price" leans designer and returns a £585 median against a high street near £119.
- **Live readings corroborate rather than override.** Repeat calls for the same jumper came back £60, £75, £79. A reading within 25% of the captured median wins; outside that, the captured median stands — otherwise a healthy page flags itself on one run and clears on the next.
- **Shelf prices sit 10% under the median.** Level with it, ordinary search noise is enough to make a healthy page look overpriced.

---

## Stack

| | |
| --- | --- |
| **Shopify** Admin API | The real store. Pages are read from it and fixes are written back to it. |
| **Supabase** Postgres + realtime | Products, events, incidents, fixes, settings. The console updates live. |
| **OpenRouter** | Serves the shopper, diagnosis and fix agents. |
| **Tavily** | Live market price comparables. |
| **Wassist** | WhatsApp alerts and inbound approvals. |
| **Next.js 16** App Router, React 19, Tailwind v4 | The incident console. |

## Running it

```bash
nvm use 22
npm install
cp .env.example .env.local   # fill in the keys below
npm run dev
```

Open [localhost:3000/dashboard](http://localhost:3000/dashboard).

### The full loop

```bash
npm run reset:store                                    # healthy baseline, every time
npm run shop  -- --all                                 # 20 shoppers × 9 products, ~90%

npm run break -- --product <id> --mode size            # remove the sizing line
npm run shop  -- --product <id>                        # detect → fix → verify, hands off

npm run break -- --product <id> --mode price           # +40% over market
npm run shop  -- --product <id>                        # stops, texts you, waits for APPROVE
```

`--mode` also takes `materials` and `returns`.

### Environment

```bash
SUPABASE_URL=                     NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=        NEXT_PUBLIC_SUPABASE_ANON_KEY=

SHOPIFY_STORE_DOMAIN=             SHOPIFY_ADMIN_TOKEN=

GROK_API_KEY=                     # OpenRouter key
GROK_BASE_URL=https://openrouter.ai/api/v1
GROK_MODEL=                       GROK_MODEL_FALLBACKS=

TAVILY_API_KEY=                   # unset → cached comps in src/lib/commerce/comps.ts
WASSIST_API_KEY=                  WASSIST_AGENT_ID=
WASSIST_FROM_NUMBER=              WASSIST_WEBHOOK_SECRET=
MERCHANT_WHATSAPP_NUMBER=
```

Every integration degrades rather than crashes. No Tavily key falls back to cached comps; no Wassist config leaves approvals on the dashboard buttons; no model key drops to a rule-based mock. The loop runs either way.

---

## Layout

```
src/lib/agents/       shoppers, diagnosis, fix, personas, blockers, LLM client, WhatsApp
src/lib/commerce/     detectors, fix lifecycle, Shopify, Tavily, Supabase, sync
src/components/       the incident console
scripts/              reset, break, run shoppers, sync, seed
supabase/migrations/  schema
```

The LLM client bounds concurrency, rate-limits on a rolling window, extracts JSON from models that prepend prose, walks a fallback chain of models, and returns a mock rather than throwing when every one of them fails. A demo that degrades beats a demo that crashes.

## Built by

Kavishani — commerce backbone: Shopify, Supabase, detectors, fix lifecycle, the console.
Fazith — agents and experience: shopper panel, diagnosis, fix agent, Tavily, WhatsApp.
