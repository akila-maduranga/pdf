// Small signed-cookie session for the single admin user.
// Uses Web Crypto (SubtleCrypto) so it works in both the Node runtime
// (API routes) and the Edge runtime (middleware).

const COOKIE_NAME = 'vr_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  return secret;
}

async function hmac(data: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Buffer.from(sig).toString('base64url');
}

export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + MAX_AGE_SECONDS * 1000 });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const sig = await hmac(encodedPayload, getSecret());
  return `${encodedPayload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [encodedPayload, sig] = token.split('.');
  if (!encodedPayload || !sig) return false;
  const expectedSig = await hmac(encodedPayload, getSecret());
  if (expectedSig !== sig) return false;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
