# Autopilot — 2-Person Build Plan

Sep 26, 2026 · @Kavishani

Person A owns the commerce backbone (Shopify, Supabase, detectors, fix and verify); Person B owns the agents and everything people see (personas, prompts, WhatsApp, dashboard). You meet at a sync point at the end of every phase.

## Roles and shared interfaces

Spend the first 15 minutes agreeing the interfaces below together; after that, each person can build against them without waiting for the other.

|  | Person A · Commerce backbone | Person B · Agents and experience |
| --- | --- | --- |
| Owns | Shopify dev store and API, Supabase schema, detectors, fix apply, verify and rollback | Grok personas and prompts, WhatsApp via Wassist, dashboard, demo and pitch |
| Best fit | Stronger on backend, SQL and APIs | Stronger on prompting, frontend and UX |
| Final demo role | Drives the laptop | Presents and holds the phone |

**Interfaces to agree first**

| Interface | Shape | Written by | Read by |
| --- | --- | --- | --- |
| Supabase tables | products, events, incidents, fixes, settings (from the brief) | A | Both |
| Persona decision | JSON: persona, action (view / add\_to\_cart / leave), reason, blockers\[\] | B | A |
| Diagnosis | JSON: incident\_id, cause (one sentence), blocker | B | A, dashboard |
| Fix proposal | JSON: incident\_id, type (copy / price / reorder), after\_json, needs\_approval | B | A |
| Approval | Row update: fixes.approved\_by, status | B (WhatsApp) | A |
| Incident status | open → fixing → verified / rolled\_back | A | B (dashboard) |

Work on separate branches or folders (A: /lib/commerce, /api; B: /lib/agents, /app dashboard) to avoid merge conflicts.

## Phase 1 · until 11:45 — Foundations

Goal: both people can run their code against the same live store and database.

**Person A**

- [ ] Create Next.js repo, push, deploy to Vercel (empty page live)
- [ ] Create Supabase project and the five tables; add env vars to Vercel and share .env with B
- [ ] Create Shopify dev store; seed 8–10 products with good copy, sizes, materials, prices and stock
- [ ] Get Shopify Admin API token; write product sync script into Supabase products

**Person B**

- [ ] Join the wassist, grok-bot and supabase channels on Discord; get Grok API access working
- [ ] Get WhatsApp sending and receiving a test message through Wassist
- [ ] Write the fixed blocker checklist (size guide, materials, returns, price vs comps, lead image) and lock it
- [ ] Write 20 persona profiles (budget student, gift buyer, sizing-anxious, brand hunter, and so on)

**Sync at 11:45 (5 minutes).** A shows products in Supabase; B shows a WhatsApp round trip and one Grok call returning valid JSON. If WhatsApp is not working, B gives it 30 more minutes maximum.

## Phase 2 · until 13:30 — Shoppers and detection

Goal: pressing Break causes a real conversion drop and opens an incident with a £-per-day figure.

**Person A**

- [ ] Runner that sends the personas across the store in parallel and writes each decision to events (and PostHog)
- [ ] Detector 1 as a SQL query (add-to-cart rate under 30% of store average over last 20 views); opens an incident
- [ ] £-per-day calculation: missing carts per day × average order value × checkout rate
- [ ] Break button via Shopify API: removes size info, or prices 25% above market

**Person B**

- [ ] Persona prompt: reads the real product page and returns the agreed decision JSON with blockers from the checklist
- [ ] Tune for consistency: low temperature, fixed personas; healthy page should convert, broken page should not
- [ ] Diagnosis prompt: page + events + persona reasons → one-sentence cause and the blocker
- [ ] Dashboard skeleton on Vercel: live event feed from Supabase realtime

**Sync at 13:30, over lunch (15 minutes).** Run it together: healthy store, press Break, re-run shoppers, see the incident appear with a diagnosis. If the drop is not clear, fix this before anything else.

## Phase 3 · until 15:00 — Fix and verify (the core)

Goal: the full loop runs 3 times in a row without touching code: break, detect, diagnose, approve, fix, verify.

**Person A**

- [ ] Fix apply: take B's fix proposal, snapshot before\_json, write the change to Shopify, store after\_json in fixes
- [ ] Autonomy check from settings: copy fixes apply directly, price fixes wait for approval
- [ ] Verify: re-run personas on the fixed product, compare conversion, set incident to verified
- [ ] Rollback: if conversion does not improve, restore before\_json and set incident to rolled\_back

**Person B**

- [ ] Fix prompt: returns new title and description (or price within margin floor) as the agreed JSON; never sees the blocker checklist
- [ ] WhatsApp incident alert: product, £ per day, cause, proposed fix, with Approve / Reject / Why
- [ ] Approval reply updates the fixes row, which triggers A's apply
- [ ] Dashboard: incident cards with status moving open → fixing → verified

**Sync at 15:00 (10 minutes).** Run the full loop 3 times together. If it fails more than once, spend until 15:30 on reliability only; skip all stretch work.

## Phase 4 · until 16:00 — Dashboard and stretch

Goal: it looks like an incident console, not a log page. Stretch work only if the Phase 3 sync passed.

**Person A**

- [ ] Stretch: detector 2, price vs Tavily comps, with approval flow
- [ ] Stretch: detector 3, stock-out risk, with drafted reorder message
- [ ] PostHog funnel chart embedded or linked from the dashboard

**Person B**

- [ ] Big revenue-at-risk number that drops to £0 when the incident is verified
- [ ] Before/after conversion view and the before/after page diff for each fix
- [ ] Polish: clean layout, clear status colours, readable from the back of the room

## Phase 5 · 16:00–16:30 — Ship

**Person A**

- [ ] Feature freeze at 16:00; final deploy to Vercel; reset the store to its healthy state
- [ ] Record a 3-minute backup video of the full loop
- [ ] Submit with the Vercel link

**Person B**

- [ ] Write the 3-minute script and the judge Q&A cheat sheet (from the brief)
- [ ] Rehearse twice with a timer; A drives the laptop, B presents and approves on the phone
- [ ] Prepare the 60-second version for the table visit at code freeze

**Final check at 16:25.** Store reset, phone charged, WhatsApp open, backup video ready, both people know the answer to "Isn't this AI grading AI?"
