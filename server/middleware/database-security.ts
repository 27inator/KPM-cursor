import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Database connection security middleware
export const databaseConnectionSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Add request tracking for database security
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow database queries
    if (duration > 2000) {
      storage.createSecurityIncident({
        type: 'slow_database_query',
        severity: 'medium',
        description: `Slow database query detected: ${req.method} ${req.url} took ${duration}ms`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        resolved: false
      }).catch(error => {
        console.error('Failed to log slow database query:', error);
      });
    }
  });
  
  next();
};

// Database query sanitization
export const sanitizeQuery = (query: any): any => {
  if (typeof query === 'string') {
    // Remove potentially dangerous SQL keywords
    return query.replace(/\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE|UNION|INSERT|UPDATE)\b/gi, '');
  }
  
  if (typeof query === 'object' && query !== null) {
    const sanitized: any = {};
    for (const key in query) {
      sanitized[key] = sanitizeQuery(query[key]);
    }
    return sanitized;
  }
  
  return query;
};

// Database transaction logging
export const logDatabaseTransaction = async (operation: string, table: string, data: any, userId?: string) => {
  try {
    await storage.createAuditLog({
      action: `database_${operation}`,
      userId,
      resourceType: table,
      ipAddress: 'system',
      metadata: {
        operation,
        table,
        dataSize: JSON.stringify(data).length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log database transaction:', error);
  }
};

// Database backup status monitoring
export const monitorDatabaseHealth = async () => {
  try {
    const healthMetrics = {
      connectionCount: await getDatabaseConnectionCount(),
      queryLatency: await getAverageQueryLatency(),
      errorRate: await getDatabaseErrorRate(),
      lastBackup: await getLastBackupTime()
    };
    
    // Create alerts for database health issues
    if (healthMetrics.queryLatency > 1000) {
      await storage.createSecurityIncident({
        type: 'database_performance',
        severity: 'high',
        description: `Database query latency is high: ${healthMetrics.queryLatency}ms`,
        ipAddress: 'system',
        userAgent: 'database_monitor',
        resolved: false
      });
    }
    
    if (healthMetrics.errorRate > 0.05) {
      await storage.createSecurityIncident({
        type: 'database_errors',
        severity: 'high',
        description: `Database error rate is high: ${(healthMetrics.errorRate * 100).toFixed(2)}%`,
        ipAddress: 'system',
        userAgent: 'database_monitor',
        resolved: false
      });
    }
    
    return healthMetrics;
  } catch (error) {
    console.error('Failed to monitor database health:', error);
    return null;
  }
};

// Helper functions for database monitoring
async function getDatabaseConnectionCount(): Promise<number> {
  // Mock implementation - in production, query actual connection pool
  return Math.floor(Math.random() * 20) + 1;
}

async function getAverageQueryLatency(): Promise<number> {
  // Mock implementation - in production, calculate from query logs
  return Math.floor(Math.random() * 500) + 100;
}

async function getDatabaseErrorRate(): Promise<number> {
  // Mock implementation - in production, calculate from error logs
  return Math.random() * 0.1;
}

async function getLastBackupTime(): Promise<string> {
  // Mock implementation - in production, check actual backup status
  const backupTime = new Date();
  backupTime.setHours(backupTime.getHours() - Math.floor(Math.random() * 24));
  return backupTime.toISOString();
}

// Database security service
export const databaseSecurityService = {
  startMonitoring: () => {
    // Monitor database health every 5 minutes
    setInterval(monitorDatabaseHealth, 5 * 60 * 1000);
  },
  
  getHealthMetrics: monitorDatabaseHealth,
  sanitizeQuery,
  logTransaction: logDatabaseTransaction
};