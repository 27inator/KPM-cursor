import { eq, desc, and, gte, lte, sql, count, sum, avg } from 'drizzle-orm';
import { db } from './connection';
import { 
  companies, 
  supplyChainEvents, 
  payloadStorage, 
  blockchainTransactions,
  users,
  userSessions, 
  companyUsers,
  apiKeys,
  type Company, 
  type NewCompany,
  type User,
  type NewUser,
  type CompanyUser,
  type NewCompanyUser,
  type SupplyChainEvent, 
  type NewSupplyChainEvent,
  type PayloadStorage, 
  type NewPayloadStorage,
  type BlockchainTransaction, 
  type NewBlockchainTransaction 
} from './schema';

// 👥 USER SERVICE - Authentication and user management
export class UserService {
  static async createUser(userData: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), eq(users.isActive, true)))
      .limit(1);
    return user || null;
  }

  static async findById(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.isActive, true)))
      .limit(1);
    return user || null;
  }

  static async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  static async getUserCompanies(userId: number) {
    return db
      .select({
        id: companies.id,
        name: companies.name,
        walletAddress: companies.walletAddress,
        role: companyUsers.role,
        joinedAt: companyUsers.createdAt,
      })
      .from(companyUsers)
      .innerJoin(companies, eq(companyUsers.companyId, companies.id))
      .where(eq(companyUsers.userId, userId));
  }

  static async addUserToCompany(userId: number, companyId: number, role: string = 'member'): Promise<CompanyUser> {
    const [relation] = await db
      .insert(companyUsers)
      .values({ userId, companyId, role })
      .returning();
    return relation;
  }

  static async removeUserFromCompany(userId: number, companyId: number): Promise<void> {
    await db
      .delete(companyUsers)
      .where(and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.companyId, companyId)
      ));
  }

  static async getCompanyUsers(companyId: number) {
    return db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: companyUsers.role,
        joinedAt: companyUsers.createdAt,
        lastLoginAt: users.lastLoginAt,
        isActive: users.isActive,
      })
      .from(companyUsers)
      .innerJoin(users, eq(companyUsers.userId, users.id))
      .where(eq(companyUsers.companyId, companyId))
      .orderBy(companyUsers.createdAt);
  }
}

// 🏢 ENHANCED COMPANY SERVICE with user context
export class CompanyService {
  static async createCompany(companyData: NewCompany, createdByUserId?: number): Promise<Company> {
    const [company] = await db.insert(companies).values({
      ...companyData,
      updatedAt: new Date()
    }).returning();

    // If a user created this company, make them the owner
    if (createdByUserId) {
      await db.insert(companyUsers).values({
        userId: createdByUserId,
        companyId: company.id,
        role: 'owner'
      });
    }

    return company;
  }

  static async findByWalletAddress(walletAddress: string): Promise<Company | null> {
    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.walletAddress, walletAddress), eq(companies.isActive, true)))
      .limit(1);
    return company || null;
  }

  static async getAllCompanies(): Promise<Company[]> {
    return db
      .select()
      .from(companies)
      .where(eq(companies.isActive, true))
      .orderBy(companies.createdAt);
  }

  static async getCompanyById(id: number): Promise<Company | null> {
    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.isActive, true)))
      .limit(1);
    return company || null;
  }
}

// 📋 ENHANCED EVENT SERVICE with user tracking
export class EventService {
  static async createEvent(eventData: NewSupplyChainEvent): Promise<SupplyChainEvent> {
    const [event] = await db.insert(supplyChainEvents).values(eventData).returning();
    return event;
  }

  static async findByProductId(productId: string, companyId?: number): Promise<SupplyChainEvent[]> {
    const whereConditions = [eq(supplyChainEvents.productId, productId)];
    if (companyId) {
      whereConditions.push(eq(supplyChainEvents.companyId, companyId));
    }

    return db
      .select()
      .from(supplyChainEvents)
      .where(and(...whereConditions))
      .orderBy(desc(supplyChainEvents.eventTimestamp));
  }

  static async findByCompany(companyId: number, limit: number = 100): Promise<SupplyChainEvent[]> {
    return db
      .select()
      .from(supplyChainEvents)
      .where(eq(supplyChainEvents.companyId, companyId))
      .orderBy(desc(supplyChainEvents.submittedAt))
      .limit(limit);
  }

  static async findByTransactionHash(transactionHash: string): Promise<SupplyChainEvent | null> {
    const [event] = await db
      .select()
      .from(supplyChainEvents)
      .where(eq(supplyChainEvents.transactionHash, transactionHash))
      .limit(1);
    return event || null;
  }

  static async updateEventStatus(id: number, status: string, confirmedAt?: Date): Promise<SupplyChainEvent> {
    const updateData: any = { status };
    if (confirmedAt) {
      updateData.confirmedAt = confirmedAt;
    }

    const [event] = await db
      .update(supplyChainEvents)
      .set(updateData)
      .where(eq(supplyChainEvents.id, id))
      .returning();
    return event;
  }

  static async getDashboardStats(companyId: number) {
    // Use simpler, faster queries instead of complex aggregations
    try {
      const [
        totalEvents,
        confirmedEvents,
        pendingEvents,
        failedEvents,
        offChainEvents
      ] = await Promise.all([
        // Total events
        db.select({ count: count() }).from(supplyChainEvents).where(eq(supplyChainEvents.companyId, companyId)),
        // Confirmed events  
        db.select({ count: count() }).from(supplyChainEvents).where(and(eq(supplyChainEvents.companyId, companyId), eq(supplyChainEvents.status, 'confirmed'))),
        // Pending events
        db.select({ count: count() }).from(supplyChainEvents).where(and(eq(supplyChainEvents.companyId, companyId), eq(supplyChainEvents.status, 'pending'))),
        // Failed events
        db.select({ count: count() }).from(supplyChainEvents).where(and(eq(supplyChainEvents.companyId, companyId), eq(supplyChainEvents.status, 'failed'))),
        // Off-chain events
        db.select({ count: count() }).from(supplyChainEvents).where(and(eq(supplyChainEvents.companyId, companyId), eq(supplyChainEvents.isOffChain, true)))
      ]);

      return {
        totalEvents: totalEvents[0]?.count || 0,
        confirmedEvents: confirmedEvents[0]?.count || 0,
        pendingEvents: pendingEvents[0]?.count || 0,
        failedEvents: failedEvents[0]?.count || 0,
        offChainEvents: offChainEvents[0]?.count || 0,
        totalPayloadSize: 0 // Skip expensive SUM for now
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default stats if query fails
      return {
        totalEvents: 0,
        confirmedEvents: 0,
        pendingEvents: 0,
        failedEvents: 0,
        offChainEvents: 0,
        totalPayloadSize: 0
      };
    }
  }

  static async getRecentEvents(companyId: number, limit: number = 10) {
    return db
      .select({
        id: supplyChainEvents.id,
        productId: supplyChainEvents.productId,
        eventType: supplyChainEvents.eventType,
        location: supplyChainEvents.location,
        status: supplyChainEvents.status,
        isOffChain: supplyChainEvents.isOffChain,
        payloadSize: supplyChainEvents.payloadSize,
        transactionHash: supplyChainEvents.transactionHash,
        eventTimestamp: supplyChainEvents.eventTimestamp,
        submittedAt: supplyChainEvents.submittedAt,
        createdByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(supplyChainEvents)
      .leftJoin(users, eq(supplyChainEvents.createdByUserId, users.id))
      .where(eq(supplyChainEvents.companyId, companyId))
      .orderBy(desc(supplyChainEvents.submittedAt))
      .limit(limit);
  }
}

// 📦 ENHANCED PAYLOAD SERVICE with user tracking  
export class PayloadService {
  static async createPayloadRecord(payloadData: NewPayloadStorage): Promise<PayloadStorage> {
    const [payload] = await db.insert(payloadStorage).values(payloadData).returning();
    return payload;
  }

  static async findByContentHash(contentHash: string): Promise<PayloadStorage | null> {
    const [payload] = await db
      .select()
      .from(payloadStorage)
      .where(eq(payloadStorage.contentHash, contentHash))
      .limit(1);
    return payload || null;
  }

  static async markAsVerified(contentHash: string): Promise<PayloadStorage> {
    const [payload] = await db
      .update(payloadStorage)
      .set({ 
        isVerified: true, 
        lastVerifiedAt: new Date(),
        lastAccessedAt: new Date()
      })
      .where(eq(payloadStorage.contentHash, contentHash))
      .returning();
    return payload;
  }

  static async getStorageStats(companyId?: number) {
    const whereConditions = [];
    if (companyId) {
      whereConditions.push(eq(payloadStorage.companyId, companyId));
    }

    const [stats] = await db
      .select({
        totalPayloads: count(),
        totalOriginalSize: sql<number>`COALESCE(SUM(original_size), 0)`,
        totalCompressedSize: sql<number>`COALESCE(SUM(compressed_size), 0)`,
        verifiedPayloads: sql<number>`COUNT(CASE WHEN is_verified = true THEN 1 END)`,
        avgPayloadSize: sql<number>`COALESCE(AVG(original_size), 0)`,
      })
      .from(payloadStorage)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    return stats;
  }
}

// 💰 ENHANCED TRANSACTION SERVICE with user tracking
export class TransactionService {
  static async createTransaction(transactionData: NewBlockchainTransaction): Promise<BlockchainTransaction> {
    const [transaction] = await db.insert(blockchainTransactions).values(transactionData).returning();
    return transaction;
  }

  static async updateTransactionStatus(
    transactionHash: string, 
    status: string, 
    blockHeight?: number, 
    blockHash?: string,
    confirmedAt?: Date
  ): Promise<BlockchainTransaction> {
    const updateData: any = { status };
    if (blockHeight) updateData.blockHeight = blockHeight;
    if (blockHash) updateData.blockHash = blockHash;
    if (confirmedAt) updateData.confirmedAt = confirmedAt;

    const [transaction] = await db
      .update(blockchainTransactions)
      .set(updateData)
      .where(eq(blockchainTransactions.transactionHash, transactionHash))
      .returning();
    return transaction;
  }

  static async getCompanyTransactions(companyId: number, limit: number = 100): Promise<BlockchainTransaction[]> {
    return db
      .select()
      .from(blockchainTransactions)
      .where(eq(blockchainTransactions.companyId, companyId))
      .orderBy(desc(blockchainTransactions.submittedAt))
      .limit(limit);
  }

  static async getTransactionStats(companyId: number) {
    // Use simpler, faster queries
    try {
      const [
        totalTransactions,
        confirmedTransactions,
        pendingTransactions,
        failedTransactions
      ] = await Promise.all([
        // Total transactions
        db.select({ count: count() }).from(blockchainTransactions).where(eq(blockchainTransactions.companyId, companyId)),
        // Confirmed transactions
        db.select({ count: count() }).from(blockchainTransactions).where(and(eq(blockchainTransactions.companyId, companyId), eq(blockchainTransactions.status, 'confirmed'))),
        // Pending transactions
        db.select({ count: count() }).from(blockchainTransactions).where(and(eq(blockchainTransactions.companyId, companyId), eq(blockchainTransactions.status, 'submitted'))),
        // Failed transactions
        db.select({ count: count() }).from(blockchainTransactions).where(and(eq(blockchainTransactions.companyId, companyId), eq(blockchainTransactions.status, 'failed')))
      ]);

      return {
        totalTransactions: totalTransactions[0]?.count || 0,
        confirmedTransactions: confirmedTransactions[0]?.count || 0,
        pendingTransactions: pendingTransactions[0]?.count || 0,
        failedTransactions: failedTransactions[0]?.count || 0,
        totalAmount: 0, // Skip expensive SUM for now
        totalFees: 0,   // Skip expensive SUM for now
        avgTransactionFee: 0 // Skip expensive AVG for now
      };
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      // Return default stats if query fails
      return {
        totalTransactions: 0,
        confirmedTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0,
        totalAmount: 0,
        totalFees: 0,
        avgTransactionFee: 0
      };
    }
  }

  static async getRecentTransactions(companyId: number, limit: number = 10) {
    return db
      .select({
        id: blockchainTransactions.id,
        transactionHash: blockchainTransactions.transactionHash,
        transactionType: blockchainTransactions.transactionType,
        amount: blockchainTransactions.amount,
        fee: blockchainTransactions.fee,
        status: blockchainTransactions.status,
        blockHeight: blockchainTransactions.blockHeight,
        submittedAt: blockchainTransactions.submittedAt,
        confirmedAt: blockchainTransactions.confirmedAt,
        initiatedByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(blockchainTransactions)
      .leftJoin(users, eq(blockchainTransactions.initiatedByUserId, users.id))
      .where(eq(blockchainTransactions.companyId, companyId))
      .orderBy(desc(blockchainTransactions.submittedAt))
      .limit(limit);
  }
} 