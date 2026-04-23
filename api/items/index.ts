import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from '../_lib/mongo.js';
import { Item } from '../_lib/models.js';
import { ok, bad, methodAllowed } from '../_lib/respond.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['GET', 'POST'])) return;
  try {
    await connectMongo();
    if (req.method === 'GET') {
      // List view: skip imageUrl (can be large). Fetch full doc in /:sku.
      const items = await Item.find().select('-imageUrl').sort({ name: 1 }).lean();
      return ok(res, items);
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body?.sku || !body?.name || !body?.loc) return bad(res, 'sku, name, loc required');
    const existing = await Item.findOne({ sku: body.sku }).lean();
    if (existing) return bad(res, 'sku already exists', 409);
    const doc = await Item.create({
      sku: String(body.sku).trim(),
      name: String(body.name).trim(),
      ean: body.ean ?? undefined,
      loc: String(body.loc).trim(),
      zone: body.zone ?? undefined,
      stock: Number(body.stock ?? 0),
      reorderAt: Number(body.reorderAt ?? 0),
      unit: body.unit ?? 'EA',
      imageUrl: body.imageUrl ?? undefined,
    });
    return ok(res, doc.toObject(), 201);
  } catch (e) {
    return bad(res, (e as Error).message, 500);
  }
}
