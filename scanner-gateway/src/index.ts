import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { body, validationResult, param } from 'express-validator';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const KMP_MESSAGE_BUS_URL = process.env.KMP_MESSAGE_BUS_URL || 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'kmp-scanner-gateway-secret';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Rate limiting - more generous for scanners
const scannerRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 scans per minute per scanner
  message: { error: 'Too many scan requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory scanner registry (production would use database)
interface Scanner {
  id: string;
  apiKey: string;
  companyId: number;
  name: string;
  location: string;
  type: 'handheld' | 'fixed' | 'mobile' | 'integrated';
  status: 'active' | 'inactive';
  lastSeen: Date;
  totalScans: number;
}

const scanners = new Map<string, Scanner>();

// Authentication middleware for scanners
const authenticateScanner = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const scanner = Array.from(scanners.values()).find(s => s.apiKey === apiKey);
  if (!scanner || scanner.status !== 'active') {
    return res.status(401).json({ error: 'Invalid or inactive scanner' });
  }

  req.scanner = scanner;
  next();
};

/**
 * 🏥 Health Check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'KMP Scanner Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    activeScannersCount: Array.from(scanners.values()).filter(s => s.status === 'active').length
  });
});

/**
 * 📋 Scanner Registration
 * Companies use this endpoint to register new scanners
 */
app.post('/api/scanners/register', [
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('companyId').isInt({ min: 1 }),
  body('location').isString().isLength({ min: 1, max: 200 }),
  body('type').isIn(['handheld', 'fixed', 'mobile', 'integrated']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, companyId, location, type } = req.body;
  
  // Generate scanner credentials
  const scannerId = uuidv4();
  const apiKey = `kmp_scanner_${uuidv4().replace(/-/g, '')}`;
  
  const scanner: Scanner = {
    id: scannerId,
    apiKey,
    companyId,
    name,
    location,
    type,
    status: 'active',
    lastSeen: new Date(),
    totalScans: 0
  };

  scanners.set(scannerId, scanner);

  res.status(201).json({
    success: true,
    scanner: {
      id: scannerId,
      name,
      location,
      type,
      apiKey,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/scan`,
      documentation: `${req.protocol}://${req.get('host')}/docs/scanner-integration`
    },
    message: 'Scanner registered successfully. Save the API key securely - it cannot be retrieved later.'
  });
});

/**
 * 📊 Scanner Status
 */
app.get('/api/scanners/:scannerId', [
  param('scannerId').isUUID()
], (req, res) => {
  const { scannerId } = req.params;
  const scanner = scanners.get(scannerId);
  
  if (!scanner) {
    return res.status(404).json({ error: 'Scanner not found' });
  }

  res.json({
    id: scanner.id,
    name: scanner.name,
    location: scanner.location,
    type: scanner.type,
    status: scanner.status,
    lastSeen: scanner.lastSeen,
    totalScans: scanner.totalScans,
    // Don't expose API key in status endpoint
  });
});

/**
 * 🔫 MAIN SCAN ENDPOINT
 * This is where ALL scanners send their data
 */
app.post('/api/scan', 
  scannerRateLimit,
  authenticateScanner,
  [
    body('productId').isString().isLength({ min: 1, max: 100 }),
    body('eventType').optional().isString().isLength({ min: 1, max: 50 }),
    body('timestamp').optional().isISO8601(),
    body('location').optional().isString().isLength({ max: 200 }),
    body('operator').optional().isString().isLength({ max: 100 }),
    body('data').optional().isObject(),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const scanner = req.scanner;
    const { 
      productId, 
      eventType = 'SCAN', 
      timestamp = new Date().toISOString(),
      location = scanner.location,
      operator = 'Scanner',
      data = {}
    } = req.body;

    try {
      // Update scanner stats
      scanner.lastSeen = new Date();
      scanner.totalScans++;
      scanners.set(scanner.id, scanner);

      // Prepare KMP event
      const kmpEvent = {
        productId,
        eventType,
        location,
        timestamp,
        data: {
          ...data,
          operator,
          scannerId: scanner.id,
          scannerName: scanner.name,
          scannerType: scanner.type,
          scannerLocation: scanner.location,
          source: 'SCANNER_GATEWAY'
        },
        metadata: {
          scannerId: scanner.id,
          companyId: scanner.companyId,
          gateway: 'KMP_SCANNER_GATEWAY',
          version: '1.0.0'
        }
      };

      // Forward to KMP Message Bus
      const kmpResponse = await axios.post(
        `${KMP_MESSAGE_BUS_URL}/api/supply-chain/event`,
        kmpEvent,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Scanner-Gateway': 'true'
          },
          timeout: 30000
        }
      );

      // Return success to scanner
      res.status(201).json({
        success: true,
        scanId: uuidv4(),
        eventId: kmpResponse.data.eventId,
        transactionId: kmpResponse.data.transactionId,
        timestamp,
        message: 'Scan processed and anchored to blockchain'
      });

      console.log(`✅ Scan processed: ${productId} from ${scanner.name} (${scanner.type})`);

    } catch (error: any) {
      console.error(`❌ Scan processing failed:`, error.message);
      
      res.status(500).json({
        success: false,
        error: 'Scan processing failed',
        message: 'The scan was received but could not be processed. Please try again.',
        timestamp
      });
    }
  }
);

/**
 * 📊 Company Scanner Dashboard
 */
app.get('/api/company/:companyId/scanners', [
  param('companyId').isInt({ min: 1 })
], (req, res) => {
  const companyId = parseInt(req.params.companyId);
  const companyScanners = Array.from(scanners.values())
    .filter(s => s.companyId === companyId)
    .map(s => ({
      id: s.id,
      name: s.name,
      location: s.location,
      type: s.type,
      status: s.status,
      lastSeen: s.lastSeen,
      totalScans: s.totalScans
    }));

  res.json({
    companyId,
    totalScanners: companyScanners.length,
    activeScanners: companyScanners.filter(s => s.status === 'active').length,
    totalScans: companyScanners.reduce((sum, s) => sum + s.totalScans, 0),
    scanners: companyScanners
  });
});

/**
 * 📚 Integration Documentation
 */
app.get('/docs/scanner-integration', (req, res) => {
  res.json({
    title: 'KMP Scanner Integration Guide',
    description: 'Simple HTTP webhook integration for supply chain scanners',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      scan: {
        url: '/api/scan',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'your-scanner-api-key'
        },
        body: {
          productId: 'string (required) - Product barcode, RFID, or ID',
          eventType: 'string (optional) - SCAN, RECEIVE, SHIP, etc. Default: SCAN',
          timestamp: 'string (optional) - ISO8601 timestamp. Default: now',
          location: 'string (optional) - Override scanner default location',
          operator: 'string (optional) - Operator name/ID',
          data: 'object (optional) - Additional scan data'
        },
        example: {
          productId: 'SKU123456789',
          eventType: 'QUALITY_CHECK',
          operator: 'John Doe',
          data: {
            batchNumber: 'B2024001',
            temperature: '22.5C',
            notes: 'Passed quality inspection'
          }
        }
      }
    },
    authentication: {
      method: 'API Key',
      header: 'X-API-Key: your-scanner-api-key',
      alternative: 'Authorization: Bearer your-scanner-api-key'
    },
    rateLimits: {
      scans: '100 requests per minute per scanner'
    },
    responses: {
      success: {
        status: 201,
        body: {
          success: true,
          scanId: 'uuid',
          eventId: 'kmp-event-id',
          transactionId: 'kaspa-transaction-id',
          timestamp: 'iso8601'
        }
      },
      errors: {
        401: 'Invalid API key',
        400: 'Invalid request data',
        429: 'Rate limit exceeded',
        500: 'Processing error'
      }
    },
    integration: {
      steps: [
        '1. Register scanner: POST /api/scanners/register',
        '2. Save API key securely in scanner device/software',
        '3. Configure scanner to POST scan data to /api/scan',
        '4. Monitor scanner status via company dashboard'
      ],
      common_integrations: {
        'Zebra Scanners': 'Configure DataWedge intent with HTTP POST action',
        'Honeywell Scanners': 'Use ScanToConnect with webhook configuration',
        'Custom Mobile Apps': 'Add HTTP POST call after scan capture',
        'ERP Systems': 'Create webhook endpoint in existing scan workflow'
      }
    }
  });
});

/**
 * 🚀 Start Server
 */
app.listen(PORT, () => {
  console.log(`🚀 KMP Scanner Gateway listening on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Integration docs: http://localhost:${PORT}/docs/scanner-integration`);
  console.log(`🔗 KMP Message Bus: ${KMP_MESSAGE_BUS_URL}`);
  console.log('');
  console.log('🔫 Ready to receive scanner data!');
  
  // Create a demo scanner for testing
  const demoScanner: Scanner = {
    id: 'demo-scanner-001',
    apiKey: 'kmp_scanner_demo_key_12345',
    companyId: 1,
    name: 'Demo Handheld Scanner',
    location: 'Warehouse A',
    type: 'handheld',
    status: 'active',
    lastSeen: new Date(),
    totalScans: 0
  };
  scanners.set(demoScanner.id, demoScanner);
  
  console.log('🎯 Demo scanner created:');
  console.log(`   API Key: ${demoScanner.apiKey}`);
  console.log(`   Test command: curl -X POST http://localhost:${PORT}/api/scan \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -H "X-API-Key: ${demoScanner.apiKey}" \\`);
  console.log(`     -d '{"productId":"TEST-SKU-001","eventType":"SCAN"}'`);
});

export default app; 