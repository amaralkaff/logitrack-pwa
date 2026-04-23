import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from './jwt.js';

export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

const OPEN_PATHS = new Set(['/healthz']);
const OPEN_PREFIXES = ['/api/auth/'];

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const path = req.path;
  if (OPEN_PATHS.has(path)) return next();
  if (OPEN_PREFIXES.some((p) => path.startsWith(p))) return next();
  if (!path.startsWith('/api/')) return next(); // static / SPA fallback

  const hdr = req.header('authorization') ?? '';
  const match = hdr.match(/^Bearer (.+)$/i);
  if (!match) return res.status(401).json({ error: 'missing bearer token' });
  const payload = verifyToken(match[1]!);
  if (!payload) return res.status(401).json({ error: 'invalid or expired token' });
  req.user = payload;
  next();
}
