import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

/**
 * Lightweight in-memory rate limiter for sensitive endpoints.
 * 
 * @param windowMs - Time window in milliseconds (default 1 minute)
 * @param maxRequests - Maximum allowed requests within window (default 60)
 * @param message - Custom error message
 */
export function rateLimiter(
  windowMs: number = 60 * 1000,
  maxRequests: number = 60,
  message: string = 'Too many requests, please try again later.'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${ip}_${req.baseUrl || req.path}`;
    const now = Date.now();

    const record = store[key];

    if (!record || now > record.resetTime) {
      store[key] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds,
      });
    }

    record.count += 1;
    next();
  };
}

// Preset rate limiters for sensitive endpoints
export const authLimiter = rateLimiter(60 * 1000, 30, 'Too many login/signup attempts. Please wait 1 minute.');
export const aiLimiter = rateLimiter(60 * 1000, 30, 'Too many AI diagnosis requests. Please wait 1 minute.');
export const exportLimiter = rateLimiter(60 * 1000, 20, 'Too many export requests. Please wait 1 minute.');
export const actionLimiter = rateLimiter(60 * 1000, 60, 'Too many recovery action requests. Please wait 1 minute.');
export const standardLimiter = rateLimiter(60 * 1000, 120, 'Too many requests. Please slow down.');

