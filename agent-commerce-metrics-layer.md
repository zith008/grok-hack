# Agent Commerce Metrics Layer — Handoff

**Status:** parked (not the hackathon build). Kept because the thesis and the dataset are durable.
**Date:** 2026-09-26 · Grok Bot Commerce Hackathon, London

---

## 1. The thesis

> Every analytics tool ever built filters bots out as noise.
> Bots are now your customers.
> **Your analytics is deleting your customers.**

Proof to show on a screen: GA4's *"exclude known bots and spiders"* is **on by default and cannot be turned off**. Cloudflare, Fastly and most WAFs do the same at the edge — agent sessions are dropped before they are ever counted.

### Why now
- ACP (OpenAI + Stripe), UCP (Google + Shopify), AP2, Visa Trusted Agent Protocol, Mastercard Agent Pay all shipped or landed in 2026.
- Shopify Catalog syndicates real-time price/inventory to AI platforms.
- OpenAI Instant Checkout was **pulled back ~March 2026** — Walmart measured conversion **~3× lower** than click-out. Nobody could say *why*, because nobody was measuring the agent path.
- Merchants' loudest grievance: platforms withhold query-level intent. Brands never see what was asked in ChatGPT or Gemini.

---

## 2. What the layer actually is

Not a dashboard product. Three pieces:

1. **Ingest** — `POST /ingest` accepting either (a) a script-tag/server-middleware event stream, or (b) a raw CDN/access log file.
2. **Classifier** — decides human / verified agent / unverified agent / scraper, and extracts intent where present.
3. **Ledger** — append-only event store. The dashboard is just a read model over it. The ledger is the asset.

Deliberately platform-agnostic. A Shopify app is an *install path*, never the product.

---

## 3. Detection signals

| Signal | What it tells you |
|---|---|
| User-agent: `ChatGPT-User`, `GPTBot`, `PerplexityBot`, `ClaudeBot`, Grok | Which agent, and whether it's browsing vs training-crawling |
| **HTTP message signatures** (Web Bot Auth / Visa Trusted Agent) | Cryptographically *verified* agent identity — the high-trust tier |
| Referrer: `chatgpt.com`, `perplexity.ai`, `gemini.google.com` | LLM-originated human sessions (the other half of the story) |
| Headless fingerprint | No mouse, no scroll, instant form fill, sub-100ms page→cart |
| Fetch pattern | Pulls JSON-LD / `robots.txt` / `llms.txt`, skips CSS, fonts, images |
| **MCP / Catalog / Cart tool calls** | **The query is in the request payload — this is the intent Big Tech withholds** |
| ACP/UCP checkout session vs browser checkout | Which rail the purchase used |
| Last event before drop-off | Where and why the agent gave up |

The MCP row is the valuable one. When an agent calls your tool, the arguments *are* the search query. No platform has to give it to you — it arrives at your own endpoint.

---

## 4. Metrics that don't exist today

**Merchant-level**
- Agent share of sessions, and of revenue
- Agent conversion vs human conversion (the Walmart 3× gap, per-store)
- Verified vs unverified agent split
- **Agent abandonment causes, machine-readable** — the killer metric:

  > *47 agent sessions abandoned across 12 SKUs. Cause: `material` attribute missing. Agents asked for "cotton" and could not verify. Est. £2,140 lost.*

  Human abandonment is unknowable. Agent abandonment is **deterministic and fixable** — the agent tells you what it needed.

- Agent-legibility score per SKU: structured-data completeness weighted by what agents actually asked for

**Marketplace-level**
- Supplier agent-legibility leaderboard → a **ranking signal**
- **Demand gap:** what agents asked for that no listing satisfied. Measured unmet demand
- Scraper vs genuine sourcing agent separation (catalogue defence)
- Agent-priority placement inventory → a **new revenue line**

---

## 5. How a marketplace adapts

A marketplace is not a big merchant. One integration covers every seller on it, so the panel has no cold start. That inverts the GTM.

### Land-and-expand ladder

| Level | Ask | What they get | Risk to them |
|---|---|---|---|
| **0** | *"Send one day of CDN logs"* | A retrospective report: agent share, which agents, what they asked, where they quit | **Zero.** No code, no deploy, no procurement |
| **1** | One script tag / edge middleware | Realtime, plus checkout-rail attribution | Minimal |
| **2** | Wire scores into ranking | Agent-legible supply ranks higher → agent-sourced GMV rises | Product change |
| **3** | Sell agent-priority placement | New revenue line on top of commission | Commercial |

Level 0 is the whole wedge. It works on any marketplace on earth, including ones with no API, and it needs nothing from their engineering team.

### The four changes a marketplace has to make

1. **Stop filtering agents at the edge.** Classify and keep them. Blocking is a revenue decision, not a security default.
2. **Make listings legible.** Structured attributes over freeform prose. For one-of-one goods this means normalising condition, measurements, material, defects into fields.
3. **Rank on legibility.** An illegible listing is invisible to the fastest-growing buyer type. Make that a supply-side incentive.
4. **Price agent attention.** You cannot show a banner to a bot, but you can sell rank to one. Measurement has to exist before that market can.

---

## 6. Case: Fleek

Fleek is a B2B wholesale marketplace for vintage/secondhand clothing. ~45,000 buyers (resellers on Vinted/eBay/Depop/Whatnot), ~2,000 wholesalers, 2.5M items moved, 90+ countries.

**Why they are the extreme case:** their inventory is the least agent-legible on the internet, by their own description — *"Every item is unique. There is no universal catalogue, no standard pricing, and no fixed inventory."* No UPCs. Freeform condition text. One-of-one goods. Sourcing agents will abandon en masse and nobody will see it happen.

**The strategic line:**

> Fleek's moat is FleekSort — grading, pricing and defect detection from a phone photo. But if agents cannot parse Fleek listings, **all of that AI output is invisible to the buyer that matters next.** This makes their existing AI investment legible to the agent buyer.

**What they'd get**
1. Ranking signal — agent-legible suppliers rank higher, agent-sourced GMV rises
2. Demand gap across 45,000 buyers — tells a supplier what to pull out of the bale. This dataset does not exist today
3. Agent-priority placement — new revenue
4. Catalogue defence — sourcing agents vs scrapers (eBay is an investor; they should care who reads the catalogue)

Their own roadmap already names *"preferential onboarding for highly-reviewed wholesalers"* — the legibility score is the same mechanism with a new input. Worth asking Alex Nikityuk whether that shipped.

---

## 7. Moat

- **Cross-marketplace panel.** One property's data is a feature; many properties is a business. Shape of Similarweb / DoubleVerify.
- **Compounding fingerprint database.** Every new agent released makes the existing corpus more valuable.
- **Structural neutrality.** Shopify cannot credibly grade how legible Shopify stores are. Neither can Google or OpenAI. It only works from outside.
- Historical precedent: programmatic advertising created DoubleVerify and IAS *after* the rails existed and before anyone trusted them. Agentic commerce is at the same point on the curve.

---

## 8. Why it was parked

Scored against the hackathon's own criteria:

| Criterion | Verdict |
|---|---|
| Problem | Mid — measurement is a second-order problem |
| Experience | **Fail** — no buyer, no seller; a merchant looks at a chart |
| Execution | Good |
| AI / Grok Bot | **Fail** — the agent is test-traffic, not the product |
| Commerce depth | Strong |
| Originality | Good |
| Impact | Mid — estimated, not realised |

Two fails, one of them the sponsor criterion. Correct call for a 6-hour demo-judged build.

**But:** the demand-gap dataset falls out as a free byproduct of the sourcing-agent build, because that agent generates exactly this telemetry as it works. Instrument the agent's run from hour one and this layer exists without extra effort.

---

## 9. Open questions

- Does Fleek already rank on supplier quality? (ask Alex Nikityuk)
- What does Grok Bot concretely expose for instrumentation? (ask in `#grok-bot`)
- Will verified-agent signatures (Visa TAP / Web Bot Auth) reach enough volume in 2026 to rely on, or is fingerprinting the primary for another year?
- Liability and chargebacks for agent-initiated purchases remain unsolved industry-wide — measurement is a precondition for pricing that risk.

## 10. Do not

- Point a live scraper at joinfleek.com. Build a clearly-labelled replica with Fleek's listing shape.
- Pitch grading as a gap. FleekSort exists and it is their pride.
- Rebuild a machine-readable storefront. UCP + Shopify Catalog shipped in Spring '26; judges know.
