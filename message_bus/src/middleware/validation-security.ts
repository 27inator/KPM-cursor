/**
 * 🛡️ VALIDATION & SECURITY MIDDLEWARE
 * Input validation, rate limiting, and security protection
 */

import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// 🚦 Rate Limiting Configuration
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit login attempts
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const supplyChainRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 events per minute per IP
  message: 'Too many supply chain events, please slow down.',
});

// Per-device rate limit (uses PEA device header if present)
export const supplyChainDeviceRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60, // 60 events/min/device
  keyGenerator: (req) => (req.header('X-PEA-Device-Id') ?? 'anonymous-device'),
  message: 'Too many events from this device, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const transactionQueryRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 transaction queries per minute
  message: 'Too many transaction queries, please slow down.',
});

// 🔍 Input Validation Schemas

// Supply Chain Event Validation
export const validateSupplyChainEvent = [
  body('productId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Product ID must be alphanumeric with underscores/hyphens'),
    
  body('location')
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Location is required and must be under 200 characters'),
    
  body('eventType')
    .isString()
    .isIn(['QUALITY_CHECK', 'SHIPMENT', 'DELIVERY', 'INSPECTION', 'CERTIFICATION', 'RECALL', 'CUSTOM'])
    .withMessage('Invalid event type'),
    
  body('batchId')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Batch ID must be under 100 characters'),
    
  body('metadata')
    .optional()
    .isObject()
    .custom((value) => {
      const stringified = JSON.stringify(value);
      if (stringified.length > 50000) { // 50KB limit for metadata
        throw new Error('Metadata too large (max 50KB)');
      }
      return true;
    }),
];

// Authentication Validation
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, and number'),
    
  body('firstName')
    .isString()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage('First name must be 1-50 characters, letters only'),
    
  body('lastName')
    .isString()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage('Last name must be 1-50 characters, letters only'),
    
  body('companyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer'),
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
    
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
];

// API Key Validation
export const validateApiKeyCreation = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9\s_-]+$/)
    .withMessage('API key name must be alphanumeric with spaces, underscores, or hyphens'),
    
  body('scopes')
    .optional()
    .isArray()
    .custom((scopes) => {
      const validScopes = ['read', 'write', 'admin', 'events:create', 'events:read', 'transactions:read'];
      return scopes.every((scope: string) => validScopes.includes(scope));
    })
    .withMessage('Invalid scopes provided'),
];

// Parameter Validation
export const validateTransactionHash = [
  param('transactionHash')
    .matches(/^[a-f0-9]{64}$/)
    .withMessage('Invalid transaction hash format'),
];

export const validateCompanyId = [
  param('companyId')
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer'),
];

export const validateProductId = [
  param('productId')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Invalid product ID format'),
];

// 🛡️ Validation Error Handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: any) => ({
      field: error.path || error.param || 'unknown',
      message: error.msg || 'Validation error',
      value: error.value
    }));
    
    console.log(`❌ [Validation] Validation failed for ${req.method} ${req.path}:`, formattedErrors);
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors
    });
  }
  
  next();
};

// 🔒 Advanced Joi Schema Validation (for complex objects)
export const supplyChainEventSchema = Joi.object({
  productId: Joi.string().pattern(/^[A-Z0-9_-]+$/).min(1).max(100).required(),
  batchId: Joi.string().max(100).optional(),
  location: Joi.string().min(1).max(200).required(),
  eventType: Joi.string().valid(
    'QUALITY_CHECK', 'SHIPMENT', 'DELIVERY', 'INSPECTION', 
    'CERTIFICATION', 'RECALL', 'CUSTOM'
  ).required(),
  metadata: Joi.object().optional(),
  timestamp: Joi.date().iso().optional()
});

// 🧼 Data Sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potential script tags or dangerous content
  const sanitizeString = (str: string) => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body (safe to modify)
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Skip sanitizing query and params as they're read-only in Express
  // The validation middleware will handle dangerous input in these
  
  next();
};

// 🔐 Advanced Joi Validation Middleware
export const validateWithJoi = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      console.log(`❌ [Joi] Validation failed for ${req.method} ${req.path}:`, details);

      return res.status(400).json({
        success: false,
        error: 'Schema validation failed',
        details
      });
    }

    // Replace body with validated and sanitized value
    req.body = value;
    next();
  };
};

// 🚨 Security Headers Middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
};

// 📊 Request Logging for Security Monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };
    
    // Log suspicious activities
    if (res.statusCode >= 400) {
      console.log(`🚨 [Security] Suspicious request:`, logData);
    }
  });
  
  next();
}; 