import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectMongo } from '../_lib/mongo.js';
import { UserModel } from '../_lib/user-model.js';
import { ok, bad, methodAllowed } from '../_lib/respond.js';
import { verifyPin } from '../_lib/hash.js';
import { signToken } from '../_lib/jwt.js';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodAllowed(req, res, ['POST'])) return;
  try {
    await connectMongo();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const operatorId = String(body?.operatorId ?? '').trim().toUpperCase();
    const pin = String(body?.pin ?? '');

    if (!operatorId || !pin) return bad(res, 'operatorId and pin required');

    // pinHash is select:false — must explicitly request.
    const user = await UserModel.findOne({ operatorId }).select('+pinHash +failedAttempts +lockedUntil');
    if (!user) return bad(res, 'invalid credentials', 401);

    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      const secs = Math.ceil((user.lockedUntil - Date.now()) / 1000);
      return bad(res, `locked, try again in ${secs}s`, 429);
    }

    const valid = await verifyPin(pin, user.pinHash);
    if (!valid) {
      user.failedAttempts = (user.failedAttempts ?? 0) + 1;
      if (user.failedAttempts >= MAX_ATTEMPTS) {
        user.lockedUntil = Date.now() + LOCK_MS;
        user.failedAttempts = 0;
      }
      await user.save();
      return bad(res, 'invalid credentials', 401);
    }

    // Success — reset counters.
    user.failedAttempts = 0;
    user.lockedUntil = 0;
    await user.save();

    const token = signToken({ sub: user.operatorId, name: user.name, role: user.role });
    return ok(res, {
      token,
      user: {
        operatorId: user.operatorId, name: user.name, role: user.role,
        location: user.location, shift: user.shift,
      },
    });
  } catch (e) {
    return bad(res, (e as Error).message, 500);
  }
}
