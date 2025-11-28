const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting for different routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'محاولات كثيرة، حاول مرة أخرى بعد 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// CSP configuration for production
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    scriptSrcAttr: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'"],
    frameSrc: ["'self'"]
  }
};

module.exports = [
  helmet({
    contentSecurityPolicy: cspConfig,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' }
  }),
  generalLimiter
];