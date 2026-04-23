import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, bad, methodAllowed } from '../_lib/respond.js';
import { gemini, geminiModel, LABEL_PROMPT, LABEL_SCHEMA } from '../_lib/gemini.js';

const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-2.0-flash';
const MAX_ATTEMPTS = 3;

function isOverload(err: unknown): boolean {
  const msg = (err as Error)?.message ?? String(err);
  return /overload|unavailable|spike|resource_exhausted|rate[-_\s]?limit|429|503/i.test(msg);
}

async function callModel(model: string, b64: string, mimeType: string) {
  const ai = gemini();
  return ai.models.generateContent({
    model,
    contents: [{
      role: 'user',
      parts: [
        { text: LABEL_PROMPT },
        { inlineData: { data: b64, mimeType } },
      ],
    }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: LABEL_SCHEMA,
      temperature: 0,
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['POST'])) return;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const imageB64 = String(body?.image ?? '');
    if (!imageB64) return bad(res, 'image (base64) required');

    const b64 = imageB64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageB64.startsWith('data:') ? imageB64.slice(5, imageB64.indexOf(';')) : 'image/jpeg';

    const primary = geminiModel();
    const models = [primary, FALLBACK_MODEL].filter((m, i, a) => a.indexOf(m) === i);

    let lastErr: unknown = null;
    let result: Awaited<ReturnType<typeof callModel>> | null = null;

    for (const model of models) {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          result = await callModel(model, b64, mimeType);
          break;
        } catch (e) {
          lastErr = e;
          if (!isOverload(e) || attempt === MAX_ATTEMPTS) break;
          // Exponential backoff + jitter: ~700ms, ~1.4s, ~2.8s
          const delay = 700 * 2 ** (attempt - 1) + Math.random() * 300;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
      if (result) break;
    }

    if (!result) {
      const msg = (lastErr as Error)?.message ?? 'vision request failed';
      return bad(res, `AI overloaded: ${msg.slice(0, 200)}`, 503);
    }

    const text = result.text ?? '';
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(text); } catch {
      return bad(res, `Gemini returned non-JSON: ${text.slice(0, 200)}`, 502);
    }
    return ok(res, parsed);
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    const status = /VERTEX_PROJECT|GEMINI_API_KEY/.test(msg) ? 503 : 500;
    return bad(res, msg, status);
  }
}
