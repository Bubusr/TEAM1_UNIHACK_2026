import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import {
  extractGuestTokenDetails,
  isCrossSiteCookieMutation,
  verifyGuestSessionToken,
} from '../server/guestSession.ts';

export interface GameActor {
  uid: string;
  email: string;
  displayName: string;
  isGuest: boolean;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  actor?: GameActor;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Sign in required to perform this action.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  if (process.env.NODE_ENV !== 'production' && token.startsWith('dev-keeper:')) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.slice('dev-keeper:'.length), 'base64').toString('utf8')
      );
      req.user = payload as DecodedIdToken;
      req.actor = {
        uid: payload.uid || 'dev-keeper-001',
        email: payload.email || 'keeper@pawsandpicket.local',
        displayName: payload.displayName || 'Dev Keeper',
        isGuest: false,
      };
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid dev keeper session.' });
    }
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    req.actor = {
      uid: decoded.uid,
      email: decoded.email || '',
      displayName: decoded.name || decoded.email?.split('@')[0] || 'Keeper',
      isGuest: false,
    };
    return next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};

export async function resolveOptionalGameActor(
  req: Request
): Promise<GameActor | null> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      const err = new Error('Missing authentication token.');
      (err as Error & { statusCode?: number }).statusCode = 401;
      throw err;
    }
    if (
      process.env.NODE_ENV !== 'production' &&
      token.startsWith('dev-keeper:')
    ) {
      try {
        const payload = JSON.parse(
          Buffer.from(token.slice('dev-keeper:'.length), 'base64').toString('utf8')
        );
        return {
          uid: payload.uid || 'dev-keeper-001',
          email: payload.email || 'keeper@pawsandpicket.local',
          displayName: payload.displayName || 'Dev Keeper',
          isGuest: false,
        };
      } catch {
        const err = new Error('Invalid dev keeper session.');
        (err as Error & { statusCode?: number }).statusCode = 401;
        throw err;
      }
    }
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email || '',
        displayName: decoded.name || decoded.email?.split('@')[0] || 'Keeper',
        isGuest: false,
      };
    } catch {
      const err = new Error('Invalid or expired session token.');
      (err as Error & { statusCode?: number }).statusCode = 401;
      throw err;
    }
  }

  const { token: guestToken, source } = extractGuestTokenDetails(req);
  if (
    source === 'cookie' &&
    isCrossSiteCookieMutation(req, { requirePositiveSameOrigin: true })
  ) {
    const err = new Error('Cross-site cookie mutation rejected.');
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }

  const guest = verifyGuestSessionToken(guestToken);
  if (guest) {
    return {
      uid: guest.guestUid,
      email: `${guest.guestId}@guest.local`,
      displayName: 'Guest Keeper',
      isGuest: true,
    };
  }

  return null;
}

export const requireGameActor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = await resolveOptionalGameActor(req);
    if (!actor) {
      return res
        .status(401)
        .json({ error: 'Sign in or initialize a guest session first.' });
    }
    req.actor = actor;
    return next();
  } catch (error) {
    const code =
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 401;
    const msg =
      error instanceof Error ? error.message : 'Authentication failed.';
    return res.status(code).json({ error: msg });
  }
};
