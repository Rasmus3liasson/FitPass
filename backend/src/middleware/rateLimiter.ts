import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'För många försök. Försök igen om 15 minuter.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use IP + endpoint as key
  keyGenerator: (req) => {
    // For authenticated requests, use user ID
    const userId = (req as any).userId;
    if (userId) {
      return `auth:${userId}:${req.path}`;
    }
    // For unauthenticated, use IP
    return `auth:${req.ip}:${req.path}`;
  },
  // Skip rate limiting for successful requests (only count failures)
  skip: (req, res) => {
    // If response is 200/201, don't count against limit
    return res.statusCode < 400;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'För många försök',
      message: 'Du har försökt för många gånger. Vänta 15 minuter innan du försöker igen.',
      retryAfter: 15 * 60, // 15 minutes in seconds
    });
  },
});

/**
 * Stricter rate limiter for sensitive operations
 * E.g., password reset, email verification
 */
export const strictRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    error: 'För många försök. Försök igen om 1 timme.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `strict:${req.ip}:${req.path}`,
  handler: (req, res) => {
    res.status(429).json({
      error: 'För många försök',
      message: 'Du har överstigit gränsen för denna åtgärd. Försök igen om 1 timme.',
      retryAfter: 60 * 60, // 1 hour in seconds
    });
  },
});

/**
 * General API rate limiter
 * Prevents API abuse
 */
export const generalRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'För många förfrågningar. Försök igen senare.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).userId;
    return userId ? `api:${userId}` : `api:${req.ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'För många förfrågningar',
      message: 'Du har gjort för många förfrågningar. Vänligen vänta innan du försöker igen.',
      retryAfter: 15 * 60, // 15 minutes in seconds
    });
  },
});

/**
 * Payment operation rate limiter
 * Extra protection for financial operations
 */
export const paymentRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 payment operations per 5 minutes
  message: {
    error: 'För många betalningsförsök.',
    retryAfter: 5 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).userId;
    return `payment:${userId || req.ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'För många betalningsförsök',
      message: 'Du har gjort för många betalningsförsök. Vänta några minuter.',
      retryAfter: 5 * 60, // 5 minutes in seconds
    });
  },
});
