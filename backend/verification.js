import crypto from 'node:crypto';

export const CODE_TTL_MS = 10 * 60_000;
export const COOLDOWN_MS = 60_000;
export const MAX_ATTEMPTS = 5;

function secret() {
  const value = process.env.PAWCARE_JWT_SECRET;
  if (!value && process.env.NODE_ENV === 'production')
    throw new Error('PAWCARE_JWT_SECRET must be set in production.');
  return value || 'local-dev-only-secret';
}

export function newCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

// Keyed hash: without the server secret, a stolen database can't be used to recover codes.
export function hashCode(code) {
  return crypto.createHmac('sha256', secret()).update(code).digest('hex');
}

export function codeMatches(code, storedHash) {
  const a = Buffer.from(hashCode(code), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}