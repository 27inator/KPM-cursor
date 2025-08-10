import { 
  users, 
  companies, 
  events, 
  purchases, 
  walletMetrics,
  productTags,
  policyAudits,
  systemAlerts,
  notifications,
  errorLogs,
  deadLetterQueue,
  systemMetrics,
  auditLogs,
  securityIncidents,
  dataRetentionPolicies,
  type User, 
  type InsertUser,
  type Company,
  type InsertCompany,
  type Event,
  type InsertEvent,
  type Purchase,
  type InsertPurchase,
  type ProductTag,
  type InsertProductTag,
  type WalletMetrics,
  type PolicyAudit,
  type InsertPolicyAudit,
  type SystemAlert,
  type InsertSystemAlert,
  type Notification,
  type InsertNotification,
  type ErrorLog,
  type InsertErrorLog,
  type DeadLetterQueue,
  type InsertDeadLetterQueue,
  type SystemMetric,
  type InsertSystemMetric,
  type AuditLog,
  type InsertAuditLog,
  type SecurityIncident,
  type InsertSecurityIncident,
  type DataRetentionPolicy,
  type InsertDataRetentionPolicy
} from '../shared/schema';
import { db } from "./db";
import { desc } from "drizzle-orm";
import { sql } from 'drizzle-orm';
import { eq, gt, lt, and, or, gte, lte } from 'drizzle-orm/expressions';

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company management
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByCompanyId(companyId: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<Company>): Promise<Company>;

  // Event management
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByTag(tagId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(eventId: string, updates: Partial<Event>): Promise<Event>;
  getTodaysEvents(): Promise<Event[]>;
  getRecentEvents(limit: number): Promise<Event[]>;

  // Purchase management
  getPurchase(id: number): Promise<Purchase | undefined>;
  getPurchasesByUser(userId: number): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;

  // Wallet metrics
  getWalletMetrics(): Promise<WalletMetrics>;
  updateWalletMetrics(metrics: Partial<WalletMetrics>): Promise<WalletMetrics>;

  // Transaction analytics
  getCompanyTransactionHistory(companyId: string, limit?: number): Promise<any[]>;
  getCompanyFeeAnalytics(companyId: string, days?: number): Promise<any>;
  getAllCompaniesAnalytics(): Promise<any[]>;

  // Product tag management
  getProductTag(tagId: string): Promise<ProductTag | undefined>;
  createProductTag(tag: InsertProductTag): Promise<ProductTag>;
  updateProductTag(tagId: string, updates: Partial<ProductTag>): Promise<ProductTag>;

  // Trail/Journey tracking
  getProductJourney(tagId: string): Promise<any>;
  getEventsByTagOrderedByTime(tagId: string): Promise<Event[]>;

  // Policy management
  updateCompanyPolicy(companyId: string, visibleFields: string[], commitEventTypes: string[], adminUserId: string, reason?: string): Promise<Company>;
  
  // Policy audit tracking
  createPolicyAudit(audit: InsertPolicyAudit): Promise<PolicyAudit>;
  getPolicyAudits(companyId?: string, limit?: number): Promise<PolicyAudit[]>;
  
  // System alerts
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  getSystemAlerts(acknowledged?: boolean, limit?: number): Promise<SystemAlert[]>;
  acknowledgeAlert(alertId: number, acknowledgedBy: string): Promise<SystemAlert>;
  
  // Advanced analytics
  getSystemAnalytics(startDate: Date, endDate: Date): Promise<any>;
  getCompanyAnalytics(companyId: string, startDate: Date, endDate: Date): Promise<any>;
  getEventTypeDistribution(startDate: Date, endDate: Date): Promise<any[]>;
  getGeographicDistribution(): Promise<any[]>;
  getPerformanceMetrics(startDate: Date, endDate: Date): Promise<any>;
  getProductJourneyAnalytics(startDate: Date, endDate: Date): Promise<any[]>;
  getDailyEventTrends(startDate: Date, endDate: Date): Promise<any[]>;

  // Notification management
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId?: number, companyId?: string, limit?: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId?: number, companyId?: string): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  getUnreadNotificationCount(userId?: number, companyId?: string): Promise<number>;

  // Error tracking and monitoring
  createErrorLog(errorLog: InsertErrorLog): Promise<ErrorLog>;
  getErrorLogs(limit?: number): Promise<ErrorLog[]>;
  getErrorLogsByOperation(operationName: string): Promise<ErrorLog[]>;
  markErrorAsResolved(errorId: number): Promise<void>;
  
  // Dead letter queue management
  addToDeadLetterQueue(operation: InsertDeadLetterQueue): Promise<DeadLetterQueue>;
  getDeadLetterQueue(): Promise<DeadLetterQueue[]>;
  updateDeadLetterQueueStatus(operationId: string, status: string): Promise<void>;
  removeFromDeadLetterQueue(operationId: string): Promise<void>;
  
  // System metrics tracking
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;
  getSystemMetrics(metricType?: string, limit?: number): Promise<SystemMetric[]>;
  getSystemMetricsByTimeRange(start: Date, end: Date, metricType?: string): Promise<SystemMetric[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByCompanyId(companyId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.companyId, companyId));
    return company || undefined;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: number, updates: Partial<Company>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    
    if (!company) {
      throw new Error(`Company with id ${id} not found`);
    }
    
    return company;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByTag(tagId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.tagId, tagId));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set(updates)
      .where(eq(events.eventId, eventId))
      .returning();
    
    if (!event) {
      throw new Error(`Event with eventId ${eventId} not found`);
    }
    
    return event;
  }

  async getTodaysEvents(): Promise<Event[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000);
    
    return await db.select().from(events).where(eq(events.ts, new Date(todayTimestamp)));
  }

  async getRecentEvents(limit: number): Promise<Event[]> {
    return await db.select().from(events).limit(limit);
  }

  async getPurchase(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase || undefined;
  }

  async getPurchasesByUser(userId: number): Promise<Purchase[]> {
    return await db.select().from(purchases).where(eq(purchases.userId, userId.toString()));
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const [purchase] = await db
      .insert(purchases)
      .values(insertPurchase)
      .returning();
    return purchase;
  }

  async getWalletMetrics(): Promise<WalletMetrics> {
    // Import real blockchain data service
    const { realBlockchainData } = await import('./services/real-blockchain-data');
    
    try {
      // Get real wallet metrics from Kaspa testnet
      const realMetrics = await realBlockchainData.getRealWalletMetrics();
      
      // Check if we have stored metrics
      const [metrics] = await db.select().from(walletMetrics).limit(1);
      
      if (!metrics) {
        // Create initial metrics with real blockchain data
        const [newMetrics] = await db
          .insert(walletMetrics)
          .values({
            masterWalletBalance: realMetrics.masterWalletBalance,
            totalFeesSpent: realMetrics.totalFeesSpent,
            totalFeesSpentUsd: realMetrics.totalFeesSpentUsd,
            activeCompanies: realMetrics.activeCompanies,
            eventsToday: realMetrics.eventsToday,
          })
          .returning();
        return newMetrics;
      }
      
      // Update stored metrics with real data
      const [updatedMetrics] = await db
        .update(walletMetrics)
        .set({
          masterWalletBalance: realMetrics.masterWalletBalance,
          totalFeesSpent: realMetrics.totalFeesSpent,
          totalFeesSpentUsd: realMetrics.totalFeesSpentUsd,
          activeCompanies: realMetrics.activeCompanies,
          eventsToday: realMetrics.eventsToday,
        })
        .returning();
      
      return updatedMetrics;
      
    } catch (error: any) {
      console.error('Failed to get real wallet metrics, using stored data:', error);
      
      // Fallback to stored data if blockchain unavailable
      const [metrics] = await db.select().from(walletMetrics).limit(1);
      
      if (!metrics) {
        // Create zero metrics instead of mock data when blockchain fails
        const [newMetrics] = await db
          .insert(walletMetrics)
          .values({
            masterWalletBalance: 0,
            totalFeesSpent: 0,
            totalFeesSpentUsd: 0,
            activeCompanies: 0,
            eventsToday: 0,
          })
          .returning();
        return newMetrics;
      }
      
      return metrics;
    }
  }

  async updateWalletMetrics(updates: Partial<WalletMetrics>): Promise<WalletMetrics> {
    const [metrics] = await db
      .update(walletMetrics)
      .set(updates)
      .returning();
    
    if (!metrics) {
      throw new Error('Wallet metrics not found');
    }
    
    return metrics;
  }

  async getCompanyTransactionHistory(companyId: string, limit: number = 50): Promise<any[]> {
    // Get events (blockchain transactions) for the company
    const companyEvents = await db
      .select()
      .from(events)
      .where(eq(events.companyId, companyId))
      .orderBy(desc(events.createdAt))
      .limit(limit);

    // Transform events into transaction format
    const transactions = companyEvents.map(event => ({
      id: event.id,
      txid: event.txid,
      type: 'event_commit',
      eventType: event.eventType,
      tagId: event.tagId,
      amount: 0, // Events don't transfer amount, just pay fees
      fee: event.fee,
      status: event.status,
      createdAt: event.createdAt,
      eventId: event.eventId
    }));

    return transactions;
  }

  async getCompanyFeeAnalytics(companyId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get events for fee analytics
    const companyEvents = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.companyId, companyId),
          gte(events.createdAt, startDate)
        )
      )
      .orderBy(events.createdAt);

    // Calculate daily fee totals
    const dailyFees = companyEvents.reduce((acc, event) => {
      const date = event.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (event.fee || 0);
      return acc;
    }, {} as Record<string, number>);

    // Get total fees and transaction counts
    const totalFees = companyEvents.reduce((sum, event) => sum + (event.fee || 0), 0);
    const totalTransactions = companyEvents.length;
    const avgFeePerTransaction = totalTransactions > 0 ? totalFees / totalTransactions : 0;

    // Group by event type
    const feesByEventType = companyEvents.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + (event.fee || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      companyId,
      period: days,
      totalFees,
      totalTransactions,
      avgFeePerTransaction,
      dailyFees,
      feesByEventType,
      chartData: Object.entries(dailyFees).map(([date, fees]) => ({
        date,
        fees
      }))
    };
  }

  async getAllCompaniesAnalytics(): Promise<any[]> {
    const companies = await this.getAllCompanies();
    
    const analytics = await Promise.all(
      companies.map(async (company) => {
        const feeAnalytics = await this.getCompanyFeeAnalytics(company.companyId, 30);
        const recentTransactions = await this.getCompanyTransactionHistory(company.companyId, 10);
        
        return {
          ...company,
          analytics: feeAnalytics,
          recentTransactions
        };
      })
    );

    return analytics;
  }

  // Product tag management
  async getProductTag(tagId: string): Promise<ProductTag | undefined> {
    const [tag] = await db.select().from(productTags).where(eq(productTags.tagId, tagId));
    return tag || undefined;
  }

  async createProductTag(insertTag: InsertProductTag): Promise<ProductTag> {
    const [tag] = await db.insert(productTags).values({
      ...insertTag,
      certifications: Array.isArray(insertTag.certifications) ? 
        JSON.stringify(insertTag.certifications) : 
        insertTag.certifications
    }).returning();
    return tag;
  }

  async updateProductTag(tagId: string, updates: Partial<ProductTag>): Promise<ProductTag> {
    const [tag] = await db
      .update(productTags)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productTags.tagId, tagId))
      .returning();
    return tag;
  }

  // Trail/Journey tracking
  async getEventsByTagOrderedByTime(tagId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.tagId, tagId))
      .orderBy(events.ts);
  }

  async getProductJourney(tagId: string): Promise<any> {
    // Get the product tag
    const productTag = await this.getProductTag(tagId);
    if (!productTag) {
      return null;
    }

    // Get all events for this tag, ordered by timestamp
    const eventList = await this.getEventsByTagOrderedByTime(tagId);
    
    // Get company details for each event
    const companiesMap = new Map<string, Company>();
    for (const event of eventList) {
      if (!companiesMap.has(event.companyId)) {
        const company = await this.getCompanyByCompanyId(event.companyId);
        if (company) {
          companiesMap.set(event.companyId, company);
        }
      }
    }

    // Transform events into journey format
    const journeyEvents = eventList.map(event => ({
      id: event.id,
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.ts,
      companyId: event.companyId,
      companyName: companiesMap.get(event.companyId)?.name || 'Unknown Company',
      txid: event.txid,
      leafHash: event.leafHash,
      merkleRoot: event.merkleRoot,
      status: event.status,
      fee: event.fee,
      verified: event.status === 'confirmed',
      createdAt: event.createdAt
    }));

    // Determine current status based on latest event
    const latestEvent = journeyEvents[journeyEvents.length - 1];
    const currentStatus = this.determineProductStatus(latestEvent?.eventType);

    return {
      tagId,
      product: productTag,
      events: journeyEvents,
      currentLocation: latestEvent?.companyName || 'Unknown',
      currentStatus,
      verificationStatus: journeyEvents.every(e => e.verified) ? 'VERIFIED' : 
                         journeyEvents.some(e => e.verified) ? 'PARTIAL' : 'UNVERIFIED',
      totalEvents: journeyEvents.length,
      lastUpdated: latestEvent?.createdAt || productTag.createdAt
    };
  }

  private determineProductStatus(eventType: string): string {
    switch (eventType) {
      case 'FARM': return 'HARVESTED';
      case 'PROCESSING': return 'PROCESSING';
      case 'SHIP': return 'SHIPPED';
      case 'WAREHOUSE': return 'DELIVERED';
      case 'RETAIL': return 'RETAIL';
      case 'PURCHASE': return 'CONSUMED';
      default: return 'UNKNOWN';
    }
  }

  // Policy management methods
  async updateCompanyPolicy(companyId: string, visibleFields: string[], commitEventTypes: string[], adminUserId: string, reason?: string): Promise<Company> {
    // Get current company data for audit trail
    const currentCompany = await this.getCompanyByCompanyId(companyId);
    if (!currentCompany) {
      throw new Error(`Company ${companyId} not found`);
    }

    // Update company policy
    const [updatedCompany] = await db
      .update(companies)
      .set({
        visibleFields,
        commitEventTypes,
        updatedAt: new Date(),
      })
      .where(eq(companies.companyId, companyId))
      .returning();

    if (!updatedCompany) {
      throw new Error(`Failed to update policy for company ${companyId}`);
    }

    // Create audit records for each changed field
    if (JSON.stringify(currentCompany.visibleFields) !== JSON.stringify(visibleFields)) {
      await this.createPolicyAudit({
        companyId,
        actionType: "field_visibility",
        fieldName: "visibleFields",
        oldValue: JSON.stringify(currentCompany.visibleFields || []),
        newValue: JSON.stringify(visibleFields),
        adminUserId,
        reason,
      });
    }

    if (JSON.stringify(currentCompany.commitEventTypes) !== JSON.stringify(commitEventTypes)) {
      await this.createPolicyAudit({
        companyId,
        actionType: "event_type_change",
        fieldName: "commitEventTypes",
        oldValue: JSON.stringify(currentCompany.commitEventTypes || []),
        newValue: JSON.stringify(commitEventTypes),
        adminUserId,
        reason,
      });
    }

    return updatedCompany;
  }

  // Policy audit methods
  async createPolicyAudit(insertAudit: InsertPolicyAudit): Promise<PolicyAudit> {
    const [audit] = await db
      .insert(policyAudits)
      .values(insertAudit)
      .returning();
    return audit;
  }

  async getPolicyAudits(companyId?: string, limit: number = 50): Promise<PolicyAudit[]> {
    let query = companyId
      ? db.select().from(policyAudits).where(eq(policyAudits.companyId, companyId))
      : db.select().from(policyAudits);
    return await query.orderBy(desc(policyAudits.createdAt)).limit(limit);
  }

  // System alert methods
  async createSystemAlert(insertAlert: InsertSystemAlert): Promise<SystemAlert> {
    const [alert] = await db
      .insert(systemAlerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async getSystemAlerts(acknowledged?: boolean, limit: number = 50): Promise<SystemAlert[]> {
    let query = (acknowledged !== undefined)
      ? db.select().from(systemAlerts).where(eq(systemAlerts.acknowledged, acknowledged))
      : db.select().from(systemAlerts);
    return await query.orderBy(desc(systemAlerts.createdAt)).limit(limit);
  }

  async acknowledgeAlert(alertId: number, acknowledgedBy: string): Promise<SystemAlert> {
    const [alert] = await db
      .update(systemAlerts)
      .set({
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date(),
      })
      .where(eq(systemAlerts.id, alertId))
      .returning();

    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    return alert;
  }

  // Advanced analytics implementations
  async getSystemAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const [row] = await db
      .select({
        totalCompanies: sql<number>`COUNT(DISTINCT ${companies.id})`,
        totalEvents: sql<number>`COUNT(*)`,
        totalProducts: sql<number>`COUNT(DISTINCT ${events.tagId})`,
        totalFeesCollected: sql<number>`SUM(${events.fee})`,
        averageFeePerEvent: sql<number>`AVG(${events.fee})`,
        blockchainSuccessRate: sql<number>`SUM(CASE WHEN ${events.status} = 'confirmed' THEN 1 ELSE 0 END) * 1.0 / NULLIF(COUNT(*), 0)`
      })
      .from(events)
      .where(and(
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      ));
    return row;
  }

  async getCompanyAnalytics(companyId: string, startDate: Date, endDate: Date): Promise<any> {
    const [companyEvents] = await db.select({ count: sql<number>`COUNT(*)` }).from(events)
      .where(and(
        eq(events.companyId, companyId),
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      ));

    const [companyProducts] = await db.select({ 
      count: sql<number>`COUNT(DISTINCT ${events.tagId})` 
    }).from(events)
      .where(and(
        eq(events.companyId, companyId),
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      ));

    const [companyFees] = await db.select({
      totalFees: sql<number>`SUM(${events.fee})`,
      averageFee: sql<number>`AVG(${events.fee})`
    }).from(events)
      .where(and(
        eq(events.companyId, companyId),
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      ));

    const [companySuccessRate] = await db.select({
      successRate: sql<number>`
        cast(sum(case when ${events.status} = 'confirmed' then 1 else 0 end) as float) / 
        cast(count(*) as float)
      `
    }).from(events)
      .where(and(
        eq(events.companyId, companyId),
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      ));

    return {
      totalEvents: companyEvents.count,
      totalProducts: companyProducts.count,
      totalFeesCollected: companyFees.totalFees || 0,
      averageFeePerEvent: companyFees.averageFee || 0,
      blockchainSuccessRate: companySuccessRate.successRate || 0,
      averageEventProcessingTime: await this.getRealEventProcessingTime(),
      systemThroughput: await this.getRealSystemThroughput()
    };
  }

  async getEventTypeDistribution(startDate: Date, endDate: Date): Promise<any[]> {
    const distribution = await db.select({
      eventType: events.eventType,
      count: sql<number>`COUNT(*)`
    }).from(events)
      .where(and(
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      ))
      .groupBy(events.eventType)
      .orderBy(desc(sql<number>`COUNT(*)`));

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    
    return distribution.map(item => ({
      eventType: item.eventType,
      count: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
    }));
  }

  async getGeographicDistribution(): Promise<any[]> {
    // Mock geographic data - in production this would come from company locations
    return [
      { region: "North America", companies: 12, events: 1847 },
      { region: "Europe", companies: 8, events: 1203 },
      { region: "Asia Pacific", companies: 6, events: 891 },
      { region: "Latin America", companies: 3, events: 456 },
      { region: "Africa", companies: 2, events: 234 }
    ];
  }

  // Real system metrics helper methods
  async getRealSystemUptime(): Promise<number> {
    try {
      const { realBlockchainData } = await import('./services/real-blockchain-data');
      const systemMetrics = await realBlockchainData.getRealSystemMetrics();
      return systemMetrics.networkUptime;
    } catch (error: any) {
      return 0; // Return 0 instead of mock data when blockchain unavailable
    }
  }

  async getRealEventProcessingTime(): Promise<number> {
    try {
      const { realBlockchainData } = await import('./services/real-blockchain-data');
      const systemMetrics = await realBlockchainData.getRealSystemMetrics();
      return systemMetrics.averageConfirmationTime * 1000; // Convert to milliseconds
    } catch (error: any) {
      return 0; // Return 0 instead of mock data
    }
  }

  async getRealSystemThroughput(): Promise<number> {
    try {
      const { realBlockchainData } = await import('./services/real-blockchain-data');
      const systemMetrics = await realBlockchainData.getRealSystemMetrics();
      return systemMetrics.transactionsProcessed;
    } catch (error: any) {
      return 0; // Return 0 instead of mock data
    }
  }

  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<any> {
    const [metrics] = await db.select({
      totalEvents: sql<number>`COUNT(*)`,
      confirmedEvents: sql<number>`SUM(CASE WHEN ${events.status} = 'confirmed' THEN 1 ELSE 0 END)`,
      avgProcessingTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${events.updatedAt} - ${events.createdAt})) * 1000)`
    }).from(events)
      .where(and(
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      ));

    return {
      totalEvents: metrics.totalEvents,
      confirmedEvents: metrics.confirmedEvents,
      successRate: metrics.totalEvents > 0 ? (metrics.confirmedEvents / metrics.totalEvents) * 100 : 0,
      averageProcessingTime: metrics.avgProcessingTime || 0,
      systemThroughput: metrics.totalEvents / Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    };
  }

  async getProductJourneyAnalytics(startDate: Date, endDate: Date): Promise<any[]> {
    const productJourneys = await db.select({
      productId: events.tagId,
      totalEvents: sql<number>`COUNT(*)`,
      journeyLength: sql<number>`
        EXTRACT(EPOCH FROM (MAX(${events.createdAt}) - MIN(${events.createdAt}))) / 86400
      `,
      verificationStatus: sql<string>`
        CASE WHEN SUM(CASE WHEN ${events.status} = 'confirmed' THEN 1 ELSE 0 END) = COUNT(*) 
        THEN 'verified' ELSE 'partial' END
      `,
      lastUpdate: sql<string>`MAX(${events.createdAt})`
    }).from(events)
      .where(and(
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      ))
      .groupBy(events.tagId)
      .orderBy(desc(sql<number>`COUNT(*)`))
      .limit(50);

    return productJourneys.map(journey => ({
      productId: journey.productId,
      totalEvents: journey.totalEvents,
      journeyLength: Math.ceil(journey.journeyLength),
      verificationStatus: journey.verificationStatus,
      lastUpdate: journey.lastUpdate
    }));
  }

  async getDailyEventTrends(startDate: Date, endDate: Date): Promise<any[]> {
    const dailyTrends = await db.select({
      date: sql<string>`DATE(${events.createdAt})`,
      events: sql<number>`COUNT(*)`,
      fees: sql<number>`SUM(${events.fee})`,
      companies: sql<number>`COUNT(DISTINCT ${events.companyId})`
    }).from(events)
      .where(and(
        gte(events.createdAt, startDate),
        lte(events.createdAt, endDate)
      ))
      .groupBy(sql<string>`DATE(${events.createdAt})`)
      .orderBy(sql<string>`DATE(${events.createdAt})`);

    return dailyTrends.map(trend => ({
      date: trend.date,
      events: trend.events,
      fees: trend.fees || 0,
      companies: trend.companies
    }));
  }

  async getCompanyMetrics(): Promise<any[]> {
    const companyMetrics = await db.select({
      companyId: companies.companyId,
      name: companies.name,
      totalEvents: sql<number>`COUNT(${events.id})`,
      totalFees: sql<number>`SUM(${events.fee})`,
      successRate: sql<number>`
        cast(sum(case when ${events.status} = 'confirmed' then 1 else 0 end) as float) / 
        cast(count(${events.id}) as float) * 100
      `,
      avgProcessingTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${events.updatedAt} - ${events.createdAt})) * 1000)`,
      lastActivity: sql<string>`MAX(${events.createdAt})`
    }).from(companies)
      .leftJoin(events, eq(companies.companyId, events.companyId))
      .groupBy(companies.companyId, companies.name)
      .orderBy(desc(sql<number>`COUNT(${events.id})`));

    return companyMetrics.map(metric => ({
      companyId: metric.companyId,
      name: metric.name,
      totalEvents: metric.totalEvents || 0,
      totalFees: metric.totalFees || 0,
      successRate: metric.successRate || 0,
      avgProcessingTime: metric.avgProcessingTime || 0,
      lastActivity: metric.lastActivity || new Date().toISOString()
    }));
  }

  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getNotifications(userId?: number, companyId?: string, limit: number = 50): Promise<Notification[]> {
    let query = companyId
      ? db.select().from(notifications).where(eq(notifications.companyId, companyId))
      : userId
        ? db.select().from(notifications).where(eq(notifications.userId, userId))
        : db.select().from(notifications);
    const result = await query.orderBy(desc(notifications.createdAt)).limit(limit);
    return result;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId?: number, companyId?: string): Promise<void> {
    let query = companyId
      ? db.update(notifications).set({ read: true, updatedAt: new Date() }).where(eq(notifications.companyId, companyId))
      : userId
        ? db.update(notifications).set({ read: true, updatedAt: new Date() }).where(eq(notifications.userId, userId))
        : db.update(notifications).set({ read: true, updatedAt: new Date() });
    await query;
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId?: number, companyId?: string): Promise<number> {
    let query = companyId
      ? db.select({ count: sql<number>`COUNT(*)` }).from(notifications).where(and(eq(notifications.companyId, companyId), eq(notifications.read, false)))
      : userId
        ? db.select({ count: sql<number>`COUNT(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
        : db.select({ count: sql<number>`COUNT(*)` }).from(notifications).where(eq(notifications.read, false));
    const [result] = await query;
    return result.count;
  }

  // Error tracking and monitoring
  async createErrorLog(errorLog: InsertErrorLog): Promise<ErrorLog> {
    const [createdErrorLog] = await db
      .insert(errorLogs)
      .values(errorLog)
      .returning();
    return createdErrorLog;
  }

  async getErrorLogs(limit: number = 100): Promise<ErrorLog[]> {
    return await db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit);
  }

  async getErrorLogsByOperation(operationName: string): Promise<ErrorLog[]> {
    return await db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.operationName, operationName))
      .orderBy(desc(errorLogs.createdAt));
  }

  async markErrorAsResolved(errorId: number): Promise<void> {
    await db
      .update(errorLogs)
      .set({ resolved: true, resolvedAt: new Date() })
      .where(eq(errorLogs.id, errorId));
  }

  // Dead letter queue management
  async addToDeadLetterQueue(operation: InsertDeadLetterQueue): Promise<DeadLetterQueue> {
    const [createdOperation] = await db
      .insert(deadLetterQueue)
      .values(operation)
      .returning();
    return createdOperation;
  }

  async getDeadLetterQueue(): Promise<DeadLetterQueue[]> {
    return await db
      .select()
      .from(deadLetterQueue)
      .orderBy(desc(deadLetterQueue.createdAt));
  }

  async updateDeadLetterQueueStatus(operationId: string, status: string): Promise<void> {
    await db
      .update(deadLetterQueue)
      .set({ status, updatedAt: new Date() })
      .where(eq(deadLetterQueue.operationId, operationId));
  }

  async removeFromDeadLetterQueue(operationId: string): Promise<void> {
    await db
      .delete(deadLetterQueue)
      .where(eq(deadLetterQueue.operationId, operationId));
  }

  // System metrics tracking
  async createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric> {
    const [createdMetric] = await db
      .insert(systemMetrics)
      .values(metric)
      .returning();
    return createdMetric;
  }

  async getSystemMetrics(metricType?: string, limit: number = 100): Promise<SystemMetric[]> {
    let query = db.select({
      id: systemMetrics.id,
      metricType: systemMetrics.metricType,
      metricName: systemMetrics.metricName,
      value: systemMetrics.value,
      unit: systemMetrics.unit,
      tags: systemMetrics.tags,
      timestamp: systemMetrics.timestamp,
    }).from(systemMetrics);

    if (metricType) {
      query = query.where(eq(systemMetrics.metricType, metricType));
    }

    return await query
      .orderBy(desc(systemMetrics.timestamp))
      .limit(limit);
  }

  async getSystemMetricsByTimeRange(start: Date, end: Date, metricType?: string): Promise<SystemMetric[]> {
    let conditions = [
      gte(systemMetrics.timestamp, start),
      lte(systemMetrics.timestamp, end)
    ];

    if (metricType) {
      conditions.push(eq(systemMetrics.metricType, metricType));
    }

    return await db
      .select()
      .from(systemMetrics)
      .where(and(...conditions))
      .orderBy(desc(systemMetrics.timestamp));
  }

  // Security compliance methods
  async getAuditLogs(options: { limit?: number; companyId?: string; action?: string }) {
    const { limit = 100, companyId, action } = options;
    
    let query = db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      userId: auditLogs.userId,
      companyId: auditLogs.companyId,
      resourceId: auditLogs.resourceId,
      resourceType: auditLogs.resourceType,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      metadata: auditLogs.metadata,
      timestamp: auditLogs.timestamp,
      createdAt: auditLogs.createdAt,
    }).from(auditLogs);
    
    const conditions = [];
    if (companyId) conditions.push(eq(auditLogs.companyId, companyId));
    if (action) conditions.push(eq(auditLogs.action, action));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const logs = await query
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
    
    return logs;
  }

  async getSecurityIncidents(options: { limit?: number; severity?: string; resolved?: boolean }) {
    const { limit = 50, severity, resolved } = options;
    
    let query = db.select({
      id: securityIncidents.id,
      type: securityIncidents.type,
      severity: securityIncidents.severity,
      description: securityIncidents.description,
      userId: securityIncidents.userId,
      companyId: securityIncidents.companyId,
      ipAddress: securityIncidents.ipAddress,
      userAgent: securityIncidents.userAgent,
      resolved: securityIncidents.resolved,
      resolvedAt: securityIncidents.resolvedAt,
      resolvedBy: securityIncidents.resolvedBy,
      metadata: securityIncidents.metadata,
      createdAt: securityIncidents.createdAt,
    }).from(securityIncidents);
    
    const conditions = [];
    if (severity) conditions.push(eq(securityIncidents.severity, severity));
    if (resolved !== undefined) conditions.push(eq(securityIncidents.resolved, resolved));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const incidents = await query
      .orderBy(desc(securityIncidents.createdAt))
      .limit(limit);
    
    return incidents;
  }

  async resolveSecurityIncident(incidentId: number, resolvedBy?: string) {
    await db.update(securityIncidents)
      .set({
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy
      })
      .where(eq(securityIncidents.id, incidentId));
  }

  async createSecurityIncident(incident: InsertSecurityIncident) {
    const [newIncident] = await db
      .insert(securityIncidents)
      .values(incident)
      .returning();
    return newIncident;
  }

  async createAuditLog(log: InsertAuditLog) {
    const [newLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getDataRetentionPolicies(companyId?: string) {
    let query = db.select({
      id: dataRetentionPolicies.id,
      dataType: dataRetentionPolicies.dataType,
      retentionPeriodDays: dataRetentionPolicies.retentionPeriodDays,
      autoDelete: dataRetentionPolicies.autoDelete,
      companyId: dataRetentionPolicies.companyId,
      createdAt: dataRetentionPolicies.createdAt,
      updatedAt: dataRetentionPolicies.updatedAt,
    }).from(dataRetentionPolicies);
    
    if (companyId) {
      query = query.where(eq(dataRetentionPolicies.companyId, companyId));
    }
    
    const policies = await query.orderBy(desc(dataRetentionPolicies.createdAt));
    return policies;
  }

  async createDataRetentionPolicy(policy: InsertDataRetentionPolicy) {
    const [newPolicy] = await db
      .insert(dataRetentionPolicies)
      .values(policy)
      .returning();
    return newPolicy;
  }
}

export const storage = new DatabaseStorage();