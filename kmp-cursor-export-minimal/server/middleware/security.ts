import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// General rate limiting (relaxed for development)
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  skip: (req) => {
    // Skip rate limiting for health checks, static assets, and API calls
    return req.path === '/health' || 
           req.path === '/api/health' || 
           req.path.startsWith('/src/') ||
           req.path.startsWith('/node_modules/') ||
           req.path.startsWith('/@') ||
           req.path.includes('vite') ||
           req.path.includes('hmr');
  },
});

// API rate limiting (more restrictive)
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 API requests per windowMs
  message: {
    error: 'Too many API requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Relaxed CSP for development
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss: http: https:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; font-src 'self' data:;");
  } else {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;");
  }
  
  // Remove powered by header
  res.removeHeader('X-Powered-By');
  
  next();
};

// Request validation middleware (relaxed for development)
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Skip validation for development assets
  if (req.path.startsWith('/src/') || 
      req.path.startsWith('/node_modules/') || 
      req.path.startsWith('/@') ||
      req.path.includes('vite') ||
      req.path.includes('hmr')) {
    return next();
  }
  
  // Validate content-type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('application/x-www-form-urlencoded'))) {
      return res.status(400).json({
        error: 'Invalid content-type. Expected application/json or application/x-www-form-urlencoded'
      });
    }
  }
  
  // Validate request size
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({
      error: 'Request entity too large'
    });
  }
  
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Skip sanitization for development assets
  if (req.path.startsWith('/src/') || 
      req.path.startsWith('/node_modules/') || 
      req.path.startsWith('/@') ||
      req.path.includes('vite') ||
      req.path.includes('hmr')) {
    return next();
  }
  
  // Sanitize string inputs to prevent XSS
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/javascript:/gi, '')
             .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Auth rate limiting for login attempts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5000',
    'https://localhost:5000',
    process.env.REPLIT_DOMAINS?.split(',').map(domain => `https://${domain}`) || []
  ].flat();

  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};