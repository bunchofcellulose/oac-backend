const rateLimit = require('express-rate-limit');

// Rate limiting for registration endpoint
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many registration attempts',
    message: 'Please try again later. You can only register 5 times per 15 minutes.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many registration attempts',
      message: 'Please try again later. You can only register 5 times per 15 minutes.',
      retryAfter: 15 * 60
    });
  }
});

// General rate limiting for all API endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

module.exports = {
  registerLimiter,
  generalLimiter
};
