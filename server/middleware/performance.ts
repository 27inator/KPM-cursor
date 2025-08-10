import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoring';

// Response time tracking middleware
export const responseTimeTracker = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Track response time
    monitoringService.recordMetric('response_time', duration, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      userAgent: req.get('user-agent'),
    });
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration.toFixed(0)}ms`);
    }
  });

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('user-agent') || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Log request details
  monitoringService.recordMetric('request_count', 1, {
    method: req.method,
    path: req.path,
    ip,
    userAgent,
    timestamp,
  });
  
  next();
};

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const health = await monitoringService.getSystemHealth();
    
    const status = health.status === 'healthy' ? 200 : 
                   health.status === 'degraded' ? 200 : 503;
    
    res.status(status).json({
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      memory: health.memoryUsage,
      checks: {
        database: 'healthy', // Would check actual database connection
        redis: 'healthy',    // Would check Redis if used
        external_apis: 'healthy' // Would check external API endpoints
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Memory usage tracking middleware
export const memoryTracker = (req: Request, res: Response, next: NextFunction) => {
  const memUsage = process.memoryUsage();
  
  monitoringService.recordMetric('memory_usage', memUsage.heapUsed, {
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    rss: memUsage.rss,
  });
  
  next();
};

// Error tracking middleware
export const errorTracker = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Record error metrics
  monitoringService.recordMetric('error_count', 1, {
    method: req.method,
    path: req.path,
    errorMessage: err.message,
    errorStack: err.stack,
    statusCode: res.statusCode,
  });
  
  // Log error details
  console.error('Request error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });
  
  next(err);
};

// CPU usage tracking (approximate)
export const cpuTracker = (req: Request, res: Response, next: NextFunction) => {
  const start = process.cpuUsage();
  
  res.on('finish', () => {
    const end = process.cpuUsage(start);
    const cpuPercent = (end.user + end.system) / 1000000; // Convert to seconds
    
    monitoringService.recordMetric('cpu_usage', cpuPercent, {
      method: req.method,
      path: req.path,
    });
  });
  
  next();
};