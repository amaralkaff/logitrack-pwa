import jwt from 'jsonwebtoken';

export interface TokenPayload {
  sub: string;       // operatorId
  name: string;
  role: string;
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET env var missing or too short (min 32 chars)');
  return s;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret(), { algorithm: 'HS256', expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret(), { algorithms: ['HS256'] });
    if (typeof decoded === 'object' && decoded && 'sub' in decoded) {
      return decoded as unknown as TokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}
