import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'lefilonao_access';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET must be configured (do NOT use SITE_PASSWORD)');
  return secret;
}

/** Sign an email into a cookie value: base64url(email).timestamp(base36).hmac */
export function signSession(email: string): string {
  const normalized = email.trim().toLowerCase();
  const emailB64 = Buffer.from(normalized).toString('base64url');
  const ts = Math.floor(Date.now() / 1000).toString(36);
  const payload = `${emailB64}.${ts}`;
  const hmac = createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${hmac}`;
}

/** Verify and extract email from a signed cookie value. Returns null if invalid or expired. */
export function verifySession(cookieValue: string): string | null {
  if (!cookieValue) return null;

  const parts = cookieValue.split('.');
  if (parts.length !== 3) return null;

  const [emailB64, ts, signature] = parts;

  try {
    const payload = `${emailB64}.${ts}`;
    const expected = createHmac('sha256', getSecret())
      .update(payload)
      .digest('base64url');

    // Constant-time comparison
    const sigBuf = Buffer.from(signature, 'utf-8');
    const expBuf = Buffer.from(expected, 'utf-8');
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    // Check expiry
    const created = parseInt(ts, 36) * 1000;
    if (isNaN(created) || Date.now() - created > MAX_AGE_MS) return null;

    return Buffer.from(emailB64, 'base64url').toString('utf-8');
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
