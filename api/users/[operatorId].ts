import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from '../_lib/mongo.js';
import mongoose from 'mongoose';
import { ok, bad, methodAllowed } from '../_lib/respond.js';

const UserSchema = new mongoose.Schema({
  operatorId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { type: String, default: 'Operator' },
  shift: String,
  location: String,
}, { versionKey: false });

const User = mongoose.models.User ?? mongoose.model('User', UserSchema);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['GET', 'PUT', 'PATCH'])) return;
  try {
    await connectMongo();
    const operatorId = String(
      (req as unknown as { params?: { operatorId?: string } }).params?.operatorId ?? req.query?.operatorId ?? '',
    ).trim();
    if (!operatorId) return bad(res, 'operatorId required');

    if (req.method === 'GET') {
      const doc = await User.findOne({ operatorId }).lean();
      if (!doc) return bad(res, 'not found', 404);
      return ok(res, doc);
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body) return bad(res, 'body required');

    // Upsert — used for first-time sign-in and subsequent profile edits.
    const $set: Record<string, unknown> = { operatorId };
    for (const k of ['name', 'role', 'shift', 'location'] as const) {
      if (k in body) $set[k] = body[k];
    }
    if (req.method === 'PUT' && !body.name) return bad(res, 'name required on PUT');

    const doc = await User.findOneAndUpdate(
      { operatorId },
      { $set },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    return ok(res, doc);
  } catch (e) {
    return bad(res, (e as Error).message, 500);
  }
}
