import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Database, 
  Zap,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ErrorLog {
  id: number;
  operationName: string;
  errorType: string;
  severity: string;
  errorMessage: string;
  companyId?: string;
  attempts: number;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

interface DeadLetterQueueItem {
  id: number;
  operationId: string;
  operationName: string;
  attempts: number;
  lastError: string;
  status: string;
  nextRetryAt: string;
  createdAt: string;
}

interface SystemMetric {
  id: number;
  metricType: string;
  metricName: string;
  value: number;
  unit?: string;
  timestamp: string;
}

interface ErrorStats {
  totalFailed: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  circuitBreakerStates: Record<string, string>;
}

export default function ErrorMonitoringDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Query error logs
  const { data: errorLogs = [], isLoading: isLoadingErrors } = useQuery<ErrorLog[]>({
    queryKey: ['/api/error-logs'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query dead letter queue
  const { data: deadLetterQueue = [], isLoading: isLoadingDLQ } = useQuery<DeadLetterQueueItem[]>({
    queryKey: ['/api/dead-letter-queue'],
    refetchInterval: 30000,
  });

  // Query system metrics
  const { data: systemMetrics = [], isLoading: isLoadingMetrics } = useQuery<SystemMetric[]>({
    queryKey: ['/api/system-metrics'],
    refetchInterval: 15000,
  });

  // Query error handler stats
  const { data: errorStats, isLoading: isLoadingStats } = useQuery<ErrorStats>({
    queryKey: ['/api/error-handler/stats'],
    refetchInterval: 10000,
  });

  // Mutation to resolve error
  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: number) => {
      await apiRequest(`/api/error-logs/${errorId}/resolve`, {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/error-logs'] });
      toast({
        title: "Error Resolved",
        description: "Error has been marked as resolved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to resolve error",
        variant: "destructive",
      });
    },
  });

  // Mutation to remove from dead letter queue
  const removeDLQMutation = useMutation({
    mutationFn: async (operationId: string) => {
      await apiRequest(`/api/dead-letter-queue/${operationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dead-letter-queue'] });
      toast({
        title: "Operation Removed",
        description: "Operation removed from dead letter queue",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove operation",
        variant: "destructive",
      });
    },
  });

  // Mutation to test blockchain error handling
  const testBlockchainErrorMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/test/blockchain-error', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Completed",
        description: "Blockchain error handling test completed",
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: "Blockchain error handling test failed as expected",
        variant: "destructive",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case 'CLOSED': return 'bg-green-100 text-green-800 border-green-200';
      case 'OPEN': return 'bg-red-100 text-red-800 border-red-200';
      case 'HALF_OPEN': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const unresolvedErrors = errorLogs?.filter(log => !log.resolved) || [];
  const criticalErrors = errorLogs?.filter(log => log.severity === 'critical') || [];
  // Fix uptime calculation - convert seconds to percentage (assuming 24h = 100%)
  const uptimeSeconds = systemMetrics?.find(m => m.metricName === 'uptime')?.value ?? 86400;
  const systemUptime = Math.min((uptimeSeconds / 86400) * 100, 100); // Cap at 100%

  // Show loading state
  if (isLoadingErrors || isLoadingDLQ || isLoadingMetrics || isLoadingStats) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Error Monitoring Dashboard</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading error monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Error Monitoring Dashboard</h1>
          <p className="text-gray-600">Real-time system health and error tracking</p>
        </div>
        <Button 
          onClick={() => testBlockchainErrorMutation.mutate()}
          disabled={testBlockchainErrorMutation.isPending}
          variant="outline"
        >
          <Zap className="w-4 h-4 mr-2" />
          Test Error Handling
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemUptime.toFixed(2)}%</div>
            <Progress value={systemUptime} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {uptimeSeconds > 86400 ? 'More than 24h' : `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedErrors.length}</div>
            <p className="text-xs text-gray-600">
              {criticalErrors.length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dead Letter Queue</CardTitle>
            <Database className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deadLetterQueue?.length || 0}</div>
            <p className="text-xs text-gray-600">
              Failed operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Failures</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats?.totalFailed || 0}</div>
            <p className="text-xs text-gray-600">
              All-time failures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Circuit Breaker Status */}
      {errorStats?.circuitBreakerStates && Object.keys(errorStats.circuitBreakerStates).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Circuit Breaker Status
            </CardTitle>
            <CardDescription>
              Current state of circuit breakers for different operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(errorStats.circuitBreakerStates).map(([operation, state]) => (
                <div key={operation} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="font-medium">{operation}</span>
                  <Badge className={getCircuitBreakerColor(state)}>
                    {state}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Error Logs</TabsTrigger>
          <TabsTrigger value="dlq">Dead Letter Queue</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Error Logs</CardTitle>
              <CardDescription>
                Latest system errors and their resolution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingErrors ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : errorLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No errors detected. System is healthy!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errorLogs.slice(0, 10).map((error) => (
                    <div key={error.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(error.severity)}>
                            {error.severity}
                          </Badge>
                          <span className="font-medium">{error.operationName}</span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(error.createdAt), 'PPp')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{error.errorMessage}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Type: {error.errorType}</span>
                          <span>Attempts: {error.attempts}</span>
                          {error.companyId && <span>Company: {error.companyId}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {error.resolved ? (
                          <Badge variant="secondary">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => resolveErrorMutation.mutate(error.id)}
                            disabled={resolveErrorMutation.isPending}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dlq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dead Letter Queue</CardTitle>
              <CardDescription>
                Failed operations awaiting retry or manual intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDLQ ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : deadLetterQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No failed operations in queue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deadLetterQueue.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">{item.status}</Badge>
                          <span className="font-medium">{item.operationName}</span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(item.createdAt), 'PPp')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{item.lastError}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Attempts: {item.attempts}</span>
                          <span>Next retry: {format(new Date(item.nextRetryAt), 'PPp')}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeDLQMutation.mutate(item.operationId)}
                        disabled={removeDLQMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
              <CardDescription>
                Real-time performance and health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMetrics ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemMetrics?.slice(0, 12).map((metric) => (
                    <div key={metric.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{metric.metricName || 'Unknown'}</span>
                        <Badge variant="outline">{metric.metricType || 'system'}</Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {Number(metric.value || 0).toFixed(2)}
                        {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(metric.timestamp || new Date()), 'PPp')}
                      </p>
                    </div>
                  )) || []}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Statistics */}
      {errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Errors by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(errorStats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Errors by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{severity}</span>
                    <Badge className={getSeverityColor(severity)}>{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}