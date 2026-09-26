// Thin Grok client. OpenAI-compatible chat completions.
//
// Set GROK_API_KEY to go live. With no key it runs in mock mode so the
// dashboard and the whole loop stay demoable while access is being sorted.

const BASE_URL = process.env.GROK_BASE_URL ?? 'https://api.x.ai/v1';
const MODEL = process.env.GROK_MODEL ?? 'grok-4';

export const IS_MOCK = !process.env.GROK_API_KEY;

export class GrokError extends Error {}

interface CallOpts {
  system: string;
  user: string;
  /** Low by default: the personas must be repeatable on stage. */
  temperature?: number;
  /** Called when there is no API key. */
  mock: () => unknown;
}

/** Calls Grok and returns parsed JSON. Retries once on unparseable output. */
export async function callJson<T>({ system, user, temperature = 0.2, mock }: CallOpts): Promise<T> {
  if (IS_MOCK) return mock() as T;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: attempt === 0 ? user : `${user}\n\nReturn valid JSON only.` },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      // Rate limited or overloaded: back off briefly and retry once.
      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw new GrokError(`Grok ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    try {
      return JSON.parse(text) as T;
    } catch {
      if (attempt === 1) throw new GrokError(`Grok returned non-JSON: ${text.slice(0, 300)}`);
    }
  }
  throw new GrokError('unreachable');
}
