import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from '../_lib/mongo.js';
import { Item } from '../_lib/models.js';
import { ok, bad, methodAllowed } from '../_lib/respond.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['GET', 'POST'])) return;
  try {
    await connectMongo();
    if (req.method === 'GET') {
      // Include imageUrl so thumbnails render in list / recent / history rows.
      const items = await Item.find().sort({ name: 1 }).lean();
      return ok(res, items);
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const cleanStr = (v: unknown): string | undefined => {
      if (typeof v !== 'string') return undefined;
      const s = v.trim();
      if (!s || /^(null|undefined|none|n\/a|-)$/i.test(s)) return undefined;
      return s;
    };
    const sku = cleanStr(body?.sku);
    const name = cleanStr(body?.name);
    const loc = cleanStr(body?.loc);
    if (!sku || !name || !loc) return bad(res, 'sku, name, loc required');
    const existing = await Item.findOne({ sku }).lean();
    if (existing) return bad(res, 'sku already exists', 409);
    const doc = await Item.create({
      sku,
      name,
      ean: cleanStr(body?.ean),
      loc,
      zone: cleanStr(body?.zone),
      stock: Number.isFinite(Number(body?.stock)) ? Math.max(0, Math.round(Number(body.stock))) : 0,
      reorderAt: Number.isFinite(Number(body?.reorderAt)) ? Math.max(0, Math.round(Number(body.reorderAt))) : 0,
      unit: cleanStr(body?.unit) ?? 'EA',
      imageUrl: cleanStr(body?.imageUrl),
      lat: typeof body?.lat === 'number' && Number.isFinite(body.lat) ? body.lat : undefined,
      lng: typeof body?.lng === 'number' && Number.isFinite(body.lng) ? body.lng : undefined,
    });
    return ok(res, doc.toObject(), 201);
  } catch (e) {
    return bad(res, (e as Error).message, 500);
  }
}
