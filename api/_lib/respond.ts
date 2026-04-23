import type { VercelRequest, VercelResponse } from '@vercel/node';

export function ok<T>(res: VercelResponse, data: T, status = 200) {
  res.status(status).json(data);
}

export function bad(res: VercelResponse, msg: string, status = 400) {
  res.status(status).json({ error: msg });
}

export function methodAllowed(req: VercelRequest, res: VercelResponse, allowed: string[]): boolean {
  if (!allowed.includes(req.method ?? '')) {
    res.setHeader('Allow', allowed.join(', '));
    bad(res, `Method ${req.method} not allowed`, 405);
    return false;
  }
  return true;
}
