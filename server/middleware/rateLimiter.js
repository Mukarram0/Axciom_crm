const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints (prevents credential brute-forcing)
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * General API rate limiter (DoS & burst protection)
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Request limit exceeded. Please throttle your requests.',
  },
});

module.exports = {
  authRateLimiter,
  apiRateLimiter,
};
