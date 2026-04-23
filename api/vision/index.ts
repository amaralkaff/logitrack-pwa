import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, bad, methodAllowed } from '../_lib/respond.js';
import { gemini, geminiModel, LABEL_PROMPT, LABEL_SCHEMA } from '../_lib/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['POST'])) return;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const imageB64 = String(body?.image ?? '');
    if (!imageB64) return bad(res, 'image (base64) required');

    // Strip data URL prefix if present.
    const b64 = imageB64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageB64.startsWith('data:') ? imageB64.slice(5, imageB64.indexOf(';')) : 'image/jpeg';

    const ai = gemini();
    const result = await ai.models.generateContent({
      model: geminiModel(),
      contents: [
        {
          role: 'user',
          parts: [
            { text: LABEL_PROMPT },
            { inlineData: { data: b64, mimeType } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: LABEL_SCHEMA,
        temperature: 0,
      },
    });

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
