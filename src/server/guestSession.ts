import crypto from 'node:crypto';
import type { Request, Response } from 'express';

export const GUEST_COOKIE_NAME = 'paws_guest';
export const GUEST_HEADER_NAME = 'x-guest-token';
export const GUEST_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const MIN_PRODUCTION_SECRET_LENGTH = 32;
const DEV_FALLBACK_GUEST_SECRET = 'paws-picket-dev-only-guest-hmac-secret';
const FORBIDDEN_SECRET_VALUES = new Set([
  '',
  'MY_GUEST_SESSION_SECRET',
  'changeme',
  'secret',
  'paws-picket-local-guest-hmac-key',
  DEV_FALLBACK_GUEST_SECRET,
]);

export function assertGuestSessionConfig(): void {
  void getGuestSigningSecret();
}

function getGuestSigningSecret(): Buffer {
  const isProd = process.env.NODE_ENV === 'production';
  const configured = process.env.GUEST_SESSION_SECRET?.trim() || '';
  const isPlaceholder = FORBIDDEN_SECRET_VALUES.has(configured);

  if (isProd) {
    if (isPlaceholder || configured.length < MIN_PRODUCTION_SECRET_LENGTH) {
      const err = new Error(
        'GUEST_SESSION_SECRET must be provisioned in production with at least 32 random characters.'
      );
      (err as Error & { statusCode?: number }).statusCode = 503;
      throw err;
    }
    return crypto
      .createHash('sha256')
      .update(`paws-guest-hmac-v1:${configured}`)
      .digest();
  }

  const devRaw =
    configured && !isPlaceholder ? configured : DEV_FALLBACK_GUEST_SECRET;
  return crypto
    .createHash('sha256')
    .update(`paws-guest-hmac-v1:${devRaw}`)
    .digest();
}

export function issueGuestSessionToken(
  guestId?: string,
  nowMs: number = Date.now()
): {
  guestId: string;
  guestUid: string;
  token: string;
} {
  const secret = getGuestSigningSecret();
  const safeGuestId =
    guestId && /^[a-zA-Z0-9_-]{8,64}$/.test(guestId)
      ? guestId
      : crypto.randomUUID();
  const payloadObj = {
    gid: safeGuestId,
    iat: nowMs,
    exp: nowMs + GUEST_TOKEN_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString(
    'base64url'
  );
  const sigB64 = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
  return {
    guestId: safeGuestId,
    guestUid: `guest:${safeGuestId}`,
    token: `${payloadB64}.${sigB64}`,
  };
}

export function verifyGuestSessionToken(
  token: string | null | undefined,
  nowMs: number = Date.now()
): {
  guestId: string;
  guestUid: string;
} | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = crypto
    .createHmac('sha256', getGuestSigningSecret())
    .update(payloadB64)
    .digest();

  let actualSig: Buffer;
  try {
    actualSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return null;
  }

  if (
    actualSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(actualSig, expectedSig)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as { gid?: unknown; iat?: unknown; exp?: unknown };
    if (
      typeof parsed.gid !== 'string' ||
      !/^[a-zA-Z0-9_-]{8,64}$/.test(parsed.gid)
    ) {
      return null;
    }
    if (typeof parsed.iat !== 'number' || !Number.isFinite(parsed.iat)) {
      return null;
    }
    if (parsed.iat > nowMs + MAX_CLOCK_SKEW_MS) {
      return null;
    }
    const exp =
      typeof parsed.exp === 'number' && Number.isFinite(parsed.exp)
        ? parsed.exp
        : parsed.iat + GUEST_TOKEN_TTL_MS;
    if (nowMs >= exp) {
      return null;
    }
    return {
      guestId: parsed.gid,
      guestUid: `guest:${parsed.gid}`,
    };
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

export function extractGuestTokenDetails(req: Request): {
  token: string | null;
  source: 'header' | 'cookie' | 'none';
} {
  const headerVal = req.headers[GUEST_HEADER_NAME];
  if (typeof headerVal === 'string' && headerVal.trim()) {
    return { token: headerVal.trim(), source: 'header' };
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[GUEST_COOKIE_NAME]) {
    return { token: cookies[GUEST_COOKIE_NAME], source: 'cookie' };
  }
  return { token: null, source: 'none' };
}

export function extractGuestTokenFromRequest(req: Request): string | null {
  return extractGuestTokenDetails(req).token;
}

export function isCrossSiteCookieMutation(
  req: Request,
  options?: { requirePositiveSameOrigin?: boolean }
): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return false;
  }
  const fetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') {
    return true;
  }

  const host = req.headers['x-forwarded-host'] || req.get('host');
  const requestHost = host ? String(host).split(',')[0].trim() : null;
  let verifiedSameOrigin = fetchSite === 'same-origin';

  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.trim()) {
    if (!requestHost) return true;
    try {
      const originHost = new URL(origin).host;
      if (originHost !== requestHost) {
        return true;
      }
      verifiedSameOrigin = true;
    } catch {
      return true;
    }
  }

  const referer = req.headers.referer;
  if (typeof referer === 'string' && referer.trim()) {
    if (!requestHost) return true;
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== requestHost) {
        return true;
      }
      verifiedSameOrigin = true;
    } catch {
      return true;
    }
  }

  if (options?.requirePositiveSameOrigin && !verifiedSameOrigin) {
    return true;
  }

  return false;
}

function getCookieFlags(req: Request) {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    secure: isHttps,
    path: '/',
  };
}

export function setGuestCookie(res: Response, req: Request, token: string) {
  res.cookie(GUEST_COOKIE_NAME, token, {
    ...getCookieFlags(req),
    maxAge: GUEST_TOKEN_TTL_MS,
  });
}

export function clearGuestCookie(res: Response, req: Request) {
  res.clearCookie(GUEST_COOKIE_NAME, getCookieFlags(req));
}
