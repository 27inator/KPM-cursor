import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Server, 
  Database, 
  Network, 
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import PerformanceRecommendations from './performance-recommendations';

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

export default function SystemPerformanceDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch system health
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ['/api/system/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch performance report
  const { data: performanceReport, isLoading: reportLoading, refetch: refetchReport } = useQuery<PerformanceReport>({
    queryKey: ['/api/system/performance-report'],
    refetchInterval: 60000, // Refresh every minute
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'unhealthy': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (healthLoading || reportLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">System Performance Dashboard</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Performance Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchHealth();
              refetchReport();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getStatusIcon(systemHealth?.status || 'unknown')}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(systemHealth?.status || 'unknown')}>
                {systemHealth?.status || 'Unknown'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {systemHealth ? format(new Date(systemHealth.timestamp), 'HH:mm:ss') : 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {systemHealth ? formatUptime(systemHealth.uptime) : 'Unknown'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              System running time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {systemHealth ? formatMemory(systemHealth.memoryUsage.heapUsed) : 'Unknown'}
            </div>
            <Progress 
              value={systemHealth ? (systemHealth.memoryUsage.heapUsed / systemHealth.memoryUsage.heapTotal) * 100 : 0} 
              className="mt-2" 
            />
            <p className="text-xs text-gray-500 mt-1">
              {systemHealth ? `${formatMemory(systemHealth.memoryUsage.heapTotal)} total` : 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {systemHealth ? `${systemHealth.errorRate.toFixed(2)}%` : 'Unknown'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last hour average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Details */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Summary
                </CardTitle>
                <CardDescription>
                  Last hour performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="text-lg font-bold">
                      {performanceReport ? `${performanceReport.performance.avgResponseTime.toFixed(0)}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-lg font-bold">
                      {performanceReport ? `${performanceReport.performance.avgCpuUsage.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-lg font-bold">
                      {performanceReport ? `${performanceReport.performance.avgMemoryUsage.toFixed(0)}MB` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className="text-lg font-bold">
                      {performanceReport ? `${performanceReport.performance.errorRate.toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Performance
                </CardTitle>
                <CardDescription>
                  Database connection and query metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Query Time</span>
                    <span className="text-lg font-bold">
                      {performanceReport ? `${performanceReport.database.avgQueryTime.toFixed(1)}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Connections</span>
                    <span className="text-lg font-bold">
                      {performanceReport ? `${performanceReport.database.avgActiveConnections.toFixed(0)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Health Status</span>
                    <Badge className={getStatusColor(performanceReport?.summary.healthStatus || 'unknown')}>
                      {performanceReport?.summary.healthStatus || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {performanceReport ? `${performanceReport.performance.avgResponseTime.toFixed(0)}ms` : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Average response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {performanceReport ? `${performanceReport.performance.avgCpuUsage.toFixed(1)}%` : 'N/A'}
                </div>
                <Progress 
                  value={performanceReport?.performance.avgCpuUsage || 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {performanceReport ? `${performanceReport.performance.avgMemoryUsage.toFixed(0)}MB` : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Heap memory used</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Network Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Latency</span>
                    <span className="text-lg font-bold">
                      {performanceReport ? `${performanceReport.network.avgLatency.toFixed(1)}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Throughput</span>
                    <span className="text-lg font-bold">
                      {performanceReport ? `${performanceReport.network.avgThroughput.toFixed(0)} req/min` : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rate Limiting</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Security Headers</span>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Input Validation</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <PerformanceRecommendations />
        </TabsContent>
      </Tabs>
    </div>
  );
}