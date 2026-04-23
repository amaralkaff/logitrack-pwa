import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from '../_lib/mongo';
import { Item, Tx } from '../_lib/models';
import { ok, bad, methodAllowed } from '../_lib/respond';
import { randomUUID } from 'node:crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['GET', 'POST'])) return;
  try {
    await connectMongo();

    if (req.method === 'GET') {
      const rows = await Tx.find().sort({ createdAt: -1 }).limit(200).lean();
      return ok(res, rows);
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body?.localId || !body?.sku || !body?.qty || !body?.dir || !body?.source || !body?.operatorId) {
      return bad(res, 'localId, sku, qty, dir, source, operatorId required');
    }

    // Idempotency — if already ingested, return the existing record.
    const dup = await Tx.findOne({ localId: body.localId }).lean();
    if (dup) return ok(res, dup);

    const item = await Item.findOne({ sku: body.sku });
    if (!item) return bad(res, 'unknown sku', 404);

    const delta = body.dir === 'in' ? Number(body.qty) : -Number(body.qty);
    item.stock = Math.max(0, item.stock + delta);
    await item.save();

    const doc = await Tx.create({
      localId: body.localId,
      txId: randomUUID(),
      sku: body.sku,
      qty: Number(body.qty),
      dir: body.dir,
      source: body.source,
      operatorId: body.operatorId,
      location: body.location,
      condition: body.condition ?? 'good',
      batch: body.batch,
      createdAt: Number(body.createdAt) || Date.now(),
      syncedAt: Date.now(),
    });
    return ok(res, doc.toObject(), 201);
  } catch (e) {
    return bad(res, (e as Error).message, 500);
  }
}
