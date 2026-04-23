import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from '../_lib/mongo.js';
import { UserModel } from '../_lib/user-model.js';
import { ok, bad, methodAllowed } from '../_lib/respond.js';
import { hashPin } from '../_lib/hash.js';
import { signToken } from '../_lib/jwt.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['POST'])) return;
  try {
    await connectMongo();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const operatorId = String(body?.operatorId ?? '').trim().toUpperCase();
    const name = String(body?.name ?? '').trim();
    const pin = String(body?.pin ?? '');
    const location = body?.location ? String(body.location).trim() : undefined;
    const shift = body?.shift ? String(body.shift).trim() : undefined;

    if (!operatorId) return bad(res, 'operatorId required');
    if (!name) return bad(res, 'name required');
    if (!/^\d{4,8}$/.test(pin)) return bad(res, 'pin must be 4-8 digits');

    const existing = await UserModel.findOne({ operatorId }).lean();
    if (existing) return bad(res, 'operator already exists', 409);

    const pinHash = await hashPin(pin);
    const doc = await UserModel.create({ operatorId, name, pinHash, location, shift, role: 'Operator' });
    const token = signToken({ sub: operatorId, name: doc.name, role: doc.role });
    return ok(res, {
      token,
      user: { operatorId: doc.operatorId, name: doc.name, role: doc.role, location: doc.location, shift: doc.shift },
    }, 201);
  } catch (e) {
    return bad(res, (e as Error).message, 500);
  }
}
