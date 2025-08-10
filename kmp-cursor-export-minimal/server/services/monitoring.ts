import { storage } from '../storage';

interface MetricData {
  [key: string]: any;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  errorRate: number;
  responseTime: number;
  timestamp: string;
}

interface PerformanceReport {
  timeRange: {
    start: string;
    end: string;
  };
  performance: {
    avgResponseTime: number;
    avgCpuUsage: number;
    avgMemoryUsage: number;
    errorRate: number;
  };
  database: {
    avgQueryTime: number;
    avgActiveConnections: number;
  };
  network: {
    avgLatency: number;
    avgThroughput: number;
  };
  summary: {
    totalMetrics: number;
    healthStatus: string;
  };
}

class MonitoringService {
  private metrics: Map<string, any[]> = new Map();
  private startTime: number = Date.now();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startTime = Date.now();
  }

  // Record a metric with metadata
  recordMetric(type: string, value: number, metadata: MetricData = {}) {
    const metric = {
      type,
      value,
      timestamp: Date.now(),
      metadata,
    };

    // Store in memory (for immediate access)
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const typeMetrics = this.metrics.get(type)!;
    typeMetrics.push(metric);
    
    // Keep only last 1000 metrics per type
    if (typeMetrics.length > 1000) {
      typeMetrics.shift();
    }

    // Store in database periodically
    this.persistMetric(type, value, metadata);
  }

  // Persist metric to database
  private async persistMetric(type: string, value: number, metadata: MetricData) {
    try {
      await storage.createSystemMetric({
        metricType: type,
        metricName: type,
        value: value,
        metadata: JSON.stringify(metadata),
        timestamp: new Date(),
      });
    } catch (error) {
      // Fail silently to avoid infinite loops
      console.warn('Failed to persist metric:', error);
    }
  }

  // Get system health status
  async getSystemHealth(): Promise<SystemHealth> {
    const now = Date.now();
    const uptime = Math.floor((now - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    // Calculate error rate from recent metrics
    const errorMetrics = this.metrics.get('error_count') || [];
    const responseMetrics = this.metrics.get('response_time') || [];
    
    const recentErrors = errorMetrics.filter(m => now - m.timestamp < 3600000); // Last hour
    const recentResponses = responseMetrics.filter(m => now - m.timestamp < 3600000);
    
    const errorRate = recentResponses.length > 0 ? 
      (recentErrors.length / recentResponses.length) * 100 : 0;

    const avgResponseTime = recentResponses.length > 0 ?
      recentResponses.reduce((sum, m) => sum + m.value, 0) / recentResponses.length : 0;

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > 10 || avgResponseTime > 2000 || memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      status = 'unhealthy';
    } else if (errorRate > 5 || avgResponseTime > 1000 || memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
      status = 'degraded';
    }

    return {
      status,
      uptime,
      memoryUsage,
      errorRate,
      responseTime: avgResponseTime,
      timestamp: new Date().toISOString(),
    };
  }

  // Generate performance report
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const start = new Date(oneHourAgo).toISOString();
    const end = new Date(now).toISOString();

    // Get recent metrics
    const responseMetrics = this.metrics.get('response_time') || [];
    const cpuMetrics = this.metrics.get('cpu_usage') || [];
    const memoryMetrics = this.metrics.get('memory_usage') || [];
    const errorMetrics = this.metrics.get('error_count') || [];
    const requestMetrics = this.metrics.get('request_count') || [];

    // Filter to last hour
    const recentResponse = responseMetrics.filter(m => m.timestamp >= oneHourAgo);
    const recentCpu = cpuMetrics.filter(m => m.timestamp >= oneHourAgo);
    const recentMemory = memoryMetrics.filter(m => m.timestamp >= oneHourAgo);
    const recentErrors = errorMetrics.filter(m => m.timestamp >= oneHourAgo);
    const recentRequests = requestMetrics.filter(m => m.timestamp >= oneHourAgo);

    // Calculate averages
    const avgResponseTime = recentResponse.length > 0 ?
      recentResponse.reduce((sum, m) => sum + m.value, 0) / recentResponse.length : 0;

    const avgCpuUsage = recentCpu.length > 0 ?
      recentCpu.reduce((sum, m) => sum + m.value, 0) / recentCpu.length : 0;

    const avgMemoryUsage = recentMemory.length > 0 ?
      recentMemory.reduce((sum, m) => sum + m.value, 0) / recentMemory.length / 1024 / 1024 : 0;

    const errorRate = recentRequests.length > 0 ?
      (recentErrors.length / recentRequests.length) * 100 : 0;

    // Mock database and network metrics (would be real in production)
    const avgQueryTime = 15 + Math.random() * 10; // 15-25ms
    const avgActiveConnections = 5 + Math.random() * 3; // 5-8 connections
    const avgLatency = 50 + Math.random() * 20; // 50-70ms
    const avgThroughput = recentRequests.length * 60 / 60; // requests per minute

    const health = await this.getSystemHealth();

    return {
      timeRange: { start, end },
      performance: {
        avgResponseTime,
        avgCpuUsage: avgCpuUsage * 100, // Convert to percentage
        avgMemoryUsage,
        errorRate,
      },
      database: {
        avgQueryTime,
        avgActiveConnections,
      },
      network: {
        avgLatency,
        avgThroughput,
      },
      summary: {
        totalMetrics: recentResponse.length + recentCpu.length + recentMemory.length + recentErrors.length,
        healthStatus: health.status,
      },
    };
  }

  // Start monitoring system metrics
  startMonitoring() {
    console.log('Starting system monitoring...');
    
    this.monitoringInterval = setInterval(() => {
      // Record system metrics
      const memUsage = process.memoryUsage();
      this.recordMetric('memory_usage', memUsage.heapUsed, {
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      });

      // Record CPU usage (approximate)
      const cpuUsage = process.cpuUsage();
      this.recordMetric('cpu_usage', (cpuUsage.user + cpuUsage.system) / 1000000);

      // Record uptime
      this.recordMetric('uptime', process.uptime());

      // Record additional performance metrics
      this.recordMetric('heap_memory_percentage', (memUsage.heapUsed / memUsage.heapTotal) * 100);
      this.recordMetric('active_handles', process._getActiveHandles().length);
      this.recordMetric('active_requests', process._getActiveRequests().length);
      
      // Memory pressure indicators
      this.recordMetric('memory_pressure_score', Math.min(100, (memUsage.heapUsed / memUsage.heapTotal) * 100 + (memUsage.external / (1024 * 1024 * 50)) * 10));
      
      // Calculate recent error rates
      const recentErrors = this.getMetrics('error_count').filter(m => 
        Date.now() - m.timestamp < 300000 // Last 5 minutes
      );
      this.recordMetric('recent_error_rate', recentErrors.length);
      
      // Calculate recent response times
      const recentResponses = this.getMetrics('response_time').filter(m => 
        Date.now() - m.timestamp < 300000 // Last 5 minutes
      );
      if (recentResponses.length > 0) {
        const avgResponseTime = recentResponses.reduce((sum, m) => sum + m.value, 0) / recentResponses.length;
        this.recordMetric('avg_response_time_5min', avgResponseTime);
        
        // Track slow requests specifically
        const slowRequests = recentResponses.filter(m => m.value > 1000).length;
        this.recordMetric('slow_requests_count', slowRequests);
      }
      
      // System health indicators
      const memoryPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const errorRate = recentErrors.length;
      const avgResponseTime = recentResponses.length > 0 ? recentResponses.reduce((sum, m) => sum + m.value, 0) / recentResponses.length : 0;
      
      // Overall system health score (0-100)
      let healthScore = 100;
      if (memoryPercentage > 80) healthScore -= 30;
      else if (memoryPercentage > 65) healthScore -= 15;
      if (avgResponseTime > 1000) healthScore -= 25;
      else if (avgResponseTime > 500) healthScore -= 10;
      if (errorRate > 5) healthScore -= 20;
      else if (errorRate > 2) healthScore -= 10;
      
      this.recordMetric('system_health_score', Math.max(0, healthScore));

    }, 30000); // Every 30 seconds
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Monitoring stopped');
  }

  // Get metrics by type
  getMetrics(type: string, limit: number = 100): any[] {
    const metrics = this.metrics.get(type) || [];
    return metrics.slice(-limit);
  }

  // Get all metric types
  getMetricTypes(): string[] {
    return Array.from(this.metrics.keys());
  }

  // Clear old metrics
  clearOldMetrics(olderThan: number = 86400000) { // 24 hours
    const cutoff = Date.now() - olderThan;
    
    for (const [type, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp >= cutoff);
      this.metrics.set(type, filtered);
    }
  }
}

export const monitoringService = new MonitoringService();