import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from '../_lib/mongo.js';
import { Item } from '../_lib/models.js';
import { ok, bad, methodAllowed } from '../_lib/respond.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['GET', 'PATCH', 'PUT', 'DELETE'])) return;
  try {
    await connectMongo();
    // Vercel dynamic routes expose :sku via req.query, Express via req.params.
    const sku = String(
      (req as unknown as { params?: { sku?: string } }).params?.sku ?? req.query?.sku ?? '',
    ).trim();
    if (!sku) return bad(res, 'sku required');

    if (req.method === 'GET') {
      const doc = await Item.findOne({ sku }).lean();
      if (!doc) return bad(res, 'not found', 404);
      return ok(res, doc);
    }

    if (req.method === 'DELETE') {
      const r = await Item.findOneAndDelete({ sku });
      if (!r) return bad(res, 'not found', 404);
      return ok(res, { deleted: sku });
    }

    // PATCH / PUT
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body) return bad(res, 'body required');
    const allowed = ['name', 'ean', 'loc', 'zone', 'stock', 'reorderAt', 'unit', 'imageUrl', 'lat', 'lng'];
    const stringFields = new Set(['name', 'ean', 'loc', 'zone', 'unit', 'imageUrl']);
    const cleanStr = (v: unknown): string | undefined => {
      if (typeof v !== 'string') return undefined;
      const s = v.trim();
      if (!s || /^(null|undefined|none|n\/a|-)$/i.test(s)) return undefined;
      return s;
    };
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};
    for (const k of allowed) {
      if (!(k in body)) continue;
      if (stringFields.has(k)) {
        const v = cleanStr(body[k]);
        if (v === undefined) $unset[k] = 1;
        else $set[k] = v;
      } else {
        $set[k] = body[k];
      }
    }
    const update: Record<string, unknown> = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;
    const doc = await Item.findOneAndUpdate({ sku }, update, { new: true }).lean();
    if (!doc) return bad(res, 'not found', 404);
    return ok(res, doc);
  } catch (e) {
    return bad(res, (e as Error).message, 500);
  }
}
