import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import rateLimit from 'express-rate-limit';

// Security middleware for audit logging
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    
    // Log audit trail
    storage.createAuditLog({
      action: `${req.method.toLowerCase()}_request`,
      userId: (req as any).user?.id?.toString(),
      companyId: (req as any).user?.companyId,
      resourceType: req.path.split('/')[2] || 'general',
      ipAddress: req.ip,
      metadata: {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        requestId: generateRequestId(),
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        success: res.statusCode < 400
      }
    }).catch(error => {
      console.error('Failed to create audit log:', error);
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Development-friendly limit
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development Vite requests
    return req.url.startsWith('/@') || req.url.startsWith('/src/');
  }
});

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy - relaxed for development
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' ws: wss:;"
  );
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Development-friendly headers
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  
  next();
};

// Request validation middleware
export const requestValidator = (req: Request, res: Response, next: NextFunction) => {
  // Input sanitization for query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    }
  }
  
  // Basic XSS protection for request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  
  next();
};

// Helper function to sanitize object properties
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 1000) {
      storage.createSecurityIncident({
        type: 'slow_request',
        severity: 'low',
        description: `Slow request detected: ${req.method} ${req.url} took ${duration}ms`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        resolved: false
      }).catch(error => {
        console.error('Failed to create security incident:', error);
      });
    }
    
    // Log failed requests
    if (res.statusCode >= 400) {
      storage.createSecurityIncident({
        type: 'failed_request',
        severity: res.statusCode >= 500 ? 'high' : 'medium',
        description: `Failed request: ${req.method} ${req.url} returned ${res.statusCode}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        resolved: false
      }).catch(error => {
        console.error('Failed to create security incident:', error);
      });
    }
  });
  
  next();
};

// Helper functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export all middleware
export const securityMiddleware = {
  auditLogger,
  rateLimiter,
  securityHeaders,
  requestValidator,
  performanceMonitor
};