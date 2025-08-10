import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../database/connection';
import { users, userSessions, companyUsers, apiKeys, companies } from '../database/schema';
import { eq, and, or } from 'drizzle-orm';

// 🔐 Environment variables with secure defaults
const JWT_SECRET: string = process.env.JWT_SECRET || 'kmp-supply-chain-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = 12;

// 📝 Type definitions
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId?: number;
  role?: 'admin' | 'user' | 'viewer';
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companies: Array<{
      id: number;
      name: string;
      role: string;
    }>;
  };
}

export interface ApiKeyData {
  name: string;
  scopes: string[];
  expiresAt?: Date;
}

export interface ApiKeyResult {
  id: number;
  key: string; // Only returned on creation
  keyPrefix: string;
  name: string;
  scopes: string[];
  expiresAt: Date | null;
  createdAt: Date;
}

// 🛡️ Authentication Service Class
export class AuthService {
  
  // 🔒 Password Utilities
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // 🎫 JWT Token Management
  static generateJWT(payload: any): string {
    return (jwt.sign as any)(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyJWT(token: string): any {
    try {
      return (jwt.verify as any)(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // 👤 User Registration
  static async registerUser(data: RegisterData): Promise<AuthToken> {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'user',
        emailVerified: false, // In production, require email verification
      })
      .returning();

    // If companyId provided, associate user with company
    if (data.companyId) {
      await db.insert(companyUsers).values({
        userId: newUser.id,
        companyId: data.companyId,
        role: data.role || 'member',
      });
    }

    // Generate auth token
    return this.generateAuthToken(newUser.id);
  }

  // 🔑 User Login
  static async loginUser(credentials: LoginCredentials): Promise<AuthToken> {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.email, credentials.email.toLowerCase()),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate auth token
    return this.generateAuthToken(user.id);
  }

  // 🎫 Generate Complete Auth Token
  static async generateAuthToken(userId: number): Promise<AuthToken> {
    // Get user with company relationships
    const userWithCompanies = await this.getUserWithCompanies(userId);
    
    if (!userWithCompanies) {
      throw new Error('User not found');
    }

    // Generate JWT payload
    const payload = {
      userId: userWithCompanies.id,
      email: userWithCompanies.email,
      role: userWithCompanies.role,
      companies: userWithCompanies.companies.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role
      }))
    };

    const token = this.generateJWT(payload);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await db.insert(userSessions).values({
      userId,
      tokenHash,
      expiresAt,
      isActive: true,
    });

    return {
      token,
      expiresAt,
      user: {
        id: userWithCompanies.id,
        email: userWithCompanies.email,
        firstName: userWithCompanies.firstName,
        lastName: userWithCompanies.lastName,
        role: userWithCompanies.role,
        companies: userWithCompanies.companies
      }
    };
  }

  // 👥 Get User with Company Relationships
  static async getUserWithCompanies(userId: number) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isActive, true)))
      .limit(1);

    if (!user) return null;

    // Get user's companies
    const userCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        role: companyUsers.role,
      })
      .from(companyUsers)
      .innerJoin(companies, eq(companyUsers.companyId, companies.id))
      .where(eq(companyUsers.userId, userId));

    return {
      ...user,
      companies: userCompanies
    };
  }

  // ✅ Validate Token
  static async validateToken(token: string): Promise<any> {
    try {
      // Verify JWT
      const payload = this.verifyJWT(token);
      
      // Check if session exists and is active
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const [session] = await db
        .select()
        .from(userSessions)
        .where(and(
          eq(userSessions.tokenHash, tokenHash),
          eq(userSessions.isActive, true)
        ))
        .limit(1);

      if (!session) {
        throw new Error('Session not found or expired');
      }

      if (session.expiresAt < new Date()) {
        // Mark session as inactive
        await db
          .update(userSessions)
          .set({ isActive: false, revokedAt: new Date() })
          .where(eq(userSessions.id, session.id));
        
        throw new Error('Session expired');
      }

      return payload;
    } catch (error) {
      throw new Error(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🚪 Logout (Revoke Token)
  static async logout(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    await db
      .update(userSessions)
      .set({ isActive: false, revokedAt: new Date() })
      .where(eq(userSessions.tokenHash, tokenHash));
  }

  // 🔑 API Key Management
  static async createApiKey(userId: number, companyId: number, data: ApiKeyData): Promise<ApiKeyResult> {
    // Generate secure API key
    const key = `kmp_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const keyPrefix = key.substring(0, 12);

    // Store API key
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        name: data.name,
        keyHash,
        keyPrefix,
        companyId,
        userId,
        scopes: data.scopes,
        expiresAt: data.expiresAt || null,
        isActive: true,
      })
      .returning();

    return {
      id: apiKey.id,
      key, // Only returned on creation!
      keyPrefix: apiKey.keyPrefix,
      name: apiKey.name,
      scopes: apiKey.scopes as string[],
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  // 🔍 Validate API Key
  static async validateApiKey(key: string): Promise<any> {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    
    const [apiKey] = await db
      .select({
        id: apiKeys.id,
        companyId: apiKeys.companyId,
        userId: apiKeys.userId,
        scopes: apiKeys.scopes,
        expiresAt: apiKeys.expiresAt,
        company: {
          id: companies.id,
          name: companies.name,
        },
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(apiKeys)
      .innerJoin(companies, eq(apiKeys.companyId, companies.id))
      .innerJoin(users, eq(apiKeys.userId, users.id))
      .where(and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true)
      ))
      .limit(1);

    if (!apiKey) {
      throw new Error('Invalid API key');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new Error('API key expired');
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    return {
      apiKeyId: apiKey.id,
      userId: apiKey.userId,
      companyId: apiKey.companyId,
      scopes: apiKey.scopes,
      company: apiKey.company,
      user: apiKey.user,
    };
  }

  // 📋 List User's API Keys
  static async getUserApiKeys(userId: number, companyId?: number): Promise<any[]> {
    const whereConditions = [eq(apiKeys.userId, userId), eq(apiKeys.isActive, true)];
    
    if (companyId) {
      whereConditions.push(eq(apiKeys.companyId, companyId));
    }

    return db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        companyId: apiKeys.companyId,
        companyName: companies.name,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .innerJoin(companies, eq(apiKeys.companyId, companies.id))
      .where(and(...whereConditions))
      .orderBy(apiKeys.createdAt);
  }

  // 🗑️ Revoke API Key
  static async revokeApiKey(keyId: number, userId: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, userId)
      ));
  }

  // 🏢 Check User Company Access
  static async hasCompanyAccess(userId: number, companyId: number, requiredRole?: string): Promise<boolean> {
    const [access] = await db
      .select()
      .from(companyUsers)
      .where(and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.companyId, companyId)
      ))
      .limit(1);

    if (!access) return false;

    if (requiredRole) {
      // Define role hierarchy: owner > admin > member > viewer
      const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };
      const userRole = roleHierarchy[access.role as keyof typeof roleHierarchy] || 0;
      const reqRole = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
      
      return userRole >= reqRole;
    }

    return true;
  }
} 