import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitOptions {
  windowMs: number; // Duration in milliseconds
  max: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
}

/**
 * Lightweight, in-memory sliding-window rate limiter for Express
 */
export function createRateLimiter(options: RateLimitOptions) {
  const store: RateLimitStore = {};
  const { windowMs, max, message } = options;

  // Periodic cleanup every 2 minutes to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime <= now) {
        delete store[key];
      }
    }
  }, 120000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate identifier from IP + route or client header
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    let record = store[key];

    if (!record || record.resetTime <= now) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store[key] = record;
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        message:
          message ||
          `बहुत अधिक अनुरोध। कृपया ${retryAfterSeconds} सेकंड बाद पुनः प्रयास करें। (Too many requests. Please try again after ${retryAfterSeconds} seconds.)`,
        retryAfter: retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

// Strict limiter for authentication (25 requests per 10 minutes)
export const authRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message:
    'सुरक्षा हेतु: लॉगिन/पंजीकरण के बहुत अधिक प्रयास किए गए। कृपया 10 मिनट बाद पुनः प्रयास करें। (Security: Too many authentication attempts. Please try again in 10 minutes.)',
});

// Standard API limiter (300 requests per 5 minutes)
export const apiRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 300,
  message:
    'बहुत अधिक API अनुरोध किए गए। कृपया कुछ समय बाद पुनः प्रयास करें। (Too many API requests. Please slow down.)',
});
