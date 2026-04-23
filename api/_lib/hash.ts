import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 210_000;
const KEYLEN = 32;
const DIGEST = 'sha256';

/** Hash a PIN with a fresh random salt. Returns "pbkdf2$<iter>$<salt_b64>$<hash_b64>". */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await pbkdf2Async(pin, salt, ITERATIONS, KEYLEN, DIGEST);
  return `pbkdf2$${ITERATIONS}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/** Constant-time verify. */
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iter = Number(parts[1]);
  const salt = Buffer.from(parts[2]!, 'base64');
  const hash = Buffer.from(parts[3]!, 'base64');
  if (!iter || !salt.length || !hash.length) return false;
  const derived = await pbkdf2Async(pin, salt, iter, hash.length, DIGEST);
  return derived.length === hash.length && timingSafeEqual(derived, hash);
}
