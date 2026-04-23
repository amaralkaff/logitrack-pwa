// Minimal URL-safe id (no dep). Not cryptographic.
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
export function nanoid(size = 12): string {
  let out = '';
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  for (let i = 0; i < size; i++) out += alphabet[arr[i]! % alphabet.length];
  return out;
}
