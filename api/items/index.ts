import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from '../_lib/mongo';
import { Item } from '../_lib/models';
import { ok, bad, methodAllowed } from '../_lib/respond';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['GET', 'POST'])) return;
  try {
    await connectMongo();
    if (req.method === 'GET') {
      const items = await Item.find().sort({ name: 1 }).lean();
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
    });
    return ok(res, doc.toObject(), 201);
  } catch (e) {
    return bad(res, (e as Error).message, 500);
  }
}
