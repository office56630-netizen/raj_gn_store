import { rateLimit } from 'express-rate-limit';

interface RateLimitOptions {
  windowMs: number; // Duration in milliseconds
  max: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
}

export function createRateLimiter(options: RateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    message: {
      success: false,
      message:
        options.message ||
        'बहुत अधिक अनुरोध। कृपया कुछ समय बाद पुनः प्रयास करें। (Too many requests. Please try again later.)',
    },
    skipSuccessfulRequests: options.skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
  });
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
