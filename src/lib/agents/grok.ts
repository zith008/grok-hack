// Thin LLM client. OpenAI-compatible chat completions.
//
// Set GROK_API_KEY to go live. With no key it runs in mock mode so the
// dashboard and the whole loop stay demoable while access is being sorted.
//
// Free models on OpenRouter share an upstream pool with every other user, so a
// 429 has nothing to do with our own quota and can land at any moment —
// including on stage. Two defences:
//
//   1. GROK_MODEL_FALLBACKS — a comma-separated list tried in order when the
//      primary model is rate-limited or erroring.
//   2. Bounded concurrency (see limitedMap) — 20 personas fired at once is
//      what saturates the pool in the first place.
//
// If every model fails, callJson falls back to the deterministic mock rather
// than throwing. A shopper that cannot think is still a shopper that decides.

const BASE_URL = process.env.GROK_BASE_URL ?? 'https://api.x.ai/v1';
const MODEL = process.env.GROK_MODEL ?? 'grok-4';
const FALLBACKS = (process.env.GROK_MODEL_FALLBACKS ?? '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

/** Primary first, then each fallback. */
const MODELS = [MODEL, ...FALLBACKS];

export const IS_MOCK = !process.env.GROK_API_KEY;

/** Which model actually answered last, for the dashboard and the pitch. */
export let LAST_MODEL_USED: string | null = null;

export class GrokError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs `fn` over `items` with at most `concurrency` in flight, preserving order.
 * Free-tier pools reject bursts, so the persona run is paced rather than parallel.
 */
export async function limitedMap<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

interface CallOpts {
  system: string;
  user: string;
  /** Low by default: the personas must be repeatable on stage. */
  temperature?: number;
  /** Used when there is no API key, and as the last resort if every model fails. */
  mock: () => unknown;
}

async function once(model: string, system: string, user: string, temperature: number) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 400,
      // Some free models emit a long chain-of-thought we neither need nor want
      // to pay latency for. Ignored by providers that do not support it.
      reasoning: { exclude: true },
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new GrokError(`${model} ${res.status}: ${body.slice(0, 200)}`);
    // 429 and 5xx are worth trying elsewhere; 400/401 mean this model is wrong for us.
    (err as GrokError & { retryable?: boolean }).retryable = res.status === 429 || res.status >= 500;
    throw err;
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  return JSON.parse(extractJson(text));
}

/**
 * Free models routinely ignore response_format: some wrap the object in a
 * ```json fence, and reasoning models prepend their thinking ("The user is
 * asking..."). Take the outermost brace pair and parse that.
 */
export function extractJson(text: string): string {
  const t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end <= start) throw new GrokError(`no JSON object in: ${t.slice(0, 160)}`);
  return t.slice(start, end + 1);
}

/**
 * OpenRouter caps free models at 20 requests per minute across all of them, so
 * a 20-persona run sits exactly on the limit with no room for a retry. Gate
 * every call through a rolling window and let callers queue.
 */
const RPM = Number(process.env.LLM_MAX_RPM ?? 16);
let window: number[] = [];

async function takeSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    window = window.filter((t) => now - t < 60_000);
    if (window.length < RPM) {
      window.push(now);
      return;
    }
    await sleep(60_000 - (now - window[0]) + 250);
  }
}

/**
 * Calls the LLM and returns parsed JSON. Tries each model in turn, twice, with
 * a short backoff, then falls back to the mock.
 */
export async function callJson<T>({ system, user, temperature = 0.2, mock }: CallOpts): Promise<T> {
  if (IS_MOCK) return mock() as T;

  let last: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await takeSlot();
        const out = await once(
          model,
          system,
          attempt === 0 ? user : `${user}\n\nReturn valid JSON only.`,
          temperature,
        );
        LAST_MODEL_USED = model;
        return out as T;
      } catch (e) {
        last = e;
        const retryable = (e as { retryable?: boolean }).retryable ?? true;
        if (!retryable) break;
        if (attempt === 0) await sleep(800);
      }
    }
  }

  console.warn(`[llm] every model failed, using mock. last error: ${String(last).slice(0, 200)}`);
  LAST_MODEL_USED = 'mock';
  return mock() as T;
}
