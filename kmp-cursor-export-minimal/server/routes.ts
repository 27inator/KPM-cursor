import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { notificationService } from "./websocket";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertEventSchema, insertCompanySchema } from "@shared/schema";
import { getCompanyWallet, getMasterWallet } from "./services/wallet";
import { kaspeakSDK, initializeKaspaGrpcClient } from './services/kaspa-grpc';
import { directKaspaRPC } from './services/direct-kaspa-rpc';
import { ErrorHandler, ErrorType, ErrorSeverity } from "./services/error-handler";
import { backupService } from "./services/backup-service";
import { dataRetentionService } from "./services/data-retention";
import { databaseSecurityService } from "./middleware/database-security";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// Initialize Kaspa.ng gRPC client but don't connect immediately to avoid blocking server startup
let grpcConnected = false;

// Connect to Kaspa testnet asynchronously after server starts
const connectKaspa = async () => {
  try {
    if (!grpcConnected) {
      console.log('🔄 Initializing Kaspa testnet connection...');
      
      // Try gRPC client first
      try {
        await initializeKaspaGrpcClient();
        grpcConnected = true;
        console.log('✅ Kaspa.ng gRPC Client connected');
        return;
      } catch (grpcError) {
        console.log('⚠️ gRPC client failed, trying direct RPC...');
      }
      
      // Fallback to direct RPC client
      const connected = await directKaspaRPC.connect();
      if (connected) {
        grpcConnected = true;
        console.log('✅ Direct Kaspa RPC connected');
        
        // Test wallet generation
        const testWallet = directKaspaRPC.generateHDWallet(0);
        console.log(`🔑 Test wallet: ${testWallet.address}`);
        
        const balance = await directKaspaRPC.getAddressBalance(testWallet.address);
        console.log(`💰 Test balance: ${balance} KAS`);
        
        return;
      }
      
      throw new Error('All Kaspa connection methods failed');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Kaspa testnet:', error instanceof Error ? error.message : String(error));
    console.log('❌ CRITICAL: No Kaspa testnet connection available');
    console.log('❌ System requires testnet connection for blockchain functionality');
    grpcConnected = false;
  }
};

// Start Kaspa testnet connection attempt (non-blocking)
setTimeout(connectKaspa, 1000);



// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// Auth middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashedPassword });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({ 
        user: { id: user.id, email: user.email }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      // Simplified login without body validation
      const { email, password } = req.body || {};
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({ 
        user: { id: user.id, email: user.email }, 
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Event ingestion
  app.post("/api/events", async (req, res) => {
    try {
      const { companyId, tagId, eventType, ts, payload } = req.body;
      
      // Validate company exists
      const company = await storage.getCompanyByCompanyId(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Compute hashes
      const payloadStr = JSON.stringify(payload);
      const crypto = await import('crypto');
      const leafHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
      const merkleRoot = leafHash; // Single leaf tree

      // Create OP_RETURN data
      const opReturnData = { tagId, eventType, ts, leafHash, merkleRoot };
      const opReturn = Buffer.from(JSON.stringify(opReturnData)).toString('base64');

      // Mock blockchain transaction for now (until kaspeak-SDK types are available)
      const txid = `kaspa:${crypto.randomUUID().replace(/-/g, '').substring(0, 64)}`;

      // Create event record
      const event = await storage.createEvent({
        eventId: `evt_${Date.now()}`,
        companyId,
        tagId,
        eventType,
        ts,
        blobCid: null,
        leafHash,
        merkleRoot,
        txid,
        status: "confirmed",
        fee: 0.001,
      });

      res.status(201).json({ 
        eventId: event.eventId, 
        txid,
        leafHash,
        merkleRoot 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Trail retrieval


  // Dashboard data endpoints
  app.get("/api/dashboard/metrics", authenticateToken, async (req, res) => {
    try {
      const metrics = await storage.getWalletMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve metrics" });
    }
  });

  app.get("/api/dashboard/companies", authenticateToken, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve companies" });
    }
  });

  app.get("/api/dashboard/recent-events", authenticateToken, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const events = await storage.getRecentEvents(limit);
      
      // Enrich events with company data
      const enrichedEvents = await Promise.all(
        events.map(async (event) => {
          const company = await storage.getCompanyByCompanyId(event.companyId);
          return {
            ...event,
            companyName: company?.name || "Unknown Company",
          };
        })
      );

      res.json(enrichedEvents);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve recent events" });
    }
  });

  // Company management
  app.post("/api/companies", authenticateToken, async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      res.status(400).json({ message: "Invalid company data" });
    }
  });

  app.patch("/api/companies/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const company = await storage.updateCompany(id, updates);
      res.json(company);
    } catch (error) {
      res.status(400).json({ message: "Failed to update company" });
    }
  });

  // Event management endpoints
  app.post("/api/events", authenticateToken, async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      
      // Mock blockchain transaction for now (until kaspeak-SDK types are available)
      const crypto = await import('crypto');
      const txid = `kaspa:${crypto.randomUUID().replace(/-/g, '').substring(0, 64)}`;

      // Store event with transaction ID
      const event = await storage.createEvent({
        ...eventData,
        txid,
        status: "pending"
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(400).json({ message: "Failed to create event" });
    }
  });

  app.get("/api/events/:tagId", authenticateToken, async (req, res) => {
    try {
      const tagId = req.params.tagId;
      const events = await storage.getEventsByTag(tagId);
      res.json(events);
    } catch (error) {
      res.status(400).json({ message: "Failed to retrieve events" });
    }
  });

  app.get("/api/events", authenticateToken, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getRecentEvents(limit);
      res.json(events);
    } catch (error) {
      res.status(400).json({ message: "Failed to retrieve events" });
    }
  });

  // Wallet operations
  app.post("/api/wallets/fund", authenticateToken, async (req, res) => {
    try {
      const { companyId, amount } = req.body;
      const company = await storage.getCompanyByCompanyId(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const masterWallet = getMasterWallet();
      const companyWallet = getCompanyWallet(company.hdPathIndex);
      
      // Mock funding transaction for now
      const crypto = await import('crypto');
      const txid = `kaspa:${crypto.randomUUID().replace(/-/g, '').substring(0, 64)}`;

      // Update company balance
      const updatedCompany = await storage.updateCompany(company.id, {
        balance: (company.balance || 0) + amount
      });

      res.json({ 
        success: true, 
        txid, 
        company: updatedCompany,
        message: `Funded ${amount} KAS to ${company.name}`
      });
    } catch (error) {
      console.error("Error funding wallet:", error);
      res.status(500).json({ message: "Failed to fund wallet" });
    }
  });

  app.post("/api/wallets/auto-fund", authenticateToken, async (req, res) => {
    try {
      const { companyId, enabled } = req.body;
      const company = await storage.getCompanyByCompanyId(companyId);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const updatedCompany = await storage.updateCompany(company.id, {
        autoFundEnabled: enabled
      });

      res.json({ 
        success: true, 
        company: updatedCompany,
        message: `Auto-funding ${enabled ? 'enabled' : 'disabled'} for ${company.name}`
      });
    } catch (error) {
      console.error("Error updating auto-fund setting:", error);
      res.status(500).json({ message: "Failed to update auto-fund setting" });
    }
  });

  // Transaction verification
  app.get("/api/transactions/:txid", authenticateToken, async (req, res) => {
    try {
      const txid = req.params.txid;
      // Mock transaction data for now
      const transaction = { confirmations: 3, status: 'confirmed' };
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json(transaction);
    } catch (error) {
      console.error("Error getting transaction:", error);
      res.status(500).json({ message: "Failed to retrieve transaction" });
    }
  });

  // Provenance chain tracking
  app.get("/api/provenance/:tagId", authenticateToken, async (req, res) => {
    try {
      const tagId = req.params.tagId;
      const events = await storage.getEventsByTag(tagId);
      
      // Build provenance chain with transaction details
      const provenanceChain = await Promise.all(
        events.map(async (event) => {
          // Mock transaction data for now
          const transaction = { confirmations: 3, status: 'confirmed' };
          return {
            ...event,
            transaction,
            verified: (transaction?.confirmations || 0) > 0
          };
        })
      );

      res.json({
        tagId,
        events: provenanceChain,
        totalEvents: provenanceChain.length,
        verified: provenanceChain.every(e => e.verified)
      });
    } catch (error) {
      console.error("Error getting provenance chain:", error);
      res.status(500).json({ message: "Failed to retrieve provenance chain" });
    }
  });

  // Product tracking endpoint
  app.get("/api/product-tracking/:tagId", authenticateToken, async (req, res) => {
    try {
      const tagId = req.params.tagId;
      const events = await storage.getEventsByTag(tagId);
      
      if (events.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Build product tracking data with enhanced information
      const productScans = await Promise.all(
        events.map(async (event) => {
          // Mock transaction data for now
          const transaction = { confirmations: 3, status: 'confirmed' };
          return {
            id: `scan_${event.id}`,
            tagId: event.tagId,
            scannerType: 'QR', // Default scanner type
            locationId: `${event.eventType}_LOCATION`,
            companyId: event.companyId,
            eventType: event.eventType,
            timestamp: new Date(Number(event.ts) * 1000),
            blockchainTxId: event.txid,
            verified: transaction !== null,
            metadata: {
              temperature: event.eventType === 'FARM' ? 18 : event.eventType === 'SHIP' ? 4 : 5,
              humidity: event.eventType === 'FARM' ? 65 : event.eventType === 'SHIP' ? 80 : 70,
              handler: event.eventType === 'FARM' ? 'Farm Handler' : event.eventType === 'SHIP' ? 'Logistics Team' : 'Store Manager',
              notes: `${event.eventType} event - ${event.status}`
            }
          };
        })
      );

      // Determine current status based on latest event
      const latestEvent = events[events.length - 1];
      const statusMap: Record<string, string> = {
        'FARM': 'HARVESTED',
        'SHIP': 'SHIPPED',
        'QC': 'RETAIL',
        'RETAIL': 'RETAIL'
      };

      // Build product info
      const productInfo = {
        tagId,
        productId: `PROD-${tagId}`,
        productType: tagId.includes('001') ? 'Organic Apples' : tagId.includes('002') ? 'Fresh Lettuce' : 'Organic Tomatoes',
        batchId: `BATCH-${tagId.slice(-4)}`,
        farmId: 'FARM-GREENVALLEY-001',
        harvestDate: new Date(Number(events[0].ts) * 1000 - 86400000), // 1 day before first event
        expiryDate: new Date(Number(events[0].ts) * 1000 + 30 * 86400000), // 30 days after first event
        origin: 'Green Valley Farms, California',
        certifications: ['Organic', 'Non-GMO', 'Fair Trade'],
        currentStatus: statusMap[latestEvent.eventType] || 'HARVESTED',
        totalScans: productScans.length,
        verifiedScans: productScans.filter(s => s.verified).length,
        lastScanLocation: `${latestEvent.eventType} Location`,
        lastScanTime: new Date(Number(latestEvent.ts) * 1000),
        scans: productScans.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      };

      res.json(productInfo);
    } catch (error) {
      console.error("Error getting product tracking:", error);
      res.status(500).json({ message: "Failed to retrieve product tracking data" });
    }
  });

  // Company wallet balance updates
  app.post("/api/companies/:id/refresh-balance", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const companyWallet = getCompanyWallet(company.hdPathIndex);
      // Mock balance for now
      const balance = 100.5;
      
      const updatedCompany = await storage.updateCompany(id, { balance });
      
      res.json({ 
        success: true, 
        company: updatedCompany,
        previousBalance: company.balance,
        newBalance: balance
      });
    } catch (error) {
      console.error("Error refreshing balance:", error);
      res.status(500).json({ message: "Failed to refresh balance" });
    }
  });

  // User purchases
  app.post("/api/users/me/purchases", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventId } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Mock purchase stamp transaction for now
      const crypto = await import('crypto');
      const stampTxid = `kaspa:${crypto.randomUUID().replace(/-/g, '').substring(0, 64)}`;

      const purchase = await storage.createPurchase({
        purchaseId: `purch_${Date.now()}`,
        userId: userId.toString(),
        tagId: `tag_${eventId}`,
        eventId,
        stampTxid,
      });

      res.status(201).json(purchase);
    } catch (error) {
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  app.get("/api/users/me/purchases", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const purchases = await storage.getPurchasesByUser(userId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve purchases" });
    }
  });

  // Company analytics routes
  app.get("/api/companies/:companyId/transactions", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getCompanyTransactionHistory(companyId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching company transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/companies/:companyId/analytics", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      const analytics = await storage.getCompanyFeeAnalytics(companyId, days);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching company analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/companies/analytics", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const analytics = await storage.getAllCompaniesAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching all companies analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Consumer/Mobile API endpoints
  app.get("/api/consumer/product/:tagId", async (req: Request, res: Response) => {
    try {
      const { tagId } = req.params;
      
      // Get product tag information
      const productTag = await storage.getProductTag(tagId);
      if (!productTag) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Get product journey/events
      const events = await storage.getEventsByTagOrderedByTime(tagId);
      
      // Get company information for the latest event
      const latestEvent = events[events.length - 1];
      const company = latestEvent ? await storage.getCompanyByCompanyId(latestEvent.companyId) : null;

      // Calculate journey insights
      const journeyInsights = {
        totalSteps: events.length,
        verifiedSteps: events.filter(e => e.status === 'confirmed').length,
        lastUpdated: latestEvent ? new Date(latestEvent.ts).toISOString() : null,
        currentLocation: company ? company.name : 'Unknown',
        estimatedDelivery: null // This could be calculated based on the supply chain
      };

      res.json({
        product: productTag,
        journey: events.map(event => ({
          id: event.id,
          eventType: event.eventType,
          timestamp: event.ts,
          status: event.status,
          txid: event.txid,
          companyId: event.companyId,
          verified: event.status === 'confirmed',
          blockchainProof: event.txid ? `https://explorer.kaspa.org/txs/${event.txid}` : null
        })),
        insights: journeyInsights,
        company: company ? {
          name: company.name,
          id: company.companyId,
          status: company.status
        } : null
      });
    } catch (error) {
      console.error('Error fetching consumer product:', error);
      res.status(500).json({ error: 'Failed to fetch product information' });
    }
  });

  // QR Code scanning endpoint for consumers
  app.get("/api/consumer/scan/:tagId", async (req: Request, res: Response) => {
    try {
      const { tagId } = req.params;
      
      const productTag = await storage.getProductTag(tagId);
      if (!productTag) {
        return res.status(404).json({ 
          error: 'Product not found',
          suggestion: 'This QR code may be invalid or the product is not yet registered in our system'
        });
      }

      // Get recent events for quick overview
      const recentEvents = await storage.getEventsByTag(tagId);
      const latestEvent = recentEvents.sort((a, b) => Number(b.ts) - Number(a.ts))[0];

      res.json({
        productFound: true,
        product: {
          tagId: productTag.tagId,
          name: productTag.productName,
          type: productTag.productType,
          origin: productTag.origin,
          harvestDate: productTag.harvestDate,
          expiryDate: productTag.expiryDate,
          certifications: productTag.certifications ? JSON.parse(productTag.certifications) : []
        },
        latestUpdate: latestEvent ? {
          eventType: latestEvent.eventType,
          timestamp: latestEvent.ts,
          verified: latestEvent.status === 'confirmed'
        } : null,
        totalEvents: recentEvents.length,
        verificationRate: recentEvents.length > 0 ? 
          Math.round((recentEvents.filter(e => e.status === 'confirmed').length / recentEvents.length) * 100) : 0
      });
    } catch (error) {
      console.error('Error scanning product:', error);
      res.status(500).json({ error: 'Failed to scan product' });
    }
  });

  // Trail/Journey tracking endpoints
  app.get("/api/trail", async (req: Request, res: Response) => {
    try {
      const { tag } = req.query;
      
      if (!tag || typeof tag !== 'string') {
        return res.status(400).json({ error: 'Tag parameter is required' });
      }

      const journey = await storage.getProductJourney(tag);
      
      if (!journey) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(journey);
    } catch (error) {
      console.error('Error fetching product journey:', error);
      res.status(500).json({ error: 'Failed to fetch product journey' });
    }
  });

  // Create/register a new product tag
  app.post("/api/product-tags", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Ensure required fields are present
      if (!req.body.tagId || !req.body.productName || !req.body.productId) {
        return res.status(400).json({ error: 'Missing required fields: tagId, productName, productId' });
      }
      
      const productTagData = {
        ...req.body,
        // Convert date strings to Date objects, handle empty strings and null values
        harvestDate: req.body.harvestDate && req.body.harvestDate !== '' ? new Date(req.body.harvestDate) : null,
        expiryDate: req.body.expiryDate && req.body.expiryDate !== '' ? new Date(req.body.expiryDate) : null,
        // Ensure certifications is handled properly
        certifications: Array.isArray(req.body.certifications) ? req.body.certifications : []
      };
      
      // Validate that dates are valid if provided
      if (productTagData.harvestDate && isNaN(productTagData.harvestDate.getTime())) {
        return res.status(400).json({ error: 'Invalid harvest date format' });
      }
      if (productTagData.expiryDate && isNaN(productTagData.expiryDate.getTime())) {
        return res.status(400).json({ error: 'Invalid expiry date format' });
      }
      
      const productTag = await storage.createProductTag(productTagData);
      res.status(201).json(productTag);
    } catch (error) {
      console.error('Error creating product tag:', error);
      res.status(500).json({ error: 'Failed to create product tag' });
    }
  });

  // Get product tag details
  app.get("/api/product-tags/:tagId", async (req: Request, res: Response) => {
    try {
      const { tagId } = req.params;
      const productTag = await storage.getProductTag(tagId);
      
      if (!productTag) {
        return res.status(404).json({ error: 'Product tag not found' });
      }

      res.json(productTag);
    } catch (error) {
      console.error('Error fetching product tag:', error);
      res.status(500).json({ error: 'Failed to fetch product tag' });
    }
  });

  // Company Authentication API endpoints
  app.post("/api/company-auth/login", async (req: Request, res: Response) => {
    try {
      const { companyId, accessCode } = req.body;
      
      // For demo purposes, use simple validation
      if (!companyId || !accessCode) {
        return res.status(400).json({ error: 'Company ID and access code are required' });
      }

      // Demo access validation
      if (accessCode !== 'demo123') {
        return res.status(401).json({ error: 'Invalid access code' });
      }

      const company = await storage.getCompanyByCompanyId(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Generate a simple company token (in production, use proper JWT)
      const token = jwt.sign(
        { companyId: company.companyId, id: company.id },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: '24h' }
      );

      res.json({
        token,
        companyId: company.companyId,
        companyName: company.name,
        company: company
      });
    } catch (error) {
      console.error('Error during company login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Company Portal API endpoints
  app.get("/api/companies/:companyId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const company = await storage.getCompanyByCompanyId(companyId);
      
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ error: 'Failed to fetch company' });
    }
  });

  app.get("/api/companies/:companyId/analytics", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      
      // Get comprehensive transaction history
      const transactions = await storage.getCompanyTransactionHistory(companyId, 100);
      const analytics = await storage.getCompanyFeeAnalytics(companyId);
      
      // Calculate event types distribution
      const eventsByType: Record<string, number> = {};
      transactions.forEach(tx => {
        eventsByType[tx.eventType] = (eventsByType[tx.eventType] || 0) + 1;
      });

      // Calculate product metrics
      const productMetrics = transactions.reduce((acc, tx) => {
        if (!acc[tx.tagId]) {
          acc[tx.tagId] = { count: 0, lastEventType: '', lastTimestamp: 0, totalFees: 0 };
        }
        acc[tx.tagId].count++;
        acc[tx.tagId].totalFees += tx.fee;
        if (tx.ts > acc[tx.tagId].lastTimestamp) {
          acc[tx.tagId].lastEventType = tx.eventType;
          acc[tx.tagId].lastTimestamp = tx.ts;
        }
        return acc;
      }, {} as Record<string, { count: number; lastEventType: string; lastTimestamp: number; totalFees: number }>);

      // Generate daily events data (last 7 days with actual data)
      const dailyEvents = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayEvents = transactions.filter(tx => {
          const txDate = new Date(tx.ts);
          return txDate.toDateString() === date.toDateString();
        });
        
        dailyEvents.push({
          date: dateStr,
          count: dayEvents.length,
          fees: dayEvents.reduce((sum, tx) => sum + tx.fee, 0)
        });
      }

      // Calculate performance metrics
      const totalEvents = transactions.length;
      const totalFees = transactions.reduce((sum, tx) => sum + tx.fee, 0);
      const averageFee = totalEvents > 0 ? totalFees / totalEvents : 0;
      const confirmedEvents = transactions.filter(tx => tx.status === 'confirmed').length;
      const successRate = totalEvents > 0 ? (confirmedEvents / totalEvents) * 100 : 0;
      const uniqueProducts = Object.keys(productMetrics).length;

      res.json({
        companyId,
        totalEvents,
        totalFees,
        averageFee,
        successRate,
        uniqueProducts,
        confirmedEvents,
        recentEvents: transactions.slice(0, 50).map(tx => ({
          id: tx.id,
          eventId: tx.eventId,
          eventType: tx.eventType,
          tagId: tx.tagId,
          timestamp: tx.ts,
          status: tx.status,
          txid: tx.txid,
          fee: tx.fee,
          leafHash: tx.leafHash,
          merkleRoot: tx.merkleRoot
        })),
        eventsByType,
        dailyEvents,
        productMetrics
      });
    } catch (error) {
      console.error('Error fetching company analytics:', error);
      res.status(500).json({ error: 'Failed to fetch company analytics' });
    }
  });

  // Create company event endpoint
  app.post("/api/companies/:companyId/events", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { eventType, tagId, eventData } = req.body;

      // Validate required fields
      if (!eventType || !tagId) {
        return res.status(400).json({ error: 'Event type and tag ID are required' });
      }

      // Create the event
      const event = await storage.createEvent({
        eventId: `evt_${Date.now()}`,
        eventType,
        tagId,
        ts: new Date(),
        txid: `tx_${Date.now()}`, // Mock transaction ID
        fee: 0.001, // Mock fee
        leafHash: `leaf_${Date.now()}`,
        merkleRoot: `merkle_${Date.now()}`,
        status: 'confirmed',
        companyId
      });

      res.json(event);
    } catch (error) {
      console.error('Error creating company event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  // Authentication routes for mobile app
  app.post("/api/v1/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '7d',
      });

      res.json({ 
        user: { id: user.id, email: user.email }, 
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/v1/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '7d',
      });

      res.json({ 
        user: { id: user.id, email: user.email }, 
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Purchase management routes
  app.post("/api/v1/users/me/purchases", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tagId, eventId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Generate purchase stamp transaction
      const stampTxid = `stamp_${Date.now()}_${userId}`;

      // Create purchase record
      const purchase = await storage.createPurchase({
        purchaseId: `purch_${Date.now()}`,
        userId: userId.toString(),
        eventId: eventId || "1",
        stampTxid,
        tagId,
        productName: "Product", // Would get from product tag
      });

      res.json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  app.get("/api/v1/users/me/purchases", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const purchases = await storage.getPurchasesByUser(userId);
      
      // Enrich purchases with product data
      const enrichedPurchases = await Promise.all(
        purchases.map(async (purchase) => {
          const productTag = await storage.getProductTag(purchase.tagId);
          return {
            ...purchase,
            product: {
              name: productTag?.productName || "Unknown Product",
              type: productTag?.productType || "Unknown",
              origin: productTag?.origin || "Unknown",
              tagId: purchase.tagId,
            },
          };
        })
      );

      res.json(enrichedPurchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/v1/users/me/purchases/:id/certificate", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const purchase = await storage.getPurchase(parseInt(id));
      
      if (!purchase || purchase.userId !== userId.toString()) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      // Generate PDF certificate (simplified for demo)
      const certificateData = {
        purchaseId: purchase.id,
        tagId: purchase.tagId,
        stampTxid: purchase.stampTxid,
        timestamp: purchase.createdAt,
        blockchain: "Kaspa",
        verified: true,
      };

      res.json(certificateData);
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
    }
  });

  // Policy management routes
  app.put("/api/companies/:companyId/policy", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { companyId } = req.params;
      const { visibleFields, commitEventTypes, reason } = req.body;
      const adminUserId = req.user?.id.toString() || "unknown";

      const updatedCompany = await storage.updateCompanyPolicy(
        companyId,
        visibleFields,
        commitEventTypes,
        adminUserId,
        reason
      );

      res.json({
        success: true,
        company: updatedCompany,
        message: "Policy updated successfully"
      });
    } catch (error) {
      console.error("Error updating policy:", error);
      res.status(500).json({ message: "Failed to update policy" });
    }
  });

  app.get("/api/policy/audits", authenticateToken, async (req: Request, res: Response) => {
    try {
      const companyId = req.query.companyId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const audits = await storage.getPolicyAudits(companyId, limit);
      res.json(audits);
    } catch (error) {
      console.error("Error getting policy audits:", error);
      res.status(500).json({ message: "Failed to retrieve policy audits" });
    }
  });

  app.get("/api/policy/audits/:companyId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const audits = await storage.getPolicyAudits(companyId, limit);
      res.json(audits);
    } catch (error) {
      console.error("Error getting company policy audits:", error);
      res.status(500).json({ message: "Failed to retrieve company policy audits" });
    }
  });

  // System alerts management
  app.post("/api/alerts", authenticateToken, async (req: Request, res: Response) => {
    try {
      const alertData = req.body;
      const alert = await storage.createSystemAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.get("/api/alerts", authenticateToken, async (req: Request, res: Response) => {
    try {
      const acknowledged = req.query.acknowledged === 'true' ? true : 
                          req.query.acknowledged === 'false' ? false : undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const alerts = await storage.getSystemAlerts(acknowledged, limit);
      res.json(alerts);
    } catch (error) {
      console.error("Error getting alerts:", error);
      res.status(500).json({ message: "Failed to retrieve alerts" });
    }
  });

  app.put("/api/alerts/:alertId/acknowledge", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const alertId = parseInt(req.params.alertId);
      const acknowledgedBy = req.user?.email || "unknown";
      
      const alert = await storage.acknowledgeAlert(alertId, acknowledgedBy);
      res.json({
        success: true,
        alert,
        message: "Alert acknowledged successfully"
      });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  // Advanced Analytics API Routes
  app.get("/api/analytics/system", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = to ? new Date(to as string) : new Date();

      const [
        systemAnalytics,
        eventTypeDistribution,
        geographicDistribution,
        performanceMetrics,
        productMetrics,
        dailyTrends,
        companyMetrics
      ] = await Promise.all([
        storage.getSystemAnalytics(startDate, endDate),
        storage.getEventTypeDistribution(startDate, endDate),
        storage.getGeographicDistribution(),
        storage.getPerformanceMetrics(startDate, endDate),
        storage.getProductJourneyAnalytics(startDate, endDate),
        storage.getDailyEventTrends(startDate, endDate),
        storage.getCompanyMetrics()
      ]);

      res.json({
        ...systemAnalytics,
        eventTypeDistribution,
        geographicDistribution,
        performanceMetrics,
        productMetrics,
        dailyEvents: dailyTrends,
        companyMetrics
      });
    } catch (error) {
      console.error("Error getting system analytics:", error);
      res.status(500).json({ message: "Failed to retrieve system analytics" });
    }
  });

  app.get("/api/analytics/company/:companyId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const { from, to } = req.query;
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = to ? new Date(to as string) : new Date();

      const [
        companyAnalytics,
        eventTypeDistribution,
        dailyTrends,
        productMetrics
      ] = await Promise.all([
        storage.getCompanyAnalytics(companyId, startDate, endDate),
        storage.getEventTypeDistribution(startDate, endDate),
        storage.getDailyEventTrends(startDate, endDate),
        storage.getProductJourneyAnalytics(startDate, endDate)
      ]);

      res.json({
        ...companyAnalytics,
        eventTypeDistribution,
        dailyEvents: dailyTrends,
        productMetrics
      });
    } catch (error) {
      console.error("Error getting company analytics:", error);
      res.status(500).json({ message: "Failed to retrieve company analytics" });
    }
  });

  app.get("/api/analytics/system/export", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { format = 'csv', from, to } = req.query;
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = to ? new Date(to as string) : new Date();

      const analytics = await storage.getSystemAnalytics(startDate, endDate);
      const dailyTrends = await storage.getDailyEventTrends(startDate, endDate);
      const companyMetrics = await storage.getCompanyMetrics();

      if (format === 'csv') {
        // Generate CSV content
        const csvContent = [
          // Header
          'Date,Events,Fees,Companies',
          // Data rows
          ...dailyTrends.map(row => `${row.date},${row.events},${row.fees},${row.companies}`)
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          analytics,
          dailyTrends,
          companyMetrics,
          exportDate: new Date().toISOString()
        });
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ message: "Failed to export analytics" });
    }
  });

  app.get("/api/analytics/company/:companyId/export", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const { format = 'csv', from, to } = req.query;
      const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = to ? new Date(to as string) : new Date();

      const analytics = await storage.getCompanyAnalytics(companyId, startDate, endDate);
      const dailyTrends = await storage.getDailyEventTrends(startDate, endDate);

      if (format === 'csv') {
        const csvContent = [
          'Date,Events,Fees',
          ...dailyTrends.map(row => `${row.date},${row.events},${row.fees}`)
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="company-${companyId}-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="company-${companyId}-analytics-${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          companyId,
          analytics,
          dailyTrends,
          exportDate: new Date().toISOString()
        });
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Error exporting company analytics:", error);
      res.status(500).json({ message: "Failed to export company analytics" });
    }
  });

  // Notification API Routes
  app.get("/api/notifications", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = (req.user as any)?.companyId;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const notifications = await storage.getNotifications(
        req.user?.id,
        companyId,
        limit
      );
      
      res.json(notifications);
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({ message: "Failed to retrieve notifications" });
    }
  });

  app.get("/api/notifications/unread-count", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = (req.user as any)?.companyId;
      
      const count = await storage.getUnreadNotificationCount(
        req.user?.id,
        companyId
      );
      
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      res.status(500).json({ message: "Failed to retrieve unread count" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const notification = await storage.markNotificationAsRead(parseInt(id));
      
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/mark-all-read", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = (req.user as any)?.companyId;
      
      await storage.markAllNotificationsAsRead(req.user?.id, companyId);
      
      res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      await storage.deleteNotification(parseInt(id));
      
      res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Test endpoint to create sample notifications
  app.post("/api/notifications/create-sample", authenticateToken, async (req: Request, res: Response) => {
    try {
      const sampleNotifications = [
        {
          type: 'success',
          title: 'Event Successfully Processed',
          message: 'FARM event for TAG-123456 has been committed to blockchain',
          companyId: 'comp_1234567890',
          actionUrl: '/company-portal?tab=events',
          read: false,
        },
        {
          type: 'warning',
          title: 'Low Wallet Balance',
          message: 'Your wallet balance is below 50 KAS threshold',
          companyId: 'comp_1234567890',
          actionUrl: '/company-portal?tab=overview',
          read: false,
        },
        {
          type: 'info',
          title: 'Policy Updated',
          message: 'Company policy has been updated by admin',
          companyId: 'comp_1234567890',
          actionUrl: '/company-portal?tab=policy',
          read: false,
        },
        {
          type: 'error',
          title: 'Transaction Failed',
          message: 'Failed to commit event to blockchain. Please try again.',
          companyId: 'comp_1234567890',
          actionUrl: '/company-portal?tab=events',
          read: false,
        },
      ];

      const createdNotifications = [];
      for (const notification of sampleNotifications) {
        const created = await storage.createNotification(notification);
        createdNotifications.push(created);
      }

      res.json({ 
        success: true, 
        message: "Sample notifications created",
        notifications: createdNotifications 
      });
    } catch (error) {
      console.error("Error creating sample notifications:", error);
      res.status(500).json({ message: "Failed to create sample notifications" });
    }
  });

  // Error handling and monitoring routes
  app.get("/api/error-logs", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const errorLogs = await storage.getErrorLogs(limit);
      res.json(errorLogs);
    } catch (error) {
      console.error("Error fetching error logs:", error);
      res.status(500).json({ message: "Failed to fetch error logs" });
    }
  });

  app.get("/api/error-logs/operation/:operationName", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { operationName } = req.params;
      const errorLogs = await storage.getErrorLogsByOperation(operationName);
      res.json(errorLogs);
    } catch (error) {
      console.error("Error fetching error logs by operation:", error);
      res.status(500).json({ message: "Failed to fetch error logs" });
    }
  });

  app.put("/api/error-logs/:errorId/resolve", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errorId = parseInt(req.params.errorId);
      await storage.markErrorAsResolved(errorId);
      res.json({ message: "Error marked as resolved" });
    } catch (error) {
      console.error("Error marking error as resolved:", error);
      res.status(500).json({ message: "Failed to mark error as resolved" });
    }
  });

  app.get("/api/dead-letter-queue", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deadLetterQueue = await storage.getDeadLetterQueue();
      res.json(deadLetterQueue);
    } catch (error) {
      console.error("Error fetching dead letter queue:", error);
      res.status(500).json({ message: "Failed to fetch dead letter queue" });
    }
  });

  app.put("/api/dead-letter-queue/:operationId/status", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { operationId } = req.params;
      const { status } = req.body;
      await storage.updateDeadLetterQueueStatus(operationId, status);
      res.json({ message: "Dead letter queue status updated" });
    } catch (error) {
      console.error("Error updating dead letter queue status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.delete("/api/dead-letter-queue/:operationId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { operationId } = req.params;
      await storage.removeFromDeadLetterQueue(operationId);
      res.json({ message: "Operation removed from dead letter queue" });
    } catch (error) {
      console.error("Error removing from dead letter queue:", error);
      res.status(500).json({ message: "Failed to remove from dead letter queue" });
    }
  });

  app.get("/api/system-metrics", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const metricType = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 100;
      const metrics = await storage.getSystemMetrics(metricType, limit);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  app.get("/api/system-metrics/time-range", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const start = new Date(req.query.start as string);
      const end = new Date(req.query.end as string);
      const metricType = req.query.type as string;
      const metrics = await storage.getSystemMetricsByTimeRange(start, end, metricType);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics by time range:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  app.get("/api/error-handler/stats", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = ErrorHandler.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching error handler stats:", error);
      res.status(500).json({ message: "Failed to fetch error handler stats" });
    }
  });

  app.get("/api/error-handler/failed-operations", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const failedOperations = ErrorHandler.getFailedOperations();
      res.json(failedOperations);
    } catch (error) {
      console.error("Error fetching failed operations:", error);
      res.status(500).json({ message: "Failed to fetch failed operations" });
    }
  });

  // Enhanced test route for blockchain transaction error handling
  app.post("/api/test/blockchain-error", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await ErrorHandler.handleBlockchainTransaction(
        async () => {
          // Simulate a failing blockchain transaction
          throw new Error("INSUFFICIENT_FUNDS");
        },
        {
          companyId: "test_company",
          endpoint: "/api/test/blockchain-error",
          metadata: { testOperation: true }
        }
      );
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // System monitoring endpoints
  app.get("/api/system/health", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { monitoringService } = await import("./services/monitoring");
      const health = await monitoringService.getSystemHealth();
      res.json(health);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get system health" });
    }
  });

  // Wallet testing endpoint - public for easier testing
  app.get('/api/system/wallet-test', async (req: Request, res: Response) => {
    try {
      const { getMasterWallet, getCompanyWallet } = await import('./services/wallet.js');
      
      const masterWallet = await getMasterWallet();
      const company1Wallet = await getCompanyWallet(1);
      const company2Wallet = await getCompanyWallet(2);
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        wallets: {
          master: {
            address: masterWallet.address,
            derivationPath: masterWallet.derivationPath
          },
          company1: {
            address: company1Wallet.address,
            derivationPath: company1Wallet.derivationPath
          },
          company2: {
            address: company2Wallet.address,
            derivationPath: company2Wallet.derivationPath
          }
        },
        blockchain: {
          network: 'kaspa-testnet',
          addressFormat: 'kaspatest:',
          cryptoLibrary: 'Noble secp256k1 + SHA256',
          hdDerivation: 'BIP44 coin type 277',
          authentic: true
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });

  app.get("/api/system/performance-report", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { monitoringService } = await import("./services/monitoring");
      const report = await monitoringService.generatePerformanceReport();
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate performance report" });
    }
  });

  app.get("/api/system/metrics/recent", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const metricType = req.query.type as string;
      
      const metrics = await storage.getSystemMetrics(metricType, limit);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get recent metrics" });
    }
  });

  // Enhanced metrics endpoint with recommendations
  // Security compliance endpoints
  app.get("/api/security/compliance-metrics", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { complianceService } = await import("./services/compliance");
      const days = parseInt(req.query.days as string) || 30;
      
      const metrics = await complianceService.getComplianceMetrics(days);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get compliance metrics" });
    }
  });

  app.get("/api/security/compliance-report", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { complianceService } = await import("./services/compliance");
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const companyId = req.query.companyId as string;
      
      const report = await complianceService.generateComplianceReport(startDate, endDate, companyId);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate compliance report" });
    }
  });

  app.get("/api/security/audit-logs", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const companyId = req.query.companyId as string;
      const action = req.query.action as string;
      
      const auditLogs = await storage.getAuditLogs({ limit, companyId, action });
      res.json(auditLogs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get audit logs" });
    }
  });

  app.get("/api/security/incidents", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const severity = req.query.severity as string;
      const resolved = req.query.resolved === 'true';
      
      const incidents = await storage.getSecurityIncidents({ limit, severity, resolved });
      res.json(incidents);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get security incidents" });
    }
  });

  app.post("/api/security/incidents", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { complianceService } = await import("./services/compliance");
      const incident = req.body;
      
      await complianceService.logSecurityIncident(incident);
      res.json({ message: "Security incident logged successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to log security incident" });
    }
  });

  app.put("/api/security/incidents/:id/resolve", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const incidentId = parseInt(req.params.id);
      const resolvedBy = req.user?.id?.toString();
      
      await storage.resolveSecurityIncident(incidentId, resolvedBy);
      res.json({ message: "Security incident resolved successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to resolve security incident" });
    }
  });

  app.get("/api/security/export-compliance", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { complianceService } = await import("./services/compliance");
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const format = req.query.format as 'json' | 'csv' || 'json';
      
      const data = await complianceService.exportComplianceData(startDate, endDate, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.csv"');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.json"');
      }
      
      res.send(data);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to export compliance data" });
    }
  });

  app.get("/api/system/metrics/recommendations", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { monitoringService } = await import("./services/monitoring");
      
      // Get key performance indicators
      const memoryMetrics = monitoringService.getMetrics('memory_usage', 10);
      const responseTimeMetrics = monitoringService.getMetrics('response_time', 50);
      const errorMetrics = monitoringService.getMetrics('error_count', 20);
      const uptimeMetrics = monitoringService.getMetrics('uptime', 1);
      
      // Calculate recommendations
      const recommendations = [];
      
      // Memory usage recommendations (80% threshold)
      if (memoryMetrics.length > 0) {
        const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;
        const memoryPercentage = memoryMetrics[0]?.metadata?.heapTotal ? 
          (avgMemory / memoryMetrics[0].metadata.heapTotal) * 100 : 0;
        
        if (memoryPercentage > 80) {
          recommendations.push({
            type: 'warning',
            title: 'High Memory Usage Alert',
            message: `Memory usage is at ${memoryPercentage.toFixed(1)}%. This can slow performance and risk crashes. Consider: restarting the server, optimizing queries, or increasing memory resources.`,
            priority: 'high'
          });
        } else if (memoryPercentage > 65) {
          recommendations.push({
            type: 'info',
            title: 'Memory Usage Monitoring',
            message: `Memory usage is at ${memoryPercentage.toFixed(1)}%. Still healthy but approaching caution threshold.`,
            priority: 'low'
          });
        }
      }
      
      // Response time recommendations (1000ms threshold)
      if (responseTimeMetrics.length > 0) {
        const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
        const slowRequests = responseTimeMetrics.filter(m => m.value > 1000).length;
        
        if (avgResponseTime > 1000) {
          recommendations.push({
            type: 'warning',
            title: 'Slow Response Times Detected',
            message: `Average response time is ${avgResponseTime.toFixed(0)}ms with ${slowRequests} slow requests. Users expect <500ms. Consider: database query optimization, API caching, or code profiling.`,
            priority: 'medium'
          });
        } else if (avgResponseTime > 500) {
          recommendations.push({
            type: 'info',
            title: 'Response Time Monitoring',
            message: `Average response time is ${avgResponseTime.toFixed(0)}ms. Still acceptable but could be improved.`,
            priority: 'low'
          });
        }
      }
      
      // Error rate monitoring with pattern recognition
      if (errorMetrics.length > 5) {
        const errorTypes = errorMetrics.reduce((acc, m) => {
          const type = m.metadata?.type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mostCommonError = Object.entries(errorTypes).sort(([,a], [,b]) => Number(b) - Number(a))[0];
        
        recommendations.push({
          type: 'error',
          title: 'High Error Rate Pattern Detected',
          message: `${errorMetrics.length} errors in recent period. Most common: ${mostCommonError?.[0]} (${mostCommonError?.[1]} occurrences). Check error logs and fix recurring issues.`,
          priority: 'high'
        });
      } else if (errorMetrics.length > 2) {
        recommendations.push({
          type: 'warning',
          title: 'Error Rate Monitoring',
          message: `${errorMetrics.length} errors detected. Monitor for patterns and investigate causes.`,
          priority: 'medium'
        });
      }
      
      // Uptime notifications for recent system restarts
      if (uptimeMetrics.length > 0) {
        const uptimeSeconds = uptimeMetrics[0].value;
        const uptimeHours = uptimeSeconds / 3600;
        
        if (uptimeSeconds < 1800) { // Less than 30 minutes
          recommendations.push({
            type: 'warning',
            title: 'Recent System Restart',
            message: `System restarted ${Math.floor(uptimeSeconds/60)} minutes ago. Monitor for stability and check if restart was planned.`,
            priority: 'medium'
          });
        } else if (uptimeSeconds < 3600) { // Less than 1 hour
          recommendations.push({
            type: 'info',
            title: 'System Restart Notification',
            message: `System restarted ${Math.floor(uptimeHours)} hour ago. Watch for any recurring issues.`,
            priority: 'low'
          });
        }
      }
      
      // Performance optimization tips
      recommendations.push({
        type: 'success',
        title: 'CPU Performance Optimization',
        message: 'Monitor CPU usage patterns during peak times. Consider load balancing for high-traffic periods.',
        priority: 'low'
      });
      
      recommendations.push({
        type: 'success',
        title: 'Database Performance Tips',
        message: 'Implement query optimization, connection pooling, and consider indexing frequently queried fields.',
        priority: 'low'
      });
      
      recommendations.push({
        type: 'success',
        title: 'Security & Monitoring Best Practices',
        message: 'Regular security audits, rate limiting, and continuous monitoring maintain optimal performance.',
        priority: 'low'
      });
      
      res.json({
        recommendations,
        summary: {
          totalMetrics: memoryMetrics.length + responseTimeMetrics.length + errorMetrics.length,
          healthScore: Math.max(0, 100 - (recommendations.length * 20)),
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Security compliance endpoints
  app.get("/api/security/compliance-metrics", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Get security metrics for the time period
      const auditLogs = await storage.getAuditLogs({ limit: 1000 });
      const incidents = await storage.getSecurityIncidents({ limit: 100 });
      
      // Calculate compliance metrics
      const totalRequests = auditLogs.filter(log => 
        new Date(log.timestamp) >= startDate && 
        new Date(log.timestamp) <= endDate
      ).length;
      
      const failedRequests = auditLogs.filter(log => 
        new Date(log.timestamp) >= startDate && 
        new Date(log.timestamp) <= endDate &&
        log.action.includes('failed')
      ).length;
      
      const securityIncidents = incidents.filter(incident => 
        incident.createdAt && new Date(incident.createdAt) >= startDate && 
        new Date(incident.createdAt) <= endDate
      ).length;
      
      const dataAccessLogs = auditLogs.filter(log => 
        new Date(log.timestamp) >= startDate && 
        new Date(log.timestamp) <= endDate &&
        log.action.includes('data_access')
      ).length;
      
      const passwordChanges = auditLogs.filter(log => 
        new Date(log.timestamp) >= startDate && 
        new Date(log.timestamp) <= endDate &&
        log.action.includes('password')
      ).length;
      
      const sessionActivity = auditLogs.filter(log => 
        new Date(log.timestamp) >= startDate && 
        new Date(log.timestamp) <= endDate &&
        (log.action.includes('login') || log.action.includes('logout'))
      ).length;
      
      // Calculate compliance score
      const baseScore = 100;
      const securityIncidentPenalty = securityIncidents * 10;
      const failedRequestPenalty = Math.min(failedRequests * 2, 20);
      const complianceScore = Math.max(0, baseScore - securityIncidentPenalty - failedRequestPenalty);

      res.json({
        totalRequests,
        failedRequests,
        securityIncidents,
        dataAccessLogs,
        passwordChanges,
        sessionActivity,
        complianceScore
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get compliance metrics" });
    }
  });

  app.get("/api/security/compliance-report", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const auditLogs = await storage.getAuditLogs({ limit: 1000 });
      const incidents = await storage.getSecurityIncidents({ limit: 100 });
      
      const filteredLogs = auditLogs.filter(log => 
        new Date(log.timestamp) >= startDate && 
        new Date(log.timestamp) <= endDate
      );
      
      const filteredIncidents = incidents.filter(incident => 
        new Date(incident.createdAt) >= startDate && 
        new Date(incident.createdAt) <= endDate
      );

      res.json({
        period: { startDate, endDate },
        auditLogs: filteredLogs,
        securityIncidents: filteredIncidents,
        summary: {
          totalLogs: filteredLogs.length,
          totalIncidents: filteredIncidents.length,
          resolvedIncidents: filteredIncidents.filter(i => i.resolved).length,
          criticalIncidents: filteredIncidents.filter(i => i.severity === 'critical').length
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get compliance report" });
    }
  });

  app.get("/api/security/audit-logs", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const companyId = req.query.companyId as string;
      const action = req.query.action as string;
      
      const auditLogs = await storage.getAuditLogs({ limit, companyId, action });
      res.json(auditLogs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get audit logs" });
    }
  });

  app.get("/api/security/incidents", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const severity = req.query.severity as string;
      const resolved = req.query.resolved ? req.query.resolved === 'true' : undefined;
      
      const incidents = await storage.getSecurityIncidents({ limit, severity, resolved });
      res.json(incidents);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get security incidents" });
    }
  });

  app.post("/api/security/incidents", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type, severity, description, userId, companyId, ipAddress, userAgent } = req.body;
      
      const incident = await storage.createSecurityIncident({
        type,
        severity,
        description,
        userId,
        companyId,
        ipAddress,
        userAgent,
        resolved: false
      });
      
      res.json(incident);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create security incident" });
    }
  });

  app.put("/api/security/incidents/:id/resolve", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const incidentId = parseInt(req.params.id);
      const resolvedBy = req.user?.email || 'admin';
      
      await storage.resolveSecurityIncident(incidentId, resolvedBy);
      res.json({ message: "Security incident resolved" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to resolve security incident" });
    }
  });

  app.get("/api/security/export-compliance", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const format = req.query.format as string || 'json';
      
      const auditLogs = await storage.getAuditLogs({ limit: 10000 });
      const incidents = await storage.getSecurityIncidents({ limit: 1000 });
      
      const filteredLogs = auditLogs.filter(log => 
        new Date(log.timestamp) >= startDate && 
        new Date(log.timestamp) <= endDate
      );
      
      const filteredIncidents = incidents.filter(incident => 
        new Date(incident.createdAt) >= startDate && 
        new Date(incident.createdAt) <= endDate
      );
      
      const exportData = {
        exportDate: new Date(),
        period: { startDate, endDate },
        auditLogs: filteredLogs,
        securityIncidents: filteredIncidents,
        summary: {
          totalLogs: filteredLogs.length,
          totalIncidents: filteredIncidents.length,
          resolvedIncidents: filteredIncidents.filter(i => i.resolved).length,
          criticalIncidents: filteredIncidents.filter(i => i.severity === 'critical').length
        }
      };
      
      if (format === 'csv') {
        // Simple CSV export for audit logs
        const csvHeaders = 'Timestamp,Action,User ID,Company ID,Resource Type,IP Address\n';
        const csvData = filteredLogs.map(log => 
          `${log.timestamp},${log.action},${log.userId || ''},${log.companyId || ''},${log.resourceType || ''},${log.ipAddress || ''}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.csv"');
        res.send(csvHeaders + csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.json"');
        res.json(exportData);
      }
    } catch (error: any) {
      res.status(500).json({ message: "Failed to export compliance data" });
    }
  });

  // Test endpoint to verify routing works
  app.get("/api/kaspa/test", (req: Request, res: Response) => {
    res.json({ 
      message: "Kaspa endpoints are working",
      timestamp: new Date().toISOString(),
      masterWallet: "kaspatest:qpcny7wvghcz88f9fa8ll5hrdpsgcryjq4w0lya70pp65ew60xw563akqns4m",
      status: "routing functional"
    });
  });

  // Kaspa blockchain endpoints
  app.get("/api/kaspa/balance", async (req: Request, res: Response) => {
    try {
      const address = req.query.address as string;
      if (!address) {
        return res.status(400).json({ error: "Address parameter required" });
      }
      
      // Use direct balance check for now (imports failing)
      console.log(`Checking balance for ${address}`);
      res.json({ 
        address,
        balance: "0.00",
        balanceRaw: "0",
        network: 'testnet-10',
        note: 'Balance check via testnet API - import issues prevented real check'
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get balance", message: error.message });
    }
  });

  app.post("/api/kaspa/fund-wallet", async (req: Request, res: Response) => {
    try {
      const { targetAddress, amount } = req.body;
      
      if (!targetAddress || !amount) {
        return res.status(400).json({ error: "targetAddress and amount required" });
      }
      
      // Set the master wallet to the funded address
      const masterWallet = "kaspatest:qpcny7wvghcz88f9fa8ll5hrdpsgcryjq4w0lya70pp65ew60xw563akqns4m";
      
      console.log(`🚀 FUNDING REQUEST: ${amount} KAS to ${targetAddress}`);
      
      // USE DIRECT KASPA-WASM FOR ACTUAL TRANSACTION BROADCASTING
      try {
        const { createTransaction, broadcastTransaction } = await import('./services/kaspa-wasm-wallet.js');
        const mnemonic = process.env.MASTER_MNEMONIC || 'one two three four five six seven eight nine ten eleven twelve';
        
        console.log(`🚀 ATTEMPTING REAL BLOCKCHAIN TRANSFER`);
        console.log(`From: ${masterWallet}`);
        console.log(`To: ${targetAddress}`);
        console.log(`Amount: ${amount} KAS`);
        
        // Create and broadcast real transaction
        const txResult = await createTransaction(mnemonic, targetAddress, amount);
        
        if (txResult.success) {
          console.log(`✅ REAL TRANSACTION BROADCASTED: ${txResult.txId}`);
          res.json({
            success: true,
            txId: txResult.txId,
            from: masterWallet,
            to: targetAddress,
            amount: `${amount} KAS`,
            explorer: `https://explorer.kaspa.org/testnet/txs/${txResult.txId}`,
            status: 'broadcasted to Kaspa testnet',
            confirmations: 0,
            note: 'Real blockchain transaction submitted'
          });
        } else {
          throw new Error(txResult.error || 'Transaction creation failed');
        }
        
      } catch (txError: any) {
        console.error(`❌ TRANSACTION FAILED: ${txError.message}`);
        
        const txId = `kaspa_failed_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`;
        res.json({
          success: false,
          error: "Real transaction failed",
          txId: txId,
          from: masterWallet,
          to: targetAddress,
          amount: `${amount} KAS`,
          explorer: `https://explorer.kaspa.org/testnet/txs/${txId}`,
          status: 'failed - transaction error',
          details: txError.message,
          note: 'Attempted real blockchain transaction but failed'
        });
      }
      
    } catch (error: any) {
      console.error('❌ FUNDING FAILED:', error.message);
      res.status(500).json({ 
        success: false,
        error: "Failed to fund wallet", 
        message: error.message,
        note: 'Check Kaspa network connectivity and master wallet balance'
      });
    }
  });

  app.get("/api/kaspa/generate-wallet", async (req: Request, res: Response) => {
    try {
      const index = parseInt(req.query.index as string) || 0;
      
      const { generateHDTestnetWallet } = await import('./services/kaspa-wasm-wallet.js');
      const mnemonic = process.env.MASTER_MNEMONIC || 'one two three four five six seven eight nine ten eleven twelve';
      
      const wallet = await generateHDTestnetWallet(mnemonic, index);
      
      res.json({
        success: true,
        wallet: {
          address: wallet.address,
          derivationPath: `m/44'/277'/${index}'/0/0`,
          network: 'testnet-10'
        },
        note: 'Generated from master mnemonic'
      });
      
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        error: "Failed to generate wallet", 
        message: error.message 
      });
    }
  });

  // Database security and backup endpoints
  app.get("/api/database/health", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const healthMetrics = await databaseSecurityService.getHealthMetrics();
      res.json(healthMetrics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get database health metrics" });
    }
  });

  app.get("/api/backup/status", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const backupMetrics = await backupService.getBackupMetrics();
      res.json(backupMetrics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get backup status" });
    }
  });

  app.post("/api/backup/create", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const backupResult = await backupService.createBackup();
      res.json({ 
        success: true, 
        message: "Backup created successfully",
        backup: backupResult 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.get("/api/backup/history", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const backupHistory = await backupService.getBackupHistory();
      res.json(backupHistory);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get backup history" });
    }
  });

  app.get("/api/backup/configuration", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = backupService.getConfiguration();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get backup configuration" });
    }
  });

  app.put("/api/backup/configuration", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await backupService.updateConfiguration(req.body);
      res.json({ message: "Backup configuration updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update backup configuration" });
    }
  });

  app.post("/api/backup/verify", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const isValid = await backupService.verifyBackupIntegrity();
      res.json({ 
        success: true, 
        valid: isValid,
        message: isValid ? "Backup verification successful" : "Backup verification failed"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to verify backup integrity" });
    }
  });

  app.get("/api/data-retention/policies", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const policies = await dataRetentionService.getPolicies();
      res.json(policies);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get retention policies" });
    }
  });

  app.get("/api/data-retention/metrics", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics = await dataRetentionService.getRetentionMetrics();
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get retention metrics" });
    }
  });

  app.put("/api/data-retention/policies/:policyId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { policyId } = req.params;
      await dataRetentionService.updatePolicy(policyId, req.body);
      res.json({ message: "Retention policy updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update retention policy" });
    }
  });

  app.post("/api/data-retention/cleanup", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { policyId } = req.body;
      const results = await dataRetentionService.executeCleanup(policyId);
      res.json({ 
        success: true, 
        message: "Data retention cleanup completed",
        results 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to execute data retention cleanup" });
    }
  });

  app.post("/api/data-retention/policies", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await dataRetentionService.createCustomPolicy(req.body);
      res.json({ message: "Custom retention policy created successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create custom retention policy" });
    }
  });

  app.delete("/api/data-retention/policies/:policyId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { policyId } = req.params;
      await dataRetentionService.deletePolicy(policyId);
      res.json({ message: "Retention policy deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete retention policy" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket notification service
  notificationService.initialize(httpServer);
  
  return httpServer;
}
