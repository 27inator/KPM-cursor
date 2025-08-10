import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { monitoringService } from "./services/monitoring";
import { 
  generalRateLimit, 
  securityHeaders, 
  validateRequest, 
  sanitizeInput 
} from "./middleware/security";
import { 
  responseTimeTracker, 
  requestLogger, 
  healthCheck 
} from "./middleware/performance";
import { databaseSecurityService } from "./middleware/database-security";
import { backupService } from "./services/backup-service";
import { dataRetentionService } from "./services/data-retention";

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Apply security compliance middleware
import { securityMiddleware } from './middleware/security-compliance';

// Apply monitoring middleware and security compliance
app.use(responseTimeTracker);
app.use(securityMiddleware.securityHeaders);
app.use(securityMiddleware.requestValidator);
app.use(securityMiddleware.performanceMonitor);
app.use(securityMiddleware.auditLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Health check endpoint
  app.get('/health', healthCheck);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve mobile preview
  app.use('/mobile-preview', express.static('mobile-preview'));

  // Start monitoring service
  // monitoringService.startMonitoring();
  
  // Initialize database security monitoring
  // databaseSecurityService.startMonitoring();
  
  // Initialize backup service
  // backupService.startAutomatedBackups();
  
  // Initialize data retention service
  // dataRetentionService.startAutomatedCleanup();

  // IMPORTANT: Only setup Vite for non-API routes
  // This ensures API routes are never intercepted by the frontend
  if (app.get("env") === "development") {
    // TEMPORARILY DISABLED FOR API TESTING
    // await setupVite(app, server);
    console.log('Vite disabled for API testing');
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 8000;
  server.listen(port, "127.0.0.1", () => {
    log(`serving on port ${port}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM received, shutting down gracefully');
    // monitoringService.stopMonitoring();
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });
})();
