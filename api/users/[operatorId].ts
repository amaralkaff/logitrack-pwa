import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from '../_lib/mongo.js';
import { UserModel } from '../_lib/user-model.js';
import { ok, bad, methodAllowed } from '../_lib/respond.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['GET', 'PATCH'])) return;
  try {
    await connectMongo();
    const operatorId = String(
      (req as unknown as { params?: { operatorId?: string } }).params?.operatorId ?? req.query?.operatorId ?? '',
    ).trim().toUpperCase();
    if (!operatorId) return bad(res, 'operatorId required');

    if (req.method === 'GET') {
      const doc = await UserModel.findOne({ operatorId }).lean();
      if (!doc) return bad(res, 'not found', 404);
      // Never leak pinHash; select:false already excludes it from lean() unless requested.
      return ok(res, doc);
    }

    // PATCH: update name/role/shift/location only. PIN changes go through a
    // dedicated endpoint (not implemented yet) with current-pin verification.
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body) return bad(res, 'body required');
    const $set: Record<string, unknown> = {};
    for (const k of ['name', 'role', 'shift', 'location'] as const) {
      if (k in body) $set[k] = body[k];
    }
    if (!Object.keys($set).length) return bad(res, 'no updatable fields');
    const doc = await UserModel.findOneAndUpdate({ operatorId }, { $set }, { new: true }).lean();
    if (!doc) return bad(res, 'not found', 404);
    return ok(res, doc);
  } catch (e) {
    return bad(res, (e as Error).message, 500);
  }
}
