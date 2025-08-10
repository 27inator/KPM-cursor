import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Clock,
  FileText,
  Users,
  Activity,
  TrendingUp,
  Lock,
  Eye,
  UserCheck
} from "lucide-react";

interface ComplianceMetrics {
  totalRequests: number;
  failedRequests: number;
  securityIncidents: number;
  dataAccessLogs: number;
  passwordChanges: number;
  sessionActivity: number;
  complianceScore: number;
}

interface SecurityIncident {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface AuditLog {
  id: number;
  action: string;
  userId?: string;
  companyId?: string;
  resourceType?: string;
  ipAddress?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const SecurityComplianceDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch compliance metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<ComplianceMetrics>({
    queryKey: ['/api/security/compliance-metrics', selectedTimeRange],
    queryFn: () => apiRequest(`/api/security/compliance-metrics?days=${selectedTimeRange}`),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch security incidents
  const { data: incidents, isLoading: incidentsLoading } = useQuery<SecurityIncident[]>({
    queryKey: ['/api/security/incidents'],
    queryFn: () => apiRequest('/api/security/incidents?limit=20'),
    refetchInterval: 30000,
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/security/audit-logs'],
    queryFn: () => apiRequest('/api/security/audit-logs?limit=50'),
    refetchInterval: 30000,
  });

  // Resolve security incident mutation
  const resolveIncidentMutation = useMutation({
    mutationFn: (incidentId: number) => 
      apiRequest(`/api/security/incidents/${incidentId}/resolve`, {
        method: 'PUT'
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Security incident resolved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/security/incidents'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve security incident",
        variant: "destructive",
      });
    }
  });

  // Export compliance data mutation
  const exportDataMutation = useMutation({
    mutationFn: ({ format }: { format: 'json' | 'csv' }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedTimeRange));
      const endDate = new Date();
      
      return apiRequest(`/api/security/export-compliance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&format=${format}`, {
        method: 'GET'
      });
    },
    onSuccess: (data, variables) => {
      const blob = new Blob([data], { 
        type: variables.format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.${variables.format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Compliance report exported as ${variables.format.toUpperCase()}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export compliance data",
        variant: "destructive",
      });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-yellow-400';
      case 'low': return 'bg-green-400';
      default: return 'bg-gray-400';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security & Compliance Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor security incidents, audit logs, and compliance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button
            onClick={() => exportDataMutation.mutate({ format: 'json' })}
            disabled={exportDataMutation.isPending}
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button
            onClick={() => exportDataMutation.mutate({ format: 'csv' })}
            disabled={exportDataMutation.isPending}
            size="sm"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceScoreColor(metrics?.complianceScore || 0)}`}>
              {metrics?.complianceScore?.toFixed(1) || 0}%
            </div>
            <Progress value={metrics?.complianceScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.securityIncidents || 0}</div>
            <p className="text-xs text-muted-foreground">
              {incidents?.filter(i => !i.resolved).length || 0} unresolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.failedRequests || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Activity</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.sessionActivity || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.passwordChanges || 0} password changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Report</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Security Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incidentsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents?.map((incident) => (
                    <Alert key={incident.id} className="border-l-4 border-l-red-500">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getSeverityColor(incident.severity)}>
                                {incident.severity.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {incident.type.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(incident.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{incident.description}</p>
                            {incident.ipAddress && (
                              <p className="text-xs text-gray-500">
                                IP: {incident.ipAddress}
                              </p>
                            )}
                            {incident.resolved && (
                              <p className="text-xs text-green-600">
                                Resolved: {formatDate(incident.resolvedAt!)} by {incident.resolvedBy}
                              </p>
                            )}
                          </div>
                          {!incident.resolved && (
                            <Button
                              size="sm"
                              onClick={() => resolveIncidentMutation.mutate(incident.id)}
                              disabled={resolveIncidentMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  {incidents?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No security incidents found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs?.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{log.action}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          {log.userId && <span>User: {log.userId}</span>}
                          {log.companyId && <span>Company: {log.companyId}</span>}
                          {log.resourceType && <span>Resource: {log.resourceType}</span>}
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {auditLogs?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No audit logs found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Compliance Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Security Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Data Access Logs</span>
                        <Badge variant="outline">{metrics?.dataAccessLogs || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Failed Requests</span>
                        <Badge variant="outline">{metrics?.failedRequests || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Security Incidents</span>
                        <Badge variant="outline">{metrics?.securityIncidents || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Password Changes</span>
                        <Badge variant="outline">{metrics?.passwordChanges || 0}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Compliance Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          (metrics?.complianceScore || 0) >= 90 ? 'bg-green-500' : 
                          (metrics?.complianceScore || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm">
                          Overall Compliance: {(metrics?.complianceScore || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          (metrics?.failedRequests || 0) === 0 ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm">
                          Request Success Rate: {
                            metrics?.totalRequests 
                              ? (((metrics.totalRequests - metrics.failedRequests) / metrics.totalRequests) * 100).toFixed(1)
                              : 0
                          }%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          (metrics?.securityIncidents || 0) === 0 ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm">
                          Security Status: {
                            (metrics?.securityIncidents || 0) === 0 ? 'Clean' : 'Incidents Detected'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityComplianceDashboard;