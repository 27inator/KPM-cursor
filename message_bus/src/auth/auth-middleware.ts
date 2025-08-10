import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth-service';

// 🔐 Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        companies: Array<{
          id: number;
          name: string;
          role: string;
        }>;
      };
      apiKey?: {
        apiKeyId: number;
        userId: number;
        companyId: number;
        scopes: string[];
        company: {
          id: number;
          name: string;
        };
        user: {
          id: number;
          email: string;
          firstName: string;
          lastName: string;
        };
      };
    }
  }
}

// 🎫 JWT Authentication Middleware
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Bearer token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const payload = await AuthService.validateToken(token);
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        companies: payload.companies
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: error instanceof Error ? error.message : 'Token validation failed'
      });
    }
  } catch (error) {
    console.error('🚨 [Auth] JWT authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

// 🔑 API Key Authentication Middleware
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'API key required in X-API-Key header'
      });
    }

    try {
      const keyData = await AuthService.validateApiKey(apiKey);
      req.apiKey = keyData;
      
      // Also populate user data for consistency
      req.user = {
        id: keyData.user.id,
        email: keyData.user.email,
        role: 'api', // API keys have special role
        companies: [{ // API keys are tied to one company
          id: keyData.company.id,
          name: keyData.company.name,
          role: 'api_access'
        }]
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: error instanceof Error ? error.message : 'API key validation failed'
      });
    }
  } catch (error) {
    console.error('🚨 [Auth] API key authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during API key validation'
    });
  }
};

// 🔀 Flexible Authentication (JWT OR API Key)
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const hasJWT = req.headers.authorization?.startsWith('Bearer ');
  const hasApiKey = req.headers['x-api-key'];

  if (hasJWT) {
    return authenticateJWT(req, res, next);
  } else if (hasApiKey) {
    return authenticateApiKey(req, res, next);
  } else {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Provide either Bearer token or X-API-Key header'
    });
  }
};

// 🏢 Company Access Control Middleware
export const requireCompanyAccess = (requiredRole?: 'owner' | 'admin' | 'member' | 'viewer') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      if (!companyId || isNaN(companyId)) {
        return res.status(400).json({
          error: 'Invalid company ID',
          message: 'Company ID must be a valid number'
        });
      }

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User context not found'
        });
      }

      // For API keys, check if the key is for this company
      if (req.apiKey) {
        if (req.apiKey.companyId !== companyId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'API key does not have access to this company'
          });
        }
        
        // Check API key scopes if required role is specified
        if (requiredRole) {
          const requiredScope = `${requiredRole}:company`;
          if (!req.apiKey.scopes.includes(requiredScope) && !req.apiKey.scopes.includes('admin:all')) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              message: `API key requires ${requiredScope} scope`
            });
          }
        }
        
        return next();
      }

      // For JWT tokens, check user's company membership
      const userCompany = req.user.companies.find(c => c.id === companyId);
      
      if (!userCompany) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'User does not have access to this company'
        });
      }

      // Check role hierarchy if required
      if (requiredRole) {
        const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };
        const userRole = roleHierarchy[userCompany.role as keyof typeof roleHierarchy] || 0;
        const reqRole = roleHierarchy[requiredRole] || 0;
        
        if (userRole < reqRole) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: `Requires ${requiredRole} role or higher`
          });
        }
      }

      next();
    } catch (error) {
      console.error('🚨 [Auth] Company access control error:', error);
      return res.status(500).json({
        error: 'Authorization error',
        message: 'Internal server error during authorization'
      });
    }
  };
};

// 🔒 Scope-based Permission Middleware (for API keys)
export const requireScope = (requiredScopes: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.apiKey) {
        return res.status(401).json({
          error: 'API key required',
          message: 'This endpoint requires API key authentication'
        });
      }

      const scopes = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];
      const apiKeyScopes = req.apiKey.scopes;

      // Check if API key has admin:all scope (bypasses all checks)
      if (apiKeyScopes.includes('admin:all')) {
        return next();
      }

      // Check if API key has any of the required scopes
      const hasRequiredScope = scopes.some(scope => apiKeyScopes.includes(scope));
      
      if (!hasRequiredScope) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `API key requires one of these scopes: ${scopes.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('🚨 [Auth] Scope validation error:', error);
      return res.status(500).json({
        error: 'Authorization error',
        message: 'Internal server error during scope validation'
      });
    }
  };
};

// 🛡️ Admin Role Middleware
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User context not found'
      });
    }

    // For API keys, check admin scope
    if (req.apiKey) {
      if (!req.apiKey.scopes.includes('admin:all')) {
        return res.status(403).json({
          error: 'Admin access required',
          message: 'API key requires admin:all scope'
        });
      }
      return next();
    }

    // For JWT tokens, check if user has admin role in any company or global admin
    const isAdmin = req.user.role === 'admin' || 
                   req.user.companies.some(c => c.role === 'admin' || c.role === 'owner');

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'User must have admin role'
      });
    }

    next();
  } catch (error) {
    console.error('🚨 [Auth] Admin check error:', error);
    return res.status(500).json({
      error: 'Authorization error',
      message: 'Internal server error during admin check'
    });
  }
};

// 📊 Optional Authentication (for public endpoints with optional user context)
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const hasJWT = req.headers.authorization?.startsWith('Bearer ');
    const hasApiKey = !!req.headers['x-api-key'];

    if (hasJWT) {
      try {
        const token = req.headers.authorization!.substring(7);
        const payload = await AuthService.validateToken(token);
        req.user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          companies: payload.companies
        };
      } catch (e) {
        // Swallow user JWT errors for optional path
      }
    } else if (hasApiKey) {
      try {
        const keyData = await AuthService.validateApiKey(String(req.headers['x-api-key']));
        req.apiKey = keyData;
        req.user = {
          id: keyData.user.id,
          email: keyData.user.email,
          role: 'api',
          companies: [{ id: keyData.company.id, name: keyData.company.name, role: 'api_access' }]
        };
      } catch (e) {
        // Swallow API key errors for optional path
      }
    }

    next();
  } catch (error) {
    console.error('🚨 [Auth] Optional authentication error:', error);
    next();
  }
};

// 🧪 Development-only bypass (DO NOT USE IN PRODUCTION)
export const devBypass = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
    console.warn('⚠️ [Auth] DEV BYPASS ACTIVE - Skipping authentication');
    
    // Mock user for development
    req.user = {
      id: 1,
      email: 'dev@example.com',
      role: 'admin',
      companies: [{ id: 1, name: 'Test Company', role: 'owner' }]
    };
    
    return next();
  }
  
  // In production or if bypass is disabled, require real auth
  return authenticate(req, res, next);
}; 