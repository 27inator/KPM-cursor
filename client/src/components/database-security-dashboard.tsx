import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Database, 
  Shield, 
  HardDrive, 
  Clock, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Download,
  Play,
  Pause,
  Trash2,
  RefreshCw
} from "lucide-react";

interface DatabaseHealth {
  connectionCount: number;
  queryLatency: number;
  errorRate: number;
  lastBackup: string;
}

interface BackupMetrics {
  lastBackup: string;
  backupSize: number;
  backupStatus: 'success' | 'failed' | 'in_progress';
  nextScheduledBackup: string;
  retentionDays: number;
}

interface BackupConfiguration {
  enabled: boolean;
  schedule: string;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

interface RetentionPolicy {
  id: string;
  dataType: string;
  retentionDays: number;
  enabled: boolean;
  lastCleanup: string;
  itemsDeleted: number;
}

interface RetentionMetrics {
  totalPolicies: number;
  activePolicies: number;
  lastCleanupRun: string;
  totalItemsDeleted: number;
  storageReclaimed: number;
}

export default function DatabaseSecurityDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [policyEdits, setPolicyEdits] = useState<Partial<RetentionPolicy>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database health metrics
  const { data: databaseHealth } = useQuery<DatabaseHealth>({
    queryKey: ['/api/database/health'],
    refetchInterval: 30000,
  });

  // Fetch backup status
  const { data: backupMetrics } = useQuery<BackupMetrics>({
    queryKey: ['/api/backup/status'],
    refetchInterval: 30000,
  });

  // Fetch backup configuration
  const { data: backupConfig } = useQuery<BackupConfiguration>({
    queryKey: ['/api/backup/configuration'],
  });

  // Fetch backup history
  const { data: backupHistory } = useQuery<BackupMetrics[]>({
    queryKey: ['/api/backup/history'],
  });

  // Fetch retention policies
  const { data: retentionPolicies } = useQuery<RetentionPolicy[]>({
    queryKey: ['/api/data-retention/policies'],
  });

  // Fetch retention metrics
  const { data: retentionMetrics } = useQuery<RetentionMetrics>({
    queryKey: ['/api/data-retention/metrics'],
  });

  // Create backup mutation
  const createBackup = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/backup/create');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup Created",
        description: "Database backup has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/history'] });
    },
    onError: (error) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to create backup",
        variant: "destructive",
      });
    },
  });

  // Verify backup mutation
  const verifyBackup = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/backup/verify');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.valid ? "Backup Verified" : "Verification Failed",
        description: data.message,
        variant: data.valid ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify backup",
        variant: "destructive",
      });
    },
  });

  // Update backup configuration mutation
  const updateBackupConfig = useMutation({
    mutationFn: async (config: Partial<BackupConfiguration>) => {
      const response = await apiRequest('PUT', '/api/backup/configuration', config);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Backup configuration has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/configuration'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update backup configuration",
        variant: "destructive",
      });
    },
  });

  // Update retention policy mutation
  const updateRetentionPolicy = useMutation({
    mutationFn: async ({ policyId, updates }: { policyId: string; updates: Partial<RetentionPolicy> }) => {
      const response = await apiRequest('PUT', `/api/data-retention/policies/${policyId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Policy Updated",
        description: "Retention policy has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/data-retention/policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/data-retention/metrics'] });
      setEditingPolicy(null);
      setPolicyEdits({});
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update retention policy",
        variant: "destructive",
      });
    },
  });

  // Execute cleanup mutation
  const executeCleanup = useMutation({
    mutationFn: async (policyId?: string) => {
      const response = await apiRequest('POST', '/api/data-retention/cleanup', { policyId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup Completed",
        description: `Data retention cleanup completed. ${data.results.length} policies processed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/data-retention/policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/data-retention/metrics'] });
    },
    onError: (error) => {
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to execute cleanup",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatus = (metrics: DatabaseHealth) => {
    if (!metrics) return { status: 'unknown', color: 'bg-gray-100 text-gray-800' };
    
    const latencyOk = metrics.queryLatency < 1000;
    const errorRateOk = metrics.errorRate < 0.05;
    
    if (latencyOk && errorRateOk) {
      return { status: 'healthy', color: 'bg-green-100 text-green-800' };
    } else if (latencyOk || errorRateOk) {
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'critical', color: 'bg-red-100 text-red-800' };
    }
  };

  const handlePolicyEdit = (policyId: string, field: string, value: any) => {
    setPolicyEdits(prev => ({ ...prev, [field]: value }));
  };

  const savePolicyChanges = (policyId: string) => {
    updateRetentionPolicy.mutate({ policyId, updates: policyEdits });
  };

  const cancelPolicyEdit = () => {
    setEditingPolicy(null);
    setPolicyEdits({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Security & Backup Management</h2>
          <p className="text-gray-600 mt-1">Advanced database security monitoring, backup management, and data retention policies</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => createBackup.mutate()}
            disabled={createBackup.isPending}
            className="bg-kaspa-600 hover:bg-kaspa-700"
          >
            {createBackup.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <HardDrive className="h-4 w-4 mr-2" />}
            Create Backup
          </Button>
          <Button
            onClick={() => verifyBackup.mutate()}
            disabled={verifyBackup.isPending}
            variant="outline"
          >
            {verifyBackup.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Verify Backup
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="backup">Backup Management</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Health</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {databaseHealth && (
                    <Badge className={getHealthStatus(databaseHealth).color}>
                      {getHealthStatus(databaseHealth).status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {databaseHealth?.connectionCount || 0} active connections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backupMetrics && (
                    <Badge className={getStatusColor(backupMetrics.backupStatus)}>
                      {backupMetrics.backupStatus}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {backupMetrics?.lastBackup ? formatDate(backupMetrics.lastBackup) : 'Never'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Query Performance</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {databaseHealth?.queryLatency || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average query latency
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Reclaimed</CardTitle>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {retentionMetrics?.storageReclaimed || 0}MB
                </div>
                <p className="text-xs text-muted-foreground">
                  From data retention cleanup
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Performance Metrics</CardTitle>
                <CardDescription>Real-time database health indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Query Latency</span>
                      <span>{databaseHealth?.queryLatency || 0}ms</span>
                    </div>
                    <Progress value={Math.min((databaseHealth?.queryLatency || 0) / 1000 * 100, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Error Rate</span>
                      <span>{((databaseHealth?.errorRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <Progress value={(databaseHealth?.errorRate || 0) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Connection Count</span>
                      <span>{databaseHealth?.connectionCount || 0}</span>
                    </div>
                    <Progress value={Math.min((databaseHealth?.connectionCount || 0) / 20 * 100, 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Summary</CardTitle>
                <CardDescription>Data retention policy overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Policies</span>
                    <span className="font-semibold">{retentionMetrics?.totalPolicies || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Policies</span>
                    <span className="font-semibold">{retentionMetrics?.activePolicies || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Items Deleted</span>
                    <span className="font-semibold">{retentionMetrics?.totalItemsDeleted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Cleanup</span>
                    <span className="font-semibold text-xs">
                      {retentionMetrics?.lastCleanupRun ? formatDate(retentionMetrics.lastCleanupRun) : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Backup History</CardTitle>
                <CardDescription>Recent database backup operations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Retention</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupHistory?.map((backup, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {formatDate(backup.lastBackup)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(backup.backupStatus)}>
                            {backup.backupStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{backup.backupSize}MB</TableCell>
                        <TableCell>{backup.retentionDays} days</TableCell>
                      </TableRow>
                    ))}
                    {(!backupHistory || backupHistory.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          No backup history available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backup Status</CardTitle>
                <CardDescription>Current backup information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Last Backup</span>
                    <span className="font-semibold text-xs">
                      {backupMetrics?.lastBackup ? formatDate(backupMetrics.lastBackup) : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Backup Size</span>
                    <span className="font-semibold">{backupMetrics?.backupSize || 0}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status</span>
                    <Badge className={getStatusColor(backupMetrics?.backupStatus || 'unknown')}>
                      {backupMetrics?.backupStatus || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Next Backup</span>
                    <span className="font-semibold text-xs">
                      {backupMetrics?.nextScheduledBackup ? formatDate(backupMetrics.nextScheduledBackup) : 'Not scheduled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Data Retention Policies</h3>
              <p className="text-sm text-gray-600">Configure automated data cleanup policies</p>
            </div>
            <Button
              onClick={() => executeCleanup.mutate()}
              disabled={executeCleanup.isPending}
              className="bg-kaspa-600 hover:bg-kaspa-700"
            >
              {executeCleanup.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Run Cleanup
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Retention Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Cleanup</TableHead>
                    <TableHead>Items Deleted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retentionPolicies?.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.dataType}</TableCell>
                      <TableCell>
                        {editingPolicy === policy.id ? (
                          <Input
                            type="number"
                            value={policyEdits.retentionDays ?? policy.retentionDays}
                            onChange={(e) => handlePolicyEdit(policy.id, 'retentionDays', parseInt(e.target.value))}
                            className="w-20"
                          />
                        ) : (
                          `${policy.retentionDays} days`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPolicy === policy.id ? (
                          <Switch
                            checked={policyEdits.enabled ?? policy.enabled}
                            onCheckedChange={(checked) => handlePolicyEdit(policy.id, 'enabled', checked)}
                          />
                        ) : (
                          <Badge variant={policy.enabled ? "default" : "secondary"}>
                            {policy.enabled ? 'Active' : 'Inactive'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(policy.lastCleanup)}
                      </TableCell>
                      <TableCell>{policy.itemsDeleted}</TableCell>
                      <TableCell>
                        {editingPolicy === policy.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => savePolicyChanges(policy.id)}
                              disabled={updateRetentionPolicy.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelPolicyEdit}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPolicy(policy.id)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Configuration</CardTitle>
              <CardDescription>Configure automated backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="backup-enabled">Enable Automated Backups</Label>
                  <p className="text-sm text-gray-600">Automatically create database backups on schedule</p>
                </div>
                <Switch
                  id="backup-enabled"
                  checked={backupConfig?.enabled || false}
                  onCheckedChange={(enabled) => updateBackupConfig.mutate({ enabled })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention-days">Retention Days</Label>
                <Input
                  id="retention-days"
                  type="number"
                  value={backupConfig?.retentionDays || 30}
                  onChange={(e) => updateBackupConfig.mutate({ retentionDays: parseInt(e.target.value) })}
                  className="w-32"
                />
                <p className="text-sm text-gray-600">Number of days to keep backups</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compression">Enable Compression</Label>
                  <p className="text-sm text-gray-600">Compress backups to save storage space</p>
                </div>
                <Switch
                  id="compression"
                  checked={backupConfig?.compressionEnabled || false}
                  onCheckedChange={(compressionEnabled) => updateBackupConfig.mutate({ compressionEnabled })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="encryption">Enable Encryption</Label>
                  <p className="text-sm text-gray-600">Encrypt backups for enhanced security</p>
                </div>
                <Switch
                  id="encryption"
                  checked={backupConfig?.encryptionEnabled || false}
                  onCheckedChange={(encryptionEnabled) => updateBackupConfig.mutate({ encryptionEnabled })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Backup Schedule</Label>
                <Input
                  id="schedule"
                  value={backupConfig?.schedule || '0 2 * * *'}
                  onChange={(e) => updateBackupConfig.mutate({ schedule: e.target.value })}
                  placeholder="0 2 * * * (Daily at 2 AM)"
                />
                <p className="text-sm text-gray-600">Cron expression for backup schedule</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}