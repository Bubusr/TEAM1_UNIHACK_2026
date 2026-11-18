import type { NextFunction, Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.ts';

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}) {
  const store = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const identity =
      authReq.user?.uid ||
      req.ip ||
      req.socket.remoteAddress ||
      'anonymous';
    const key = `${options.keyPrefix}:${identity}`;
    const now = Date.now();

    const existing = store.get(key);
    if (!existing || now >= existing.resetAt) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      );
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: `Too many requests. Please wait ${retryAfterSec}s before trying again.`,
      });
    }

    existing.count += 1;
    return next();
  };
}
