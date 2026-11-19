import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * Creates an in-memory rate limiting middleware for sensitive endpoints.
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 min)
 * @param maxRequests Maximum allowed requests in the window
 * @param endpointKey Unique tag for endpoint tracking
 */
export function createRateLimiter(
  windowMs: number = 60000,
  maxRequests: number = 20,
  endpointKey: string = 'general'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, bypass rate limits
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const callerUid = (req as any).staffSession?.uid || '';
    const key = `${endpointKey}:${callerUid || clientIp}`;
    const now = Date.now();

    let record = memoryStore.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      memoryStore.set(key, record);
      return next();
    }

    record.count += 1;

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: 'Too many requests. Please slow down.',
        retryAfterSeconds,
      });
      return;
    }

    return next();
  };
}
