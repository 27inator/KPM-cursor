import express from 'express';
import { AuthService } from './auth-service';
import { UserService, CompanyService } from '../database/services';
import { authenticate, requireCompanyAccess, requireAdmin, optionalAuth } from './auth-middleware';

const router = express.Router();

// 📝 Input validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
  }
  return { valid: true };
};

// 🔐 Authentication Endpoints

// 📝 User Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyId, role } = req.body;

    // Input validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, firstName, and lastName are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Invalid password',
        message: passwordValidation.message
      });
    }

    // Check if company exists (if provided)
    if (companyId) {
      const company = await CompanyService.getCompanyById(companyId);
      if (!company) {
        return res.status(400).json({
          error: 'Invalid company',
          message: 'Company not found'
        });
      }
    }

    // Register user
    const authToken = await AuthService.registerUser({
      email,
      password,
      firstName,
      lastName,
      companyId,
      role
    });

    console.log(`✅ [Auth] User registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: authToken.user,
      token: authToken.token,
      expiresAt: authToken.expiresAt
    });

  } catch (error) {
    console.error('🚨 [Auth] Registration error:', error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'User already exists',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error during registration'
    });
  }
});

// 🔑 User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Attempt login
    const authToken = await AuthService.loginUser({ email, password });

    console.log(`✅ [Auth] User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: authToken.user,
      token: authToken.token,
      expiresAt: authToken.expiresAt
    });

  } catch (error) {
    console.error('🚨 [Auth] Login error:', error);
    
    if (error instanceof Error && error.message.includes('Invalid email or password')) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid email or password'
      });
    }

    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error during login'
    });
  }
});

// 🚪 User Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await AuthService.logout(token);
    }

    console.log(`✅ [Auth] User logged out: ${req.user?.email}`);

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('🚨 [Auth] Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Internal server error during logout'
    });
  }
});

// 👤 Get Current User Profile
router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User context not available'
      });
    }

    // Get fresh user data with companies
    const userWithCompanies = await AuthService.getUserWithCompanies(req.user.id);
    
    if (!userWithCompanies) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    res.json({
      user: {
        id: userWithCompanies.id,
        email: userWithCompanies.email,
        firstName: userWithCompanies.firstName,
        lastName: userWithCompanies.lastName,
        role: userWithCompanies.role,
        companies: userWithCompanies.companies
      }
    });

  } catch (error) {
    console.error('🚨 [Auth] Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: 'Internal server error'
    });
  }
});

// 🔑 API Key Management Endpoints

// 📝 Create API Key
router.post('/api-keys', authenticate, async (req, res) => {
  try {
    const { name, scopes, companyId, expiresAt } = req.body;

    if (!name || !scopes || !companyId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, scopes, and companyId are required'
      });
    }

    if (!Array.isArray(scopes) || scopes.length === 0) {
      return res.status(400).json({
        error: 'Invalid scopes',
        message: 'Scopes must be a non-empty array'
      });
    }

    // Check if user has access to the company
    if (!req.user?.companies.find(c => c.id === companyId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'User does not have access to this company'
      });
    }

    // Create API key
    const apiKey = await AuthService.createApiKey(req.user.id, companyId, {
      name,
      scopes,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    console.log(`✅ [Auth] API key created: ${name} for company ${companyId}`);

    res.status(201).json({
      message: 'API key created successfully',
      apiKey: {
        id: apiKey.id,
        key: apiKey.key, // ⚠️ Only returned on creation!
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      }
    });

  } catch (error) {
    console.error('🚨 [Auth] Create API key error:', error);
    res.status(500).json({
      error: 'Failed to create API key',
      message: 'Internal server error'
    });
  }
});

// 📋 List User's API Keys
router.get('/api-keys', authenticate, async (req, res) => {
  try {
    const { companyId } = req.query;
    const companyIdNum = companyId ? parseInt(companyId as string) : undefined;

    if (companyIdNum && !req.user?.companies.find(c => c.id === companyIdNum)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'User does not have access to this company'
      });
    }

    const apiKeys = await AuthService.getUserApiKeys(req.user!.id, companyIdNum);

    res.json({
      apiKeys
    });

  } catch (error) {
    console.error('🚨 [Auth] List API keys error:', error);
    res.status(500).json({
      error: 'Failed to list API keys',
      message: 'Internal server error'
    });
  }
});

// 🗑️ Revoke API Key
router.delete('/api-keys/:keyId', authenticate, async (req, res) => {
  try {
    const keyId = parseInt(req.params.keyId);

    if (!keyId || isNaN(keyId)) {
      return res.status(400).json({
        error: 'Invalid key ID',
        message: 'Key ID must be a valid number'
      });
    }

    await AuthService.revokeApiKey(keyId, req.user!.id);

    console.log(`✅ [Auth] API key revoked: ${keyId} by user ${req.user?.id}`);

    res.json({
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('🚨 [Auth] Revoke API key error:', error);
    res.status(500).json({
      error: 'Failed to revoke API key',
      message: 'Internal server error'
    });
  }
});

// 🏢 Company Management (Admin only)

// 📝 Create Company
router.post('/companies', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, walletAddress, mnemonic } = req.body;

    if (!name || !walletAddress || !mnemonic) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, walletAddress, and mnemonic are required'
      });
    }

    // Check if wallet address already exists
    const existingCompany = await CompanyService.findByWalletAddress(walletAddress);
    if (existingCompany) {
      return res.status(409).json({
        error: 'Wallet address already exists',
        message: 'A company with this wallet address already exists'
      });
    }

    // Create company
    const company = await CompanyService.createCompany({
      name,
      walletAddress,
      mnemonic, // TODO: Encrypt this in production!
      isActive: true
    }, req.user!.id);

    console.log(`✅ [Auth] Company created: ${name} by user ${req.user?.email}`);

    res.status(201).json({
      message: 'Company created successfully',
      company: {
        id: company.id,
        name: company.name,
        walletAddress: company.walletAddress,
        isActive: company.isActive,
        createdAt: company.createdAt
      }
    });

  } catch (error) {
    console.error('🚨 [Auth] Create company error:', error);
    res.status(500).json({
      error: 'Failed to create company',
      message: 'Internal server error'
    });
  }
});

// 📋 List Companies (filtered by user access)
router.get('/companies', authenticate, async (req, res) => {
  try {
    // Return only companies the user has access to
    const companies = req.user!.companies.map(c => ({
      id: c.id,
      name: c.name,
      role: c.role
    }));

    res.json({
      companies
    });

  } catch (error) {
    console.error('🚨 [Auth] List companies error:', error);
    res.status(500).json({
      error: 'Failed to list companies',
      message: 'Internal server error'
    });
  }
});

// 👥 Company User Management

// 📋 Get Company Users
router.get('/companies/:companyId/users', authenticate, requireCompanyAccess('admin'), async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    
    const users = await UserService.getCompanyUsers(companyId);

    res.json({
      users
    });

  } catch (error) {
    console.error('🚨 [Auth] Get company users error:', error);
    res.status(500).json({
      error: 'Failed to get company users',
      message: 'Internal server error'
    });
  }
});

// ➕ Add User to Company
router.post('/companies/:companyId/users', authenticate, requireCompanyAccess('admin'), async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'User email is required'
      });
    }

    // Find user by email
    const user = await UserService.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with this email address'
      });
    }

    // Add user to company
    await UserService.addUserToCompany(user.id, companyId, role);

    console.log(`✅ [Auth] User ${email} added to company ${companyId} with role ${role}`);

    res.status(201).json({
      message: 'User added to company successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role
      }
    });

  } catch (error) {
    console.error('🚨 [Auth] Add user to company error:', error);
    res.status(500).json({
      error: 'Failed to add user to company',
      message: 'Internal server error'
    });
  }
});

// ➖ Remove User from Company
router.delete('/companies/:companyId/users/:userId', authenticate, requireCompanyAccess('admin'), async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const userId = parseInt(req.params.userId);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    await UserService.removeUserFromCompany(userId, companyId);

    console.log(`✅ [Auth] User ${userId} removed from company ${companyId}`);

    res.json({
      message: 'User removed from company successfully'
    });

  } catch (error) {
    console.error('🚨 [Auth] Remove user from company error:', error);
    res.status(500).json({
      error: 'Failed to remove user from company',
      message: 'Internal server error'
    });
  }
});

// 🔍 Validation endpoint (for frontend to check auth status)
router.get('/validate', optionalAuth, (req, res) => {
  res.json({
    authenticated: !!req.user,
    user: req.user || null
  });
});

export default router; 